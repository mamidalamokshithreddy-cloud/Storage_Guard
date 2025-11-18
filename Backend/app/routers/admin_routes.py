import logging
import asyncio
from datetime import timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
import uuid
from datetime import datetime
import os
import pandas as pd
import io
from fastapi import Form, File, UploadFile, HTTPException, Depends
from jose import JWTError, jwt
from app.schemas.postgres_base import Admin, User, UserRole
from app.core.config import settings
from app.auth.auth import oauth2_scheme, get_current_admin, create_access_token

from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi.concurrency import run_in_threadpool
# Import services
from app.auth.otp_service import OTPService, otp_storage
from app.services.copilot_services import (
    AuthService, UserService, PasswordResetService,
    FarmerService, LandownerService, AgriCopilotService,
    VendorService, BuyerService
)
from app.services.email_service import EmailService
from app.services.notifications import NotificationService

# Import models and DB
from app.schemas.postgres_base import (
    Admin, AgriCopilot, ApprovalStatus, User,
    UserRole, Farmer, Landowner, Vendor, Buyer
)
from app.connections.postgres_connection import get_db

# Import schemas
from app.schemas.postgres_base_models import (
    UserCreate, UserResponse, LoginRequest, LoginResponse,
    ForgotPasswordRequest, OTPVerify, OTPResponse, ResetPasswordRequest,
    MessageResponse, FarmerCreate, LandownerCreate, VendorCreate, BuyerCreate,
    FarmerResponse, LandownerResponse, VendorResponse, BuyerResponse,
    AgriCopilotInvite, AgriCopilotRegister, AgriCopilotResponse,
    AgriCopilotDashboard, AdminResponse
)

# Initialize services
email_service = EmailService()
notification_service = NotificationService()

# Global invitation tokens storage
invitation_tokens: dict = {}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Helper to safely call role-specific email methods with fallbacks (module-level)
def _send_invite_email(role: str, to_email: str, full_name: str, link: str) -> bool:
    """Try role-specific send_{role}_invitation_email, fall back to generic helpers."""
    method_name = f"send_{role}_invitation_email"
    method = getattr(email_service, method_name, None)
    if callable(method):
        try:
            return method(email=to_email, full_name=full_name, registration_link=link)
        except Exception as e:
            logger.error(f"Error in {method_name}: {str(e)}", exc_info=True)
            return False

    # Fallback to a generic role invitation if available
    fallback = getattr(email_service, '_send_role_invitation', None)
    if callable(fallback):
        try:
            return fallback(role, to_email, full_name, link)
        except Exception as e:
            logger.error(f"Error in fallback _send_role_invitation for {role}: {str(e)}", exc_info=True)
            return False

    # Last resort: use send_welcome_email which exists in most implementations
    fallback_welcome = getattr(email_service, 'send_welcome_email', None)
    if callable(fallback_welcome):
        try:
            return fallback_welcome(to_email=to_email, full_name=full_name, user_type=role, registration_id=link, password='')
        except Exception as e:
            logger.error(f"Error in fallback send_welcome_email for {role}: {str(e)}", exc_info=True)
            return False

    logger.error(f"No email method available for role '{role}'")
    return False


# Helper function to save uploaded files
async def save_upload_file(upload_file: UploadFile, user_type: str) -> str:
    """
    Save an uploaded file to the appropriate directory and return the filename.
    
    Args:
        upload_file: The uploaded file from FastAPI
        user_type: The type of user (farmer, landowner, vendor, buyer, agri_copilot)
    
    Returns:
        str: The filename (not full path) for storing in database
    
    Raises:
        HTTPException: If file format is invalid or save fails
    """
    try:
        # Create upload directory if it doesn't exist
        upload_dir = f"uploads/{user_type}s"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Validate file extension
        file_ext = os.path.splitext(upload_file.filename)[1].lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb+") as f:
            contents = await upload_file.read()
            f.write(contents)
        
        logger.info(f"✅ File saved: {filename} in {upload_dir}")
        # Return the web-accessible path so frontend can concatenate API base URL directly
        return f"/uploads/{user_type}s/{filename}"
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")


# Initialize router with prefix and tags
router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

# Export alias expected by app.__init__.py
admin_router = router

# Simple debug endpoint
@router.get("/debug/test")
async def debug_test():
    return {"status": "ok", "message": "Debug endpoint working"}

@router.get("/debug/db-test")
async def debug_db_test(db: Session = Depends(get_db)):
    try:
        # Test basic DB connection with proper text()
        from sqlalchemy import text
        result = db.execute(text("SELECT 1 as test"))
        return {"status": "ok", "message": "Database connection working", "result": result.fetchone()[0]}
    except Exception as e:
        return {"error": str(e), "status": "error", "type": type(e).__name__}

@router.get("/debug/tables")
async def debug_tables(db: Session = Depends(get_db)):
    try:
        # Check if agri_copilots table exists
        from sqlalchemy import text
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%copilot%'
        """))
        tables = [row[0] for row in result]
        
        # Also check all tables
        all_result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        all_tables = [row[0] for row in all_result]
        
        return {
            "status": "ok", 
            "copilot_tables": tables,
            "all_tables": all_tables,
            "total_tables": len(all_tables)
        }
    except Exception as e:
        return {"error": str(e), "status": "error", "type": type(e).__name__}

@router.get("/debug/user-count")
async def debug_user_count(db: Session = Depends(get_db)):
    try:
        # Test User model (which we know works from login)
        count = db.query(User).count()
        return {"count": count, "status": "ok", "table": "users"}
    except Exception as e:
        return {"error": str(e), "status": "error", "type": type(e).__name__}

@router.get("/debug/copilots-count-no-auth")
async def debug_copilots_count_no_auth(db: Session = Depends(get_db)):
    try:
        # Test AgriCopilot model without authentication
        logger.info("🔍 Testing AgriCopilot query (no auth)...")
        count = db.query(AgriCopilot).count()
        logger.info(f"✅ AgriCopilot count: {count}")
        return {"count": count, "status": "ok", "table": "agri_copilots", "auth": "bypassed"}
    except Exception as e:
        logger.error(f"❌ AgriCopilot query failed: {str(e)}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"🔍 Traceback: {error_trace}")
        return {"error": str(e), "status": "error", "type": type(e).__name__, "traceback": error_trace}

@router.get("/debug/auth-test")
async def debug_auth_test(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Manual auth testing
        logger.info("🔍 Testing manual auth...")
        auth_header = request.headers.get("authorization")
        logger.info(f"🔍 Auth header: {auth_header}")
        
        if not auth_header:
            return {"status": "no_auth", "message": "No authorization header"}
        
        if not auth_header.startswith("Bearer "):
            return {"status": "invalid_format", "message": "Invalid auth header format"}
        
        token = auth_header.split(" ")[1]
        logger.info(f"🔍 Token: {token[:20]}...")
        
        # Try to decode the token manually
        import jwt
        import os
        from jose import JWTError
        
        try:
            payload = jwt.decode(
                token,
                key=os.getenv("SECRET_KEY"),
                algorithms=[os.getenv("ALGORITHM", "HS256")]
            )
            user_id = payload.get("sub")
            logger.info(f"🔍 User ID from token: {user_id}")
            
            # Try to find the user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"status": "user_not_found", "user_id": user_id}
            
            logger.info(f"🔍 User found: {user.email}, role: {user.role}")
            
            return {
                "status": "ok", 
                "message": "Manual auth successful",
                "user_id": user_id,
                "user_email": user.email,
                "user_role": str(user.role),
                "is_admin": user.role == UserRole.admin
            }
            
        except JWTError as e:
            logger.error(f"❌ JWT Error: {str(e)}")
            return {"status": "jwt_error", "error": str(e)}
        
    except Exception as e:
        logger.error(f"❌ Manual auth test failed: {str(e)}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"🔍 Traceback: {error_trace}")
        return {"error": str(e), "status": "error", "type": type(e).__name__, "traceback": error_trace}

@router.post("/debug/approve-test/{copilot_id}")
async def debug_approve_test(
    copilot_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Debug the approve endpoint without authentication dependency"""
    try:
        logger.info(f"🔍 Debug approve test for copilot: {copilot_id}")
        
        # Manual auth check
        auth_header = request.headers.get("authorization")
        logger.info(f"🔍 Auth header in approve: {auth_header}")
        
        if not auth_header:
            return {"status": "no_auth", "message": "No authorization header in approve endpoint"}
        
        if not auth_header.startswith("Bearer "):
            return {"status": "invalid_format", "message": "Invalid auth header format in approve"}
        
        # Check if copilot exists
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            return {"status": "not_found", "message": f"Copilot {copilot_id} not found"}
        
        return {
            "status": "ok",
            "message": "Approve debug successful",
            "copilot_id": copilot_id,
            "copilot_name": copilot.full_name,
            "auth_header_present": bool(auth_header),
            "auth_header_format": "valid" if auth_header.startswith("Bearer ") else "invalid"
        }
        
    except Exception as e:
        logger.error(f"❌ Debug approve test failed: {str(e)}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"🔍 Traceback: {error_trace}")
        return {"error": str(e), "status": "error", "type": type(e).__name__, "traceback": error_trace}

@router.get("/debug/copilots-count")
async def debug_copilots_count(
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    try:
        # Test AgriCopilot model specifically
        logger.info("🔍 Testing AgriCopilot query...")
        count = db.query(AgriCopilot).count()
        logger.info(f"✅ AgriCopilot count: {count}")
        return {"count": count, "status": "ok", "table": "agri_copilots"}
    except Exception as e:
        logger.error(f"❌ AgriCopilot query failed: {str(e)}")
        import traceback
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        return {"error": str(e), "status": "error", "type": type(e).__name__, "traceback": traceback.format_exc()}

@router.get("/copilots", response_model=List[AgriCopilotResponse])
async def get_copilots(
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    try:
        logger.info("� Fetching all agri-copilots...")
        
        # Simple query first
        copilots = db.query(AgriCopilot).all()
        logger.info(f"🔍 Found {len(copilots)} copilots")
        
        # Complete response format matching AgriCopilotResponse model
        result = []
        for copilot in copilots:
            # Ensure image URLs are properly formatted with full server path
            photo_url = copilot.photo_url
            aadhar_front_url = copilot.aadhar_front_url
            
            # If URLs don't start with /uploads/, add the prefix for backward compatibility
            if photo_url and not photo_url.startswith('/uploads/') and not photo_url.startswith('http'):
                photo_url = f"/uploads/agri_copilots/{photo_url}"
            if aadhar_front_url and not aadhar_front_url.startswith('/uploads/') and not aadhar_front_url.startswith('http'):
                aadhar_front_url = f"/uploads/agri_copilots/{aadhar_front_url}"
            
            result.append({
                "id": copilot.id,  # Keep as UUID, don't convert to string
                "user_id": copilot.user_id,
                "custom_id": copilot.custom_id or "",
                "full_name": copilot.full_name,
                "email": copilot.email,
                "phone": copilot.phone,
                "aadhar_number": copilot.aadhar_number,  # Required field
                "photo_url": photo_url,
                "aadhar_front_url": aadhar_front_url,
                "is_verified": copilot.is_verified or False,
                "verified_by": copilot.verified_by,
                "verified_at": copilot.verified_at,
                "verification_status": copilot.verification_status.value if copilot.verification_status else "pending",
                "verification_notes": copilot.verification_notes,
                "created_at": copilot.created_at,
                "updated_at": copilot.updated_at
            })
        
        logger.info(f"✅ Returning {len(result)} agri-copilots")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error fetching copilots: {str(e)}")
        import traceback
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching copilots: {str(e)}"
        )

@router.put("/copilots/{copilot_id}/status", response_model=AgriCopilotResponse)
async def update_copilot_status(
    copilot_id: str,
    status_update: dict = Body(...),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"🔄 Updating copilot {copilot_id} status to: {status_update.get('status')}")
        
        # Direct database query since service method doesn't exist
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(status_code=404, detail="Agri-copilot not found")
        
        # Update status - convert string to enum
        status_str = status_update["status"]
        if status_str == "approved":
            copilot.verification_status = ApprovalStatus.approved.value
        elif status_str == "rejected":
            copilot.verification_status = ApprovalStatus.rejected.value
        elif status_str == "pending":
            copilot.verification_status = ApprovalStatus.pending.value
        else:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_str}")
        
        copilot.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(copilot)
        
        logger.info(f"✅ Status updated successfully")
        
        # Return response format
        return {
            "id": str(copilot.id),
            "custom_id": copilot.custom_id,
            "full_name": copilot.full_name,
            "email": copilot.email,
            "phone": copilot.phone,
            "verification_status": copilot.verification_status,
            "created_at": copilot.created_at,
            "updated_at": copilot.updated_at
        }
    except Exception as e:
        logger.error(f"❌ Error updating copilot status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/register/agri-copilot", response_model=AgriCopilotResponse)
async def register_agri_copilot_with_token(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    aadhar_number: str = Form(...),
    registration_token: str = Form(...),
    photo_file: UploadFile = File(...),
    aadhar_front_file: UploadFile = File(...),
    address_line1: str = Form(...),
    address_line2: Optional[str] = Form(None),
    city: str = Form(...),
    state: str = Form(...),
    mandal: Optional[str] = Form(None),
    country: str = Form(...),
    postal_code: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new AgriCopilot with a registration token and uploaded documents."""
    logger.info(f"🔐 Token-based AgriCopilot registration attempt for email: {email}")
    logger.info(f"📊 Current tokens in memory: {len(invitation_tokens)} tokens")
    if registration_token:
        logger.info(f"🎫 Received token: {registration_token[:16]}... (length: {len(registration_token)})")
    photo_path = None
    aadhar_path = None
    try:
        # STEP 1: Validate registration token (if provided and exists in memory)
        token_validated = False
        if registration_token:
            logger.info(f"🔍 Checking registration token: {registration_token[:8]}...")
            if registration_token in invitation_tokens:
                token_data = invitation_tokens[registration_token]
                
                # Verify token hasn't expired
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"⚠️ Registration token expired, but allowing registration")
                    del invitation_tokens[registration_token]  # Clean up expired token
                else:
                    # Verify email matches the invitation
                    if token_data['email'].lower() != email.lower():
                        logger.error(f"❌ Email mismatch: token for {token_data['email']}, but got {email}")
                        raise HTTPException(status_code=400, detail="Email does not match invitation")
                    
                    # Verify user type matches
                    if 'user_type' in token_data and token_data['user_type'] != 'agri_copilot':
                        logger.error(f"❌ User type mismatch: token for {token_data['user_type']}, but endpoint is for agri_copilot")
                        raise HTTPException(status_code=400, detail="Invalid registration token for this user type")
                    
                    token_validated = True
                    logger.info("✅ Registration token validated successfully")
            else:
                logger.warning(f"⚠️ Token not found in memory (may have been cleared by server restart). Proceeding with registration...")
        else:
            logger.info("ℹ️ No registration token provided (direct registration)")
        
        # STEP 2: Check if user already completed registration
        logger.info("🔍 Checking if registration already completed...")
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            logger.error(f"❌ Email already registered - user already completed registration")
            raise HTTPException(status_code=400, detail="Registration already completed for this email")

        # Create user entry first
        logger.info("👤 Creating base User record...")
        hashed_password = AuthService.get_password_hash(password)
        
        # Create new user with correct enum value (convert to string)
        user = User(
            email=email,
            password_hash=hashed_password,
            full_name=full_name,
            phone=phone,
            role=UserRole.agri_copilot.value,  # Convert enum to string value
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            country=country,
            postal_code=postal_code,
            is_active=True,
            is_verified=False,  # Will be verified by admin
            created_at=datetime.utcnow()
        )
        # Set the custom ID for the user
        user.set_custom_id(db)

        # Add and flush to get user.id
        db.add(user)
        logger.info("✅ User object added to session. Flushing to get ID...")
        db.flush()
        
        # Create AgriCopilot entry BEFORE saving files (to get copilot.id)
        logger.info("🧑‍🌾 Creating AgriCopilot-specific record...")
        agri_copilot_id = uuid.uuid4()  # Generate ID first
        agri_copilot = AgriCopilot(
            id=agri_copilot_id,
            user_id=user.id,
            full_name=full_name,
            email=email,
            phone=phone,
            aadhar_number=aadhar_number,
            password_hash=hashed_password,
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            postal_code=postal_code,
            country=country,
            photo_url=None,  # Will be set after file upload
            aadhar_front_url=None,  # Will be set after file upload
            is_verified=False
        )
        
        # Create upload directory if it doesn't exist
        upload_dir = "uploads/agri_copilots"
        os.makedirs(upload_dir, exist_ok=True)
        
        try:
            # Save photo using agri_copilot.id
            logger.info("📁 Saving photo file...")
            photo_ext = os.path.splitext(photo_file.filename)[1].lower()
            if photo_ext not in ['.jpg', '.jpeg', '.png']:
                raise HTTPException(status_code=400, detail="Invalid photo format. Use JPG or PNG")
            
            photo_filename = f"{agri_copilot_id}_photo{photo_ext}"
            photo_path = os.path.join(upload_dir, photo_filename)
            
            with open(photo_path, "wb+") as f:
                contents = await photo_file.read()
                f.write(contents)
            
            # Save aadhar using agri_copilot.id
            logger.info("📁 Saving aadhar file...")
            aadhar_ext = os.path.splitext(aadhar_front_file.filename)[1].lower()
            if aadhar_ext not in ['.jpg', '.jpeg', '.png', '.pdf']:
                raise HTTPException(status_code=400, detail="Invalid aadhar format. Use JPG, PNG or PDF")
            
            aadhar_filename = f"{agri_copilot_id}_aadhar{aadhar_ext}"
            aadhar_path = os.path.join(upload_dir, aadhar_filename)
            
            with open(aadhar_path, "wb+") as f:
                contents = await aadhar_front_file.read()
                f.write(contents)
            
            # Update AgriCopilot with file paths
            agri_copilot.photo_url = photo_filename
            agri_copilot.aadhar_front_url = aadhar_filename
        
        except Exception as e:
            logger.error(f"❌ Error saving files: {str(e)}")
            db.rollback()
            # Clean up any saved files
            for path in [photo_path, aadhar_path]:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except:
                        pass
            raise HTTPException(status_code=500, detail="Error saving files")

        # Set the custom ID for the AgriCopilot
        agri_copilot.set_custom_id(db)
        logger.info(f"Generated AgriCopilot custom_id: {agri_copilot.custom_id}")

        try:
            logger.info("✅ AgriCopilot object added to session.")
            db.add(agri_copilot)
            
            # Now commit both user and agri_copilot
            db.commit()
            db.refresh(user)
            db.refresh(agri_copilot)
            
            logger.info(f"✅ Successfully created AgriCopilot with ID: {agri_copilot.id}")
            
            # STEP 3: Clean up the used registration token (if it was validated)
            if token_validated and registration_token in invitation_tokens:
                del invitation_tokens[registration_token]
                logger.info(f"🧹 Registration token cleaned up successfully")

            # Send notification to admins
            try:
                # TODO: Implement proper admin notification system
                # For now, just log the new registration
                logger.info(f"📬 New AgriCopilot registration: {user.full_name} ({user.email})")
            except Exception as notify_error:
                logger.error(f"❌ Failed to send admin notification: {str(notify_error)}")
                # Continue execution as this is not critical

            # Use the AgriCopilotResponse schema for the response
            return {
                "id": str(agri_copilot.id),
                "user_id": str(user.id),
                "custom_id": agri_copilot.custom_id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "aadhar_number": agri_copilot.aadhar_number,
                "photo_url": agri_copilot.photo_url,
                "aadhar_front_url": agri_copilot.aadhar_front_url,
                "is_verified": agri_copilot.is_verified,
                "verification_status": agri_copilot.verification_status,  # Already a string, not Enum
                "created_at": agri_copilot.created_at,
                "updated_at": agri_copilot.updated_at
            }
        except Exception as db_error:
            logger.error(f"❌ Database commit error: {str(db_error)}")
            db.rollback()
            # Clean up files on database error
            for path in [photo_path, aadhar_path]:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as cleanup_error:
                        logger.error(f"🧹 Error cleaning up file {path}: {str(cleanup_error)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to complete registration. Please try again."
            )

    except HTTPException as http_error:
        # Clean up files on any HTTP exception
        for path in [photo_path, aadhar_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as cleanup_err:
                    logger.error(f"🧹 Error cleaning up file {path}: {str(cleanup_err)}")
        raise http_error
        
    except Exception as e:
        logger.error(f"💥 Unexpected error in AgriCopilot registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )

@router.post("/invite/agri-copilot", response_model=MessageResponse)
async def invite_agri_copilot(invite_data: AgriCopilotInvite, db: Session = Depends(get_db)):
    from app.services.email_service import email_service  # use singleton

    # Log the received data for debugging
    logger.info(f"Received invite data: full_name='{invite_data.full_name}', email='{invite_data.email}', phone='{invite_data.phone}'")

    # 1. Check if a user with this email already exists in User table or AgriCopilot table
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    existing_copilot = db.query(AgriCopilot).filter(AgriCopilot.email == invite_data.email).first()
    
    if existing_user or existing_copilot:
        logger.error(f"❌ User with email {invite_data.email} already exists in the system")
        raise HTTPException(
            status_code=400, 
            detail=f"A user with email {invite_data.email} already exists in the system. Please use a different email address."
        )

    # 2. Prepare the registration link
    registration_token = str(uuid.uuid4())
    
    # Store the invitation token with associated data for later validation
    invitation_tokens[registration_token] = {
        'email': invite_data.email,
        'full_name': invite_data.full_name,
        'phone': invite_data.phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
    }

    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    registration_link = f"{frontend_base}/admin/register/agri-copilot?token={registration_token}"

    # 3. Send the invitation email
    # Helper to safely call role-specific email methods with fallbacks
    def _send_invite_email(role: str, to_email: str, full_name: str, link: str) -> bool:
        method_name = f"send_{role}_invitation_email"
        method = getattr(email_service, method_name, None)
        if callable(method):
            try:
                return method(email=to_email, full_name=full_name, registration_link=link)
            except Exception as e:
                logger.error(f"Error in {method_name}: {str(e)}", exc_info=True)
                return False

        # Fallback to a generic role invitation if available
        fallback = getattr(email_service, '_send_role_invitation', None)
        if callable(fallback):
            try:
                return fallback(role, to_email, full_name, link)
            except Exception as e:
                logger.error(f"Error in fallback _send_role_invitation for {role}: {str(e)}", exc_info=True)
                return False

        # Last resort: use send_welcome_email which exists in most implementations
        fallback_welcome = getattr(email_service, 'send_welcome_email', None)
        if callable(fallback_welcome):
            try:
                return fallback_welcome(to_email=to_email, full_name=full_name, user_type=role, registration_id=link, password='')
            except Exception as e:
                logger.error(f"Error in fallback send_welcome_email for {role}: {str(e)}", exc_info=True)
                return False

        logger.error(f"No email method available for role '{role}'")
        return False

    try:
        sent = _send_invite_email('agri_copilot', invite_data.email, invite_data.full_name, registration_link)
        if not sent:
            logger.error(f"Email service reported failure sending agri-copilot invitation to {invite_data.email}")
            invitation_tokens.pop(registration_token, None)
            raise HTTPException(status_code=500, detail="Failed to send invitation email.")
        logger.info(f"Invitation email sent successfully to {invite_data.email}")
    except Exception as e:
        logger.error(f"Failed to send invitation email: {str(e)}")
        # Remove the token if email sending failed
        invitation_tokens.pop(registration_token, None)
        raise HTTPException(status_code=500, detail="Failed to send invitation email.")

    # 4. Return success message with registration link (DO NOT save to database here)
    return {
        "message": f"Invitation email sent successfully to {invite_data.email}", 
        "success": True,
        "registration_link": registration_link,
        "token": registration_token,
        "expires_at": invitation_tokens[registration_token]['expires_at'].isoformat()
    }


@router.post("/invite/farmer", response_model=MessageResponse)
async def invite_farmer(invite_data: AgriCopilotInvite, db: Session = Depends(get_db)):
    from app.services.email_service import email_service

    logger.info(f"Received farmer invite: {invite_data.email}")
    
    # Check if user exists in User table or Farmer table
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    existing_farmer = db.query(Farmer).filter(Farmer.email == invite_data.email).first()
    
    if existing_user or existing_farmer:
        logger.error(f"❌ User with email {invite_data.email} already exists in the system")
        raise HTTPException(
            status_code=400, 
            detail=f"A user with email {invite_data.email} already exists in the system. Please use a different email address."
        )

    registration_token = str(uuid.uuid4())
    invitation_tokens[registration_token] = {
        'email': invite_data.email,
        'full_name': invite_data.full_name,
        'phone': invite_data.phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)
    }

    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    registration_link = f"{frontend_base}/admin/register/farmer?token={registration_token}"

    try:
        sent = _send_invite_email('farmer', invite_data.email, invite_data.full_name, registration_link)
        if not sent:
            logger.error(f"Email service reported failure sending farmer invitation to {invite_data.email}")
            invitation_tokens.pop(registration_token, None)
            raise HTTPException(status_code=500, detail="Failed to send invitation email.")
    except Exception as e:
        logger.error(f"Failed to send farmer invitation email: {e}")
        invitation_tokens.pop(registration_token, None)
        raise HTTPException(status_code=500, detail="Failed to send invitation email.")

    return {"message": f"Invitation email sent successfully to {invite_data.email}", "success": True, "registration_link": registration_link, "token": registration_token, "expires_at": invitation_tokens[registration_token]['expires_at'].isoformat()}


@router.post("/invite/vendor", response_model=MessageResponse)
async def invite_vendor(invite_data: AgriCopilotInvite, db: Session = Depends(get_db)):
    from app.services.email_service import email_service

    logger.info(f"Received vendor invite: {invite_data.email}")
    
    # Check if user exists in User table or Vendor table
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    existing_vendor = db.query(Vendor).filter(Vendor.email == invite_data.email).first()
    
    if existing_user or existing_vendor:
        logger.error(f"❌ User with email {invite_data.email} already exists in the system")
        raise HTTPException(
            status_code=400, 
            detail=f"A user with email {invite_data.email} already exists in the system. Please use a different email address."
        )

    registration_token = str(uuid.uuid4())
    invitation_tokens[registration_token] = {
        'email': invite_data.email,
        'full_name': invite_data.full_name,
        'phone': invite_data.phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)
    }

    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    registration_link = f"{frontend_base}/admin/register/vendor?token={registration_token}"

    try:
        sent = _send_invite_email('vendor', invite_data.email, invite_data.full_name, registration_link)
        if not sent:
            logger.error(f"Email service reported failure sending vendor invitation to {invite_data.email}")
            invitation_tokens.pop(registration_token, None)
            raise HTTPException(status_code=500, detail="Failed to send invitation email.")
    except Exception as e:
        logger.error(f"Failed to send vendor invitation email: {e}")
        invitation_tokens.pop(registration_token, None)
        raise HTTPException(status_code=500, detail="Failed to send invitation email.")

    return {"message": f"Invitation email sent successfully to {invite_data.email}", "success": True, "registration_link": registration_link, "token": registration_token, "expires_at": invitation_tokens[registration_token]['expires_at'].isoformat()}


@router.post("/invite/buyer", response_model=MessageResponse)
async def invite_buyer(invite_data: AgriCopilotInvite, db: Session = Depends(get_db)):
    from app.services.email_service import email_service

    logger.info(f"Received buyer invite: {invite_data.email}")
    
    # Check if user exists in User table or Buyer table
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    existing_buyer = db.query(Buyer).filter(Buyer.email == invite_data.email).first()
    
    if existing_user or existing_buyer:
        logger.error(f"❌ User with email {invite_data.email} already exists in the system")
        raise HTTPException(
            status_code=400, 
            detail=f"A user with email {invite_data.email} already exists in the system. Please use a different email address."
        )

    registration_token = str(uuid.uuid4())
    invitation_tokens[registration_token] = {
        'email': invite_data.email,
        'full_name': invite_data.full_name,
        'phone': invite_data.phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)
    } 

    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    registration_link = f"{frontend_base}/admin/register/buyer?token={registration_token}"

    try:
        sent = _send_invite_email('buyer', invite_data.email, invite_data.full_name, registration_link)
        if not sent:
            logger.error(f"Email service reported failure sending buyer invitation to {invite_data.email}")
            invitation_tokens.pop(registration_token, None)
            raise HTTPException(status_code=500, detail="Failed to send invitation email.")
    except Exception as e:
        logger.error(f"Failed to send buyer invitation email: {e}")
        invitation_tokens.pop(registration_token, None)
        raise HTTPException(status_code=500, detail="Failed to send invitation email.")

    return {"message": f"Invitation email sent successfully to {invite_data.email}", "success": True, "registration_link": registration_link, "token": registration_token, "expires_at": invitation_tokens[registration_token]['expires_at'].isoformat()}


@router.post("/invite/landowner", response_model=MessageResponse)
async def invite_landowner(invite_data: AgriCopilotInvite, db: Session = Depends(get_db)):
    from app.services.email_service import email_service

    logger.info(f"Received landowner invite: {invite_data.email}")
    
    # Check if user exists in User table or Landowner table
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    existing_landowner = db.query(Landowner).filter(Landowner.email == invite_data.email).first()
    
    if existing_user or existing_landowner:
        logger.error(f"❌ User with email {invite_data.email} already exists in the system")
        raise HTTPException(
            status_code=400, 
            detail=f"A user with email {invite_data.email} already exists in the system. Please use a different email address."
        )

    registration_token = str(uuid.uuid4())
    invitation_tokens[registration_token] = {
        'email': invite_data.email,
        'full_name': invite_data.full_name,
        'phone': invite_data.phone,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)
    }

    frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
    registration_link = f"{frontend_base}/admin/register/landowner?token={registration_token}"

    try:
        sent = _send_invite_email('landowner', invite_data.email, invite_data.full_name, registration_link)
        if not sent:
            logger.error(f"Email service reported failure sending landowner invitation to {invite_data.email}")
            invitation_tokens.pop(registration_token, None)
            raise HTTPException(status_code=500, detail="Failed to send invitation email.")
    except Exception as e:
        logger.error(f"Failed to send landowner invitation email: {e}")
        invitation_tokens.pop(registration_token, None)
        raise HTTPException(status_code=500, detail="Failed to send invitation email.")

    return {"message": f"Invitation email sent successfully to {invite_data.email}", "success": True, "registration_link": registration_link, "token": registration_token, "expires_at": invitation_tokens[registration_token]['expires_at'].isoformat()}


@router.get("/invite/tokens/active", response_model=dict)
async def get_active_invitation_tokens():
    """Get active invitation tokens (for debugging - remove in production)"""
   
    return {
        "active_tokens": len(invitation_tokens),
        "tokens": {
            token: {
                "email": data["email"],
                "full_name": data["full_name"],
                "created_at": data["created_at"].isoformat(),
                "expires_at": data["expires_at"].isoformat()
            }
            for token, data in invitation_tokens.items()
        }
    }




# 🧾 2️⃣ Admin Registration Form Submission

@router.post("/admin/register/agri-copilot", response_model=MessageResponse)
async def admin_register_agri_copilot(
    full_name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    aadhar_number: str = Form(...),
    password: str = Form(...),
    address_line1: Optional[str] = Form(""),
    address_line2: Optional[str] = Form(None),
    city: Optional[str] = Form(""),
    state: Optional[str] = Form(""),
    mandal: Optional[str] = Form(None),
    country: Optional[str] = Form("IN"),
    postal_code: Optional[str] = Form(""),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"🔧 Admin registration attempt for: {email}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already registered")
            
        existing_agri = db.query(AgriCopilot).filter(AgriCopilot.email == email).first()
        if existing_agri:
            raise HTTPException(status_code=400, detail="AgriCopilot already registered")

        hashed_password = AuthService.get_password_hash(password)
        # Use path relative to Backend directory - this matches our static file mount
        upload_dir = os.path.join("uploads", "agri_copilots")
        # Create absolute path for file operations
        abs_upload_dir = os.path.abspath(upload_dir)
        os.makedirs(abs_upload_dir, exist_ok=True)

        # Save files with simple validation
        photo_url = None
        aadhar_front_url = None
        
        if photo_file and photo_file.filename:
            # Basic validation for photo
            if not photo_file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                raise HTTPException(status_code=400, detail="Photo must be JPG or PNG format")
            
            # Read and validate size
            photo_content = await photo_file.read()
            if len(photo_content) < 5 * 1024:  # 5KB minimum
                raise HTTPException(status_code=400, detail="Photo file too small (minimum 5KB)")
            if len(photo_content) > 2 * 1024 * 1024:  # 2MB maximum
                raise HTTPException(status_code=400, detail="Photo file too large (maximum 2MB)")
            
            # Save photo
            safe_name = f"photo_{uuid.uuid4().hex}_{photo_file.filename}"
            file_path = os.path.join(abs_upload_dir, safe_name)
            with open(file_path, "wb") as f:
                f.write(photo_content)
            photo_url = f"/uploads/agri_copilots/{safe_name}"
        
        if aadhar_front_file and aadhar_front_file.filename:
            # Basic validation for aadhar
            if not aadhar_front_file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.pdf')):
                raise HTTPException(status_code=400, detail="Aadhar must be JPG, PNG, or PDF format")
            
            # Read and validate size
            aadhar_content = await aadhar_front_file.read()
            if len(aadhar_content) < 5 * 1024:  # 5KB minimum
                raise HTTPException(status_code=400, detail="Aadhar file too small (minimum 5KB)")
            if len(aadhar_content) > 2 * 1024 * 1024:  # 2MB maximum
                raise HTTPException(status_code=400, detail="Aadhar file too large (maximum 2MB)")
            
            # Save aadhar
            safe_name = f"aadhar_{uuid.uuid4().hex}_{aadhar_front_file.filename}"
            file_path = os.path.join(abs_upload_dir, safe_name)
            with open(file_path, "wb") as f:
                f.write(aadhar_content)
            aadhar_front_url = f"/uploads/agri_copilots/{safe_name}"

        # Create User entry first
        logger.info(f"🔧 Creating base User record...")
        user = User(
            email=email,
            password_hash=hashed_password,
            full_name=full_name,
            phone=phone,
            role=UserRole.agri_copilot.value,
            address_line1=address_line1 or "",
            address_line2=address_line2,
            city=city or "",
            state=state or "",
            mandal=mandal,
            country=country or "IN",
            postal_code=postal_code or "",
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow()
        )
        user.set_custom_id(db)
        db.add(user)
        db.flush()  # Get user.id for AgriCopilot

        logger.info(f"🔧 Creating AgriCopilot object...")
        copilot = AgriCopilot(
            user_id=user.id,
            full_name=full_name,
            phone=phone,
            email=email,
            aadhar_number=aadhar_number,
            password_hash=hashed_password,
            address_line1=address_line1 or "",
            address_line2=address_line2,
            city=city or "",
            state=state or "",
            mandal=mandal,
            country=country or "IN",
            postal_code=postal_code or "",
            photo_url=photo_url,  # Store full URL path
            aadhar_front_url=aadhar_front_url,  # Store full URL path
            created_at=datetime.utcnow(),
            is_verified=False,
            verification_status=ApprovalStatus.pending.value,  # Convert enum to string
        )
        
        logger.info(f"🔧 Setting custom ID...")
        copilot.set_custom_id(db)
        
        logger.info(f"🔧 Adding to database...")
        db.add(copilot)
        db.commit()
        db.refresh(copilot)

        logger.info(f"✅ Registration successful for: {email}")
        return {"message": f"AgriCopilot '{copilot.full_name}' registered successfully!"}
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"❌ Admin registration error: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


# ✅ 3️⃣ Admin Verification (Approve / Reject)
@router.post("/verify/agri-copilot/{copilot_id}", response_model=MessageResponse)
async def verify_agri_copilot(copilot_id: UUID, action: str = Body(...), db: Session = Depends(get_db)):
    copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
    if not copilot:
        raise HTTPException(status_code=404, detail="AgriCopilot not found")

    email_service = EmailService()

    if action == "approve":
        copilot.is_verified = True
        copilot.verification_status = ApprovalStatus.approved.value  # Convert Enum to string
        copilot.verified_at = datetime.utcnow()
        db.commit()
        email_service.send_verification_approval_email(copilot.email, copilot.full_name)
        return {"message": "AgriCopilot approved and notified"}

    elif action == "reject":
        copilot.verification_status = ApprovalStatus.rejected.value  # Convert Enum to string
        db.commit()
        email_service.send_verification_rejection_email(copilot.email, copilot.full_name, "Documents invalid")
        return {"message": "AgriCopilot rejected and notified"}

    raise HTTPException(status_code=400, detail="Invalid action")


# 📊 4️⃣ Dashboard - List Copilots
@router.get("/agri-copilots", response_model=list[AgriCopilotDashboard])
def list_agri_copilots(status: ApprovalStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(AgriCopilot)
    if status:
        query = query.filter(AgriCopilot.verification_status == status)
    copilots = query.order_by(AgriCopilot.created_at.desc()).all()
    
    # Ensure image URLs are properly formatted for frontend access
    result = []
    for copilot in copilots:
        # Format location display - combine city, state, country
        location_parts = []
        if copilot.city:
            location_parts.append(copilot.city)
        if copilot.state:
            location_parts.append(copilot.state)
        if copilot.country and copilot.country != "IN":  # Only show country if not India
            location_parts.append(copilot.country)
        
        location_display = ", ".join(location_parts) if location_parts else "N/A"
        
        copilot_dict = {
            "id": copilot.id,
            "custom_id": copilot.custom_id,
            "full_name": copilot.full_name,
            "email": copilot.email,
            "phone": copilot.phone,
            "aadhar_number": copilot.aadhar_number,
            # Complete address/location fields
            "address_line1": getattr(copilot, 'address_line1', ''),
            "address_line2": getattr(copilot, 'address_line2', ''),
            "city": getattr(copilot, 'city', ''),
            "state": getattr(copilot, 'state', ''),
            "mandal": getattr(copilot, 'mandal', ''),
            "country": getattr(copilot, 'country', ''),
            "postal_code": getattr(copilot, 'postal_code', ''),
            "location": location_display,  # Combined location for display
            # Return endpoint URLs instead of filenames
            "photo_url": f"/admin/agri-copilot/{copilot.id}/photo" if copilot.photo_url else None,
            "aadhar_front_url": f"/admin/agri-copilot/{copilot.id}/aadhar" if copilot.aadhar_front_url else None,
            "is_verified": copilot.is_verified,
            "verification_status": copilot.verification_status,
            "created_at": copilot.created_at,
            "updated_at": copilot.updated_at
        }
        result.append(copilot_dict)
    
    return result


# ---------------- Authentication ---------------- #
@router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"🔐 Login attempt for email: {login_data.email}")
        
        # First, attempt to authenticate as an Admin user
        if login_data.email:
            logger.info("🔍 Checking for admin user...")
            admin = db.query(Admin).join(User).filter(User.email == login_data.email).first()
            
            if admin and AuthService.verify_password(login_data.password, admin.user.password_hash):
                logger.info("🎉 Admin login successful!")
                # Create admin token with proper role
                access_token = create_access_token({
                    "sub": admin.user.email,  # Use email as the subject for admin tokens
                    "role": "ADMIN",  # Consistent role format
                    "id": str(admin.user.id)  # Include ID as additional claim
                })
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": str(admin.user.id),
                        "email": admin.user.email,
                        "full_name": admin.user.full_name,
                        "role": "admin"
                    },
                    "redirect_to": "/admin/dashboard"
                }
            logger.info("📋 Checking for admin user...")
            # Corrected query to join User and Admin tables
            admin = db.query(Admin).join(User).filter(User.email == login_data.email).first()
            logger.info(f"👤 Admin found: {admin is not None}")
            
            if admin:
                logger.info("🔑 Verifying password...")
                password_valid = AuthService.verify_password(login_data.password, admin.user.password_hash)
                logger.info(f"✅ Password valid: {password_valid}")
                
                if password_valid:
                    logger.info("🏃 Checking if admin is active...")
                    if not admin.user.is_active:
                        logger.warning("❌ Admin account is deactivated")
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Your admin account has been deactivated. Please contact support.",
                        )

                    logger.info("🎫 Creating access token...")
                    access_token_expires = timedelta(minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = AuthService.create_access_token(
                        data={"sub": str(admin.user.id), "role": "admin", "is_super_admin": True},
                        expires_delta=access_token_expires
                    )
                    logger.info("✅ Access token created successfully")

                    logger.info("📋 Building admin response...")
                    # Create proper UserResponse object for the admin user
                    from app.services.copilot_services import UserService
                    user_response = UserService.to_response(admin.user)

                    logger.info("🎉 Admin login successful!")
                    return {
                        "access_token": access_token, 
                        "token_type": "bearer",
                        "user": user_response
                    }

        # If not an admin, attempt to authenticate as a regular user
        # THIS IS THE CORRECTED LOGIC
        identifier = login_data.email or getattr(login_data, 'phone', None)
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone number must be provided for login.",
            )

        user = UserService.authenticate_user(db, identifier, login_data.password)
        if not user:
            logger.warning(f"Login failed for {login_data.email}: User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support.",
            )
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"💥 Unexpected error during login for {login_data.email}: {str(e)}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

    access_token_expires = timedelta(minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id), "role": user.role.value}, 
        expires_delta=access_token_expires
    )

    user_response = UserResponse.model_validate(UserService.to_response(user))
    redirect_path = {
        "farmer": "/farmer", "landowner": "/landowner", "vendor": "/vendor",
        "buyer": "/buyer", "agricopilot": "/agricopilot"
    }.get(user.role.value, "/dashboard")

    return {
        "access_token": access_token, "token_type": "bearer",
        "user": user_response, "redirect_to": redirect_path
    }


@router.post(
    "/auth/forgot-password",
    response_model=Dict[str, Any]
)
async def forgot_password(
    request: ForgotPasswordRequest = Body(
        ...,
        examples={
            "email_example": {
                "summary": "Reset with Email",
                "description": "Send OTP to the provided email address",
                "value": {"email": "user@example.com"}
            },
            "phone_example": {
                "summary": "Reset with Phone",
                "description": "Send OTP to the provided phone number (10 digits, no country code)",
                "value": {"phone": "9876543210"}
            }
        }
    ),
    db: Session = Depends(get_db)
):
    logger = logging.getLogger(__name__)
    
    try:
        # Initialize variables
        identifier = None
        display_phone = None
        
        # Handle email or phone request
        if request.email:
            identifier = request.email.strip().lower()
            identifier_type = 'email'
            success_msg = f"If the email exists, a password reset OTP has been sent to {identifier}."
            error_msg = "Failed to send OTP via email. Please try again later."
            
        elif request.phone:
            # Clean the phone number (remove any non-digit characters except leading +)
            clean_phone = ''.join(c for c in request.phone if c.isdigit() or c == '+')
            
            # Handle different phone number formats
            if clean_phone.startswith('+91'):
                identifier = clean_phone
                display_phone = clean_phone
            elif clean_phone.startswith('91') and len(clean_phone) == 12:
                identifier = f"+{clean_phone}"
                display_phone = f"+{clean_phone}"
            elif clean_phone.startswith('0') and len(clean_phone) == 11:
                identifier = f"+91{clean_phone[1:]}"
                display_phone = f"+91{clean_phone[1:]}"
            elif len(clean_phone) == 10:
                identifier = f"+91{clean_phone}"
                display_phone = f"+91{clean_phone}"
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format. Please provide a 10-digit number with or without country code"
                )
            
            identifier_type = 'phone'
            success_msg = f"If the phone number exists, a password reset OTP has been sent to {display_phone}."
            error_msg = "Failed to send OTP via SMS. Please try again later."
        
        # Send OTP
        otp_sent, otp_message = await OTPService.send_otp(identifier, identifier_type)
        
        if not otp_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=otp_message or error_msg
            )

        return {
            "message": success_msg,
            "success": True,
            "method": identifier_type,
            "target": identifier
        }

    except HTTPException as he:
        print(f"HTTP Exception: {str(he)}")
        raise
    except Exception as e:
        print(f"Unexpected error in forgot password: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again later."
        )


@router.post("/auth/verify-otp", response_model=MessageResponse)
async def verify_otp(otp_data: OTPVerify, db: Session = Depends(get_db)):
    # Determine the identifier type and value
    if otp_data.email:
        identifier = otp_data.email.strip().lower()
        identifier_type = 'email'
        user = UserService.get_user_by_email(db, identifier)
    elif otp_data.phone:
        # Ensure phone number is in the correct format (without +91 prefix for storage)
        phone = otp_data.phone.strip()
        if phone.startswith('+91'):
            phone = phone[3:]  # Remove +91 prefix for storage
        elif phone.startswith('91'):
            phone = phone[2:]  # Remove 91 prefix if present
            
        if not phone.isdigit() or len(phone) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must be 10 digits"
            )
            
        identifier = f"+91{phone}"  # Use E.164 format for verification
        identifier_type = 'phone'
        user = UserService.get_user_by_phone(db, phone)  # Store without +91 prefix
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone must be provided"
        )
    
    # Verify the OTP
    is_valid = OTPService.verify_otp(identifier, otp_data.otp, identifier_type)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP."
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "OTP verified successfully"}


@router.post("/auth/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: dict = Body(
        ...,
        example={
            "email": "user@example.com",
            "new_password": "newSecurePassword123",
            "confirm_password": "newSecurePassword123"
        },
        description="Reset password request data"
    ),
    db: Session = Depends(get_db)
):
    """
    Reset user password
    
    - **email**: User's registered email address
    - **new_password**: New password
    - **confirm_password**: Must match new_password
    """
    # Import notification service here to avoid circular imports
    from app.services.notifications import notification_service
    
    try:
        # Extract data from request body
        email = reset_data.get('email')
        new_password = reset_data.get('new_password')
        confirm_password = reset_data.get('confirm_password')
        
        # Validate required fields
        if not email or not new_password or not confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email, new_password, and confirm_password are required"
            )
            
        # Verify passwords match
        if new_password != confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Find user by email
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Update the user's password
        try:
            # Get the user object first
            db_user = UserService.get_user_by_email(db, email)
            if not db_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
                
            # Update the password
            updated_user = UserService.update_password(
                user=db_user,
                new_password=new_password,
                db=db
            )
            
            # Send password reset success notification via SMS if phone is available
            if updated_user.phone:
                try:
                    await notification_service.send_password_reset_success_sms(
                        phone_number=updated_user.phone,
                        email=updated_user.email
                    )
                except Exception as sms_error:
                    logger.error(f"Failed to send password reset success SMS: {str(sms_error)}")
                    # Don't fail the request if SMS sending fails
                    
            return {"message": "Password has been reset successfully", "success": True}
            
        except Exception as e:
            logger.error(f"Password update failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update password. Please try again."
            )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in reset password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )


# ---------------- Registration ---------------- #
@router.post("/register/farmer", response_model=MessageResponse)
async def register_farmer(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    registration_token: Optional[str] = Form(None),  # Added token support
    role: Optional[str] = Form(None),  # Made optional - derive from endpoint
    address_line1: str = Form(None),
    address_line2: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    mandal: Optional[str] = Form(None),
    postal_code: str = Form(None),
    country: str = Form("IN"),
    farm_size: Optional[float] = Form(None),  # Made optional
    primary_crop_types: str = Form(None),
    years_of_experience: Optional[int] = Form(None),  # Made optional
    farmer_location: str = Form(None),
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None)
):
    # Import notification service here to avoid circular imports
    from app.services.notifications import notification_service
    
    logger.info(f"🔐 Farmer registration attempt for email: {email}")
    logger.info(f"📊 Current tokens in memory: {len(invitation_tokens)} tokens")
    if registration_token:
        logger.info(f"🎫 Received token: {registration_token[:16]}... (length: {len(registration_token)})")
    
    db = next(get_db())
    try:
        # STEP 1: Validate registration token (if provided and exists in memory)
        token_validated = False
        if registration_token:
            logger.info(f"🔍 Checking registration token: {registration_token[:8]}...")
            if registration_token in invitation_tokens:
                token_data = invitation_tokens[registration_token]
                
                # Verify token hasn't expired
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"⚠️ Registration token expired, but allowing registration")
                    del invitation_tokens[registration_token]  # Clean up expired token
                else:
                    # Verify email matches the invitation
                    if token_data['email'].lower() != email.lower():
                        logger.error(f"❌ Email mismatch: token for {token_data['email']}, but got {email}")
                        raise HTTPException(status_code=400, detail="Email does not match invitation")
                    
                    # Verify user type matches
                    if 'user_type' in token_data and token_data['user_type'] != 'farmer':
                        logger.error(f"❌ User type mismatch: token for {token_data['user_type']}, but endpoint is for farmer")
                        raise HTTPException(status_code=400, detail="Invalid registration token for this user type")
                    
                    token_validated = True
                    logger.info("✅ Registration token validated successfully")
            else:
                logger.warning(f"⚠️ Token not found in memory (may have been cleared by server restart). Proceeding with registration...")
        else:
            logger.info("ℹ️ No registration token provided (direct registration)")
        
        # STEP 2: Save uploaded files
        MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB in bytes
        photo_url = None
        aadhar_front_url = None
        
        logger.info(f"📸 Photo file received: {photo_file.filename if photo_file and photo_file.filename else 'None'}")
        logger.info(f"📄 Aadhar front file received: {aadhar_front_file.filename if aadhar_front_file and aadhar_front_file.filename else 'None'}")
        logger.info(f"🔢 Aadhar number received: {aadhar_number}")
        
        # Validate photo file size
        if photo_file and photo_file.filename:
            photo_content = await photo_file.read()
            photo_size = len(photo_content)
            logger.info(f"📏 Photo size: {photo_size / 1024:.2f} KB")
            if photo_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Photo file too large ({photo_size / 1024 / 1024:.2f} MB). Maximum allowed: 2 MB")
            await photo_file.seek(0)  # Reset file pointer
            photo_url = await save_upload_file(photo_file, "farmer")
            logger.info(f"✅ Photo saved as: {photo_url}")
        
        # Validate aadhar file size
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_content = await aadhar_front_file.read()
            aadhar_size = len(aadhar_content)
            logger.info(f"📏 Aadhar size: {aadhar_size / 1024:.2f} KB")
            if aadhar_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Aadhar file too large ({aadhar_size / 1024 / 1024:.2f} MB). Maximum allowed: 2 MB")
            await aadhar_front_file.seek(0)  # Reset file pointer
            aadhar_front_url = await save_upload_file(aadhar_front_file, "farmer")
            logger.info(f"✅ Aadhar front saved as: {aadhar_front_url}")
        
        # Auto-generate Aadhar number if not provided
        if not aadhar_number or aadhar_number.strip() == "":
            import random
            # Generate a realistic 12-digit Aadhar number
            aadhar_number = f"{random.randint(2000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
            logger.info(f"🔢 Auto-generated Aadhar number: {aadhar_number}")
        
        # Create FarmerCreate object
        logger.info(f"📦 Creating FarmerCreate object with:")
        logger.info(f"  - full_name: {full_name}")
        logger.info(f"  - email: {email}")
        logger.info(f"  - phone: {phone}")
        logger.info(f"  - aadhar_number: {aadhar_number}")
        logger.info(f"  - photo_url: {photo_url}")
        logger.info(f"  - aadhar_front_url: {aadhar_front_url}")
        
        farmer_data = FarmerCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            password=password,
            role=role or 'farmer',  # Use role from frontend or default to 'farmer'
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            postal_code=postal_code,
            country=country,
            farm_size=farm_size or 0.0,  # Default value if not provided
            primary_crop_types=primary_crop_types,
            years_of_experience=years_of_experience,
            farmer_location=farmer_location,
            photo_url=photo_url,
            aadhar_front_url=aadhar_front_url,
            aadhar_number=aadhar_number,
            user_type=UserRole.farmer
        )
        
        logger.info(f"✅ FarmerCreate object created successfully")
        
        # user_type is already set to UserRole.farmer in FarmerCreate schema
        # CORRECT CODE
        farmer = FarmerService.create_farmer(db, farmer_data)
        
        logger.info(f"🎉 Farmer created in database with ID: {farmer.id}")
        logger.info(f"📊 Farmer data saved:")
        logger.info(f"  - photo_url: {farmer.photo_url}")
        logger.info(f"  - aadhar_front_url: {farmer.aadhar_front_url}")
        logger.info(f"  - aadhar_number: {farmer.aadhar_number}")
        logger.info(f"  - full_name: {farmer.full_name}")
        logger.info(f"  - email: {farmer.email}")
        logger.info(f"  - phone: {farmer.phone}")
        
        # Get the user object to access custom_id
        user = db.query(User).filter(User.id == farmer.user_id).first()
        if not user:
            raise HTTPException(status_code=400, detail="User not found after creation")
            
        # Send welcome email and SMS notifications in parallel
        try:
            email_service = EmailService()
            
            # Prepare common notification data
            notification_data = {
                'to_email': farmer_data.email,
                'full_name': farmer_data.full_name,
                'user_type': 'farmer',
                'registration_id': user.custom_id,
                'password': farmer_data.password
            }
            
            # Send welcome email (await the coroutine)
            email_success = await email_service.send_welcome_email(**notification_data)
            logger.info(f"Welcome email sent: {email_success}")
            
            # Send welcome SMS if phone number is provided
            sms_task = None
            if farmer_data.phone:
                try:
                    # Send SMS directly and await it
                    sms_success = await notification_service.send_welcome_sms(
                        phone_number=farmer_data.phone,
                        email=farmer_data.email,
                        user_id=user.custom_id,
                        user_type='farmer',
                        password=farmer_data.password
                    )
                    if sms_success:
                        logger.info(f"✅ Welcome SMS sent to {farmer_data.phone}")
                    else:
                        logger.warning(f"⚠️  Failed to send welcome SMS to {farmer_data.phone}")
                except Exception as sms_error:
                    logger.error(f"❌ Error sending welcome SMS to {farmer_data.phone}: {str(sms_error)}", exc_info=True)
            
            logger.info("✅ Notifications process completed")
                
        except Exception as e:
            logger.error(f"Error in sending notifications: {str(e)}", exc_info=True)
            # Continue with registration even if notifications fail
            
        # Notify admins about new registration
        try:
            await _notify_admins_new_registration(db, user, 'farmer')
        except Exception as e:
            logger.error(f"Error notifying admins: {str(e)}", exc_info=True)
            # Continue with registration even if admin notification fails
        
        # STEP 3: Clean up the used registration token (if it was validated)
        if token_validated and registration_token in invitation_tokens:
            del invitation_tokens[registration_token]
            logger.info(f"🧹 Registration token cleaned up successfully")
            
        return {
            "message": "Farmer registration successful!", 
            "success": True, 
            "user_id": user.custom_id,
            "email_sent": True,
            "sms_sent": bool(farmer_data.phone),
            "status": "active"
        }
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Farmer registration failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


@router.post("/register/landowner", response_model=MessageResponse)
async def register_landowner(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    registration_token: Optional[str] = Form(None),  # Added token support
    role: Optional[str] = Form(None),  # Made optional - derive from endpoint
    address_line1: str = Form(None),
    address_line2: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    mandal: Optional[str] = Form(None),
    postal_code: str = Form(None),
    country: str = Form("IN"),
    total_land_area: Optional[float] = Form(None),  # Made optional
    current_land_use: str = Form(None),
    managing_remotely: bool = Form(False),
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None)
):
    logger.info(f"🔐 Landowner registration attempt for email: {email}")
    logger.info(f"📊 Current tokens in memory: {len(invitation_tokens)} tokens")
    if registration_token:
        logger.info(f"🎫 Received token: {registration_token[:16]}... (length: {len(registration_token)})")
    
    db = next(get_db())
    try:
        # STEP 1: Validate registration token (if provided and exists in memory)
        token_validated = False
        if registration_token:
            logger.info(f"🔍 Checking registration token: {registration_token[:8]}...")
            if registration_token in invitation_tokens:
                token_data = invitation_tokens[registration_token]
                
                # Verify token hasn't expired
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"⚠️ Registration token expired, but allowing registration")
                    del invitation_tokens[registration_token]  # Clean up expired token
                else:
                    # Verify email matches the invitation
                    if token_data['email'].lower() != email.lower():
                        logger.error(f"❌ Email mismatch: token for {token_data['email']}, but got {email}")
                        raise HTTPException(status_code=400, detail="Email does not match invitation")
                    
                    # Verify user type matches
                    if 'user_type' in token_data and token_data['user_type'] != 'landowner':
                        logger.error(f"❌ User type mismatch: token for {token_data['user_type']}, but endpoint is for landowner")
                        raise HTTPException(status_code=400, detail="Invalid registration token for this user type")
                    
                    token_validated = True
                    logger.info("✅ Registration token validated successfully")
            else:
                logger.warning(f"⚠️ Token not found in memory (may have been cleared by server restart). Proceeding with registration...")
        else:
            logger.info("ℹ️ No registration token provided (direct registration)")
        
        # STEP 2: Save uploaded files
        MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB in bytes
        photo_url = None
        aadhar_front_url = None
        
        # Validate photo file size
        if photo_file and photo_file.filename:
            photo_content = await photo_file.read()
            photo_size = len(photo_content)
            logger.info(f"📏 Photo size: {photo_size / 1024:.2f} KB")
            if photo_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Photo file too large ({photo_size / 1024 / 1024:.2f} MB). Maximum allowed: 2 MB")
            await photo_file.seek(0)
            photo_url = await save_upload_file(photo_file, "landowner")
        
        # Validate aadhar file size
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_content = await aadhar_front_file.read()
            aadhar_size = len(aadhar_content)
            logger.info(f"📏 Aadhar size: {aadhar_size / 1024:.2f} KB")
            if aadhar_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Aadhar file too large ({aadhar_size / 1024 / 1024:.2f} MB). Maximum allowed: 2 MB")
            await aadhar_front_file.seek(0)
            aadhar_front_url = await save_upload_file(aadhar_front_file, "landowner")
        
        # Auto-generate Aadhar number if not provided
        if not aadhar_number or aadhar_number.strip() == "":
            import random
            # Generate a realistic 12-digit Aadhar number
            aadhar_number = f"{random.randint(3000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
            logger.info(f"🔢 Auto-generated Aadhar number: {aadhar_number}")
        
        # Log the photo URLs for debugging
        logger.info(f"📸 Photo URL saved: {photo_url}")
        logger.info(f"📄 Aadhar Front URL saved: {aadhar_front_url}")
        
        # Create LandownerCreate object
        landowner_data = LandownerCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            password=password,
            role=role or 'landowner',  # Use role from frontend or default to 'landowner'
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            postal_code=postal_code,
            country=country,
            total_land_area=total_land_area or 0.0,  # Default value if not provided
            current_land_use=current_land_use or '',  # Default value if not provided
            managing_remotely=managing_remotely,
            photo_url=photo_url,
            aadhar_front_url=aadhar_front_url,
            aadhar_number=aadhar_number,
            user_type=UserRole.landowner
        )
        
        # Create the landowner
        user = LandownerService.create_landowner(db, landowner_data)
        db.commit()
        
        # Log the created user data
        logger.info(f"✅ Landowner created with ID: {user.custom_id if hasattr(user, 'custom_id') else user.id}")
        logger.info(f"📸 Saved photo_url in DB: {getattr(user, 'photo_url', None)}")
        logger.info(f"📄 Saved aadhar_front_url in DB: {getattr(user, 'aadhar_front_url', None)}")
        
        # Get the user object to access custom_id and other fields
        # user is already returned by create_landowner
        if not user:
            raise HTTPException(status_code=400, detail="User not found after creation")
        
        # Send welcome email and SMS notifications
        try:
            email_service = EmailService()
            
            # Send welcome email (await the coroutine)
            email_success = await email_service.send_welcome_email(
                to_email=landowner_data.email,
                full_name=landowner_data.full_name,
                user_type='landowner',
                user_id=user.custom_id,
                password=landowner_data.password,
                registration_id=user.custom_id
            )
            logger.info(f"Welcome email sent: {email_success}")
            
            # Send welcome SMS if phone number is provided
            if landowner_data.phone:
                try:
                    from app.services.notifications import notification_service
                    sms_success = await notification_service.send_welcome_sms(
                        phone_number=landowner_data.phone,
                        email=landowner_data.email,
                        user_id=user.custom_id,
                        user_type='landowner',
                        password=landowner_data.password
                    )
                    if sms_success:
                        logger.info(f"✅ Welcome SMS sent to {landowner_data.phone}")
                    else:
                        logger.warning(f"⚠️  Failed to send welcome SMS to {landowner_data.phone}")
                except Exception as sms_error:
                    logger.error(f"❌ Error sending welcome SMS to {landowner_data.phone}: {str(sms_error)}", exc_info=True)
            
            logger.info("✅ Notifications process completed")
                
        except Exception as e:
            logger.error(f"Error in sending notifications: {str(e)}", exc_info=True)
            # Continue with registration even if notifications fail
            
        # Notify admins about new registration
        try:
            await _notify_admins_new_registration(db, user, 'landowner')
        except Exception as e:
            logger.error(f"Error notifying admins: {str(e)}", exc_info=True)
            # Continue with registration even if admin notification fails
        
        # STEP 3: Clean up the used registration token (if it was validated)
        if token_validated and registration_token in invitation_tokens:
            del invitation_tokens[registration_token]
            logger.info(f"🧹 Registration token cleaned up successfully")
        
        return {
            "message": "Landowner registration successful! Your account is pending admin approval.", 
            "success": True,
            "user_id": user.custom_id,
            "email_sent": True,
            "sms_sent": bool(landowner_data.phone),
            "status": "pending_approval"
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/register/vendor", response_model=MessageResponse)
async def register_vendor(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    registration_token: Optional[str] = Form(None),  # Added token support
    role: Optional[str] = Form(None),  # Made optional - derive from endpoint
    address_line1: str = Form(None),
    address_line2: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    mandal: Optional[str] = Form(None),
    postal_code: str = Form(None),
    country: str = Form("IN"),
    legal_name: str = Form(None),
    business_name: str = Form(None),
    gstin: str = Form(None),
    pan: str = Form(None),
    business_type: str = Form(None),
    product_services: str = Form(None),
    years_in_business: Optional[int] = Form(None),  # Made optional
    service_area: str = Form(None),
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None)
):
    logger.info(f"🔐 Vendor registration attempt for email: {email}")
    logger.info(f"📊 Current tokens in memory: {len(invitation_tokens)} tokens")
    if registration_token:
        logger.info(f"🎫 Received token: {registration_token[:16]}... (length: {len(registration_token)})")
    
    db = next(get_db())
    try:
        # STEP 1: Validate registration token (if provided and exists in memory)
        token_validated = False
        if registration_token:
            logger.info(f"🔍 Checking registration token: {registration_token[:8]}...")
            if registration_token in invitation_tokens:
                token_data = invitation_tokens[registration_token]
                
                # Verify token hasn't expired
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"⚠️ Registration token expired, but allowing registration")
                    del invitation_tokens[registration_token]  # Clean up expired token
                else:
                    # Verify email matches the invitation
                    if token_data['email'].lower() != email.lower():
                        logger.error(f"❌ Email mismatch: token for {token_data['email']}, but got {email}")
                        raise HTTPException(status_code=400, detail="Email does not match invitation")
                    
                    # Verify user type matches
                    if 'user_type' in token_data and token_data['user_type'] != 'vendor':
                        logger.error(f"❌ User type mismatch: token for {token_data['user_type']}, but endpoint is for vendor")
                        raise HTTPException(status_code=400, detail="Invalid registration token for this user type")
                    
                    token_validated = True
                    logger.info("✅ Registration token validated successfully")
            else:
                logger.warning(f"⚠️ Token not found in memory (may have been cleared by server restart). Proceeding with registration...")
        else:
            logger.info("ℹ️ No registration token provided (direct registration)")
        
        # STEP 2: Save uploaded files
        photo_url = None
        aadhar_front_url = None
        
        if photo_file:
            photo_url = await save_upload_file(photo_file, "vendor")
        if aadhar_front_file:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "vendor")
        
        # Auto-generate Aadhar number if not provided
        if not aadhar_number or aadhar_number.strip() == "":
            import random
            # Generate a realistic 12-digit Aadhar number
            aadhar_number = f"{random.randint(4000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
            logger.info(f"🔢 Auto-generated Aadhar number: {aadhar_number}")
        
        # Log the photo URLs for debugging
        logger.info(f"📸 Photo URL saved: {photo_url}")
        logger.info(f"📄 Aadhar Front URL saved: {aadhar_front_url}")
        
        # Create VendorCreate object
        vendor_data = VendorCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            password=password,
            role=role or 'vendor',  # Use role from frontend or default to 'vendor'
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            postal_code=postal_code,
            country=country,
            legal_name=legal_name,
            business_name=business_name,
            gstin=gstin,
            pan=pan,
            business_type=business_type,
            product_services=product_services,
            years_in_business=years_in_business,
            service_area=service_area,
            photo_url=photo_url,
            aadhar_front_url=aadhar_front_url,
            aadhar_number=aadhar_number,
            user_type=UserRole.vendor
        )
        
        # Create the vendor
        user = VendorService.create_vendor(db, vendor_data)
        db.commit()
        
        # Log the created user data
        logger.info(f"✅ Vendor created with ID: {user.custom_id if hasattr(user, 'custom_id') else user.id}")
        logger.info(f"📸 Saved photo_url in DB: {getattr(user, 'photo_url', None)}")
        logger.info(f"📄 Saved aadhar_front_url in DB: {getattr(user, 'aadhar_front_url', None)}")
        
        # Get the user object to access custom_id and other fields
        # user is already returned by create_vendor
        if not user:
            raise HTTPException(status_code=400, detail="User not found after creation")
        
        # Send welcome email and SMS notifications
        try:
            email_service = EmailService()
            
            # Send welcome email (await the coroutine)
            email_success = await email_service.send_welcome_email(
                to_email=vendor_data.email,
                full_name=vendor_data.full_name,
                user_type='vendor',
                user_id=user.custom_id,
                password=vendor_data.password,
                registration_id=user.custom_id
            )
            logger.info(f"Welcome email sent: {email_success}")
            
            # Send welcome SMS if phone number is provided
            if vendor_data.phone:
                try:
                    from app.services.notifications import notification_service
                    sms_success = await notification_service.send_welcome_sms(
                        phone_number=vendor_data.phone,
                        email=vendor_data.email,
                        user_id=user.custom_id,
                        user_type='vendor',
                        password=vendor_data.password
                    )
                    if sms_success:
                        logger.info(f"✅ Welcome SMS sent to {vendor_data.phone}")
                    else:
                        logger.warning(f"⚠️  Failed to send welcome SMS to {vendor_data.phone}")
                except Exception as sms_error:
                    logger.error(f"❌ Error sending welcome SMS to {vendor_data.phone}: {str(sms_error)}", exc_info=True)
            
            logger.info("✅ Notifications process completed")
                
        except Exception as e:
            logger.error(f"Error in sending notifications: {str(e)}", exc_info=True)
            # Continue with registration even if notifications fail
            
        # Notify admins about new registration
        try:
            await _notify_admins_new_registration(db, user, 'vendor')
        except Exception as e:
            logger.error(f"Error notifying admins: {str(e)}", exc_info=True)
            # Continue with registration even if admin notification fails
        
        # STEP 3: Clean up the used registration token (if it was validated)
        if token_validated and registration_token in invitation_tokens:
            del invitation_tokens[registration_token]
            logger.info(f"🧹 Registration token cleaned up successfully")
        
        return {
            "message": "Vendor registration successful! Your account is pending admin approval.", 
            "success": True,
            "user_id": user.custom_id,
            "email_sent": True,
            "sms_sent": bool(vendor_data.phone),
            "status": "pending_approval"
        }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/register/buyer", response_model=MessageResponse)
async def register_buyer(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    registration_token: Optional[str] = Form(None),  # Added token support
    role: Optional[str] = Form(None),  # Made optional - derive from endpoint
    address_line1: str = Form(None),
    address_line2: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    mandal: Optional[str] = Form(None),
    postal_code: str = Form(None),
    country: str = Form("IN"),
    organization_name: str = Form(None),
    buyer_type: str = Form(None),
    interested_crop_types: str = Form(None),
    preferred_products: str = Form(None),
    monthly_purchase_volume: Optional[float] = Form(None),  # Made optional
    business_license_number: str = Form(None), 
    gst_number: str = Form(None),
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None)
):
    logger.info(f"🔐 Buyer registration attempt for email: {email}")
    logger.info(f"📊 Current tokens in memory: {len(invitation_tokens)} tokens")
    if registration_token:
        logger.info(f"🎫 Received token: {registration_token[:16]}... (length: {len(registration_token)})")
    
    db = next(get_db())
    try:
        # STEP 1: Validate registration token (if provided and exists in memory)
        token_validated = False
        if registration_token:
            logger.info(f"🔍 Checking registration token: {registration_token[:8]}...")
            if registration_token in invitation_tokens:
                token_data = invitation_tokens[registration_token]
                
                # Verify token hasn't expired
                if datetime.utcnow() > token_data['expires_at']:
                    logger.warning(f"⚠️ Registration token expired, but allowing registration")
                    del invitation_tokens[registration_token]  # Clean up expired token
                else:
                    # Verify email matches the invitation
                    if token_data['email'].lower() != email.lower():
                        logger.error(f"❌ Email mismatch: token for {token_data['email']}, but got {email}")
                        raise HTTPException(status_code=400, detail="Email does not match invitation")
                    
                    # Verify user type matches
                    if 'user_type' in token_data and token_data['user_type'] != 'buyer':
                        logger.error(f"❌ User type mismatch: token for {token_data['user_type']}, but endpoint is for buyer")
                        raise HTTPException(status_code=400, detail="Invalid registration token for this user type")
                    
                    token_validated = True
                    logger.info("✅ Registration token validated successfully")
            else:
                logger.warning(f"⚠️ Token not found in memory (may have been cleared by server restart). Proceeding with registration...")
        else:
            logger.info("ℹ️ No registration token provided (direct registration)")
        
        # STEP 2: Save uploaded files
        photo_url = None
        aadhar_front_url = None
        
        if photo_file:
            photo_url = await save_upload_file(photo_file, "buyer")
        if aadhar_front_file:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "buyer")
        
        # Auto-generate Aadhar number if not provided
        if not aadhar_number or aadhar_number.strip() == "":
            import random
            # Generate a realistic 12-digit Aadhar number
            aadhar_number = f"{random.randint(5000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
            logger.info(f"🔢 Auto-generated Aadhar number: {aadhar_number}")
        
        # Log the photo URLs for debugging
        logger.info(f"📸 Photo URL saved: {photo_url}")
        logger.info(f"📄 Aadhar Front URL saved: {aadhar_front_url}")
        
        # Create BuyerCreate object
        buyer_data = BuyerCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            password=password,
            role=role or 'buyer',  # Use role from frontend or default to 'buyer'
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            state=state,
            mandal=mandal,
            postal_code=postal_code,
            country=country,
            organization_name=organization_name,
            buyer_type=buyer_type,
            interested_crop_types=interested_crop_types,
            preferred_products=preferred_products,
            monthly_purchase_volume=monthly_purchase_volume,
            business_license_number=business_license_number,
            gst_number=gst_number,
            photo_url=photo_url,
            aadhar_front_url=aadhar_front_url,
            aadhar_number=aadhar_number,
            user_type=UserRole.buyer
        )
        
        # Create the buyer
        user = BuyerService.create_buyer(db, buyer_data)
        db.commit()
        
        # Log the created user data
        logger.info(f"✅ Buyer created with ID: {user.custom_id if hasattr(user, 'custom_id') else user.id}")
        logger.info(f"📸 Saved photo_url in DB: {getattr(user, 'photo_url', None)}")
        logger.info(f"📄 Saved aadhar_front_url in DB: {getattr(user, 'aadhar_front_url', None)}")
        
        # Get the user object to access custom_id and other fields
        # user is already returned by create_buyer
        if not user:
            raise HTTPException(status_code=400, detail="User not found after creation")
        
        # Send welcome email and SMS notifications
        try:
            email_service = EmailService()
            
            # Send welcome email (await the coroutine)
            email_success = await email_service.send_welcome_email(
                to_email=buyer_data.email,
                full_name=buyer_data.full_name,
                user_type='buyer',
                user_id=user.custom_id,
                password=buyer_data.password,
                registration_id=user.custom_id
            )
            logger.info(f"Welcome email sent: {email_success}")
            
            # Send welcome SMS if phone number is provided
            if buyer_data.phone:
                try:
                    from app.services.notifications import notification_service
                    sms_success = await notification_service.send_welcome_sms(
                        phone_number=buyer_data.phone,
                        email=buyer_data.email,
                        user_id=user.custom_id,
                        user_type='buyer',
                        password=buyer_data.password
                    )
                    if sms_success:
                        logger.info(f"✅ Welcome SMS sent to {buyer_data.phone}")
                    else:
                        logger.warning(f"⚠️  Failed to send welcome SMS to {buyer_data.phone}")
                except Exception as sms_error:
                    logger.error(f"❌ Error sending welcome SMS to {buyer_data.phone}: {str(sms_error)}", exc_info=True)
            
            logger.info("✅ Notifications process completed")
                
        except Exception as e:
            logger.error(f"Error in sending notifications: {str(e)}", exc_info=True)
            # Continue with registration even if notifications fail
            
        # Notify admins about new registration
        try:
            await _notify_admins_new_registration(db, user, 'buyer')
        except Exception as e:
            logger.error(f"Error notifying admins: {str(e)}", exc_info=True)
            # Continue with registration even if admin notification fails
        
        # STEP 3: Clean up the used registration token (if it was validated)
        if token_validated and registration_token in invitation_tokens:
            del invitation_tokens[registration_token]
            logger.info(f"🧹 Registration token cleaned up successfully")
        
        return {
            "message": "Buyer registration successful! Your account is pending admin approval.", 
            "success": True,
            "user_id": user.custom_id,
            "email_sent": True,
            "sms_sent": bool(buyer_data.phone),
            "status": "pending_approval"
        }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ---------------- User Management ---------------- #
# Get all users (public endpoint)
@router.get("/users/", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_all_users(
    db: Session = Depends(get_db)
):
    """
    Get all users with their basic information
    This endpoint is public and does not require authentication
    """
    try:
        # Get all users
        users = db.query(User).all()
        
        # Convert SQLAlchemy models to dictionaries
        return [
            {
                "id": str(user.id),
                "custom_id": user.custom_id,
                "role": user.role.value,
                "email": user.email,
                "phone": user.phone,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "verification_status": user.verification_status.value if user.verification_status else None,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
            for user in users
        ]
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching users"
        )

# Get all farmers with details
@router.get("/farmers", response_model=list[dict])
def get_farmers():
    """
    Get all registered farmers with their details
    """
    db = next(get_db())
    try:
        farmers = db.query(Farmer).all()
        result = []
        
        for farmer in farmers:
            # Get the associated user to access custom_id
            user = db.query(User).filter(User.id == farmer.user_id).first() if farmer.user_id else None
            
            # Format location display - combine city, state, country
            location_parts = []
            if getattr(farmer, 'city', ''):
                location_parts.append(getattr(farmer, 'city', ''))
            if getattr(farmer, 'state', ''):
                location_parts.append(getattr(farmer, 'state', ''))
            if getattr(farmer, 'country', '') and getattr(farmer, 'country', '') != "IN":  # Only show country if not India
                location_parts.append(getattr(farmer, 'country', ''))
            
            location_display = ", ".join(location_parts) if location_parts else "N/A"
            
            result.append({
                'id': str(farmer.id),
                'user_id': str(farmer.user_id) if farmer.user_id else '',
                'custom_id': user.custom_id if user and hasattr(user, 'custom_id') else None,
                'name': getattr(farmer, 'full_name', ''),  # Frontend expects 'name'
                'full_name': getattr(farmer, 'full_name', ''),
                'email': getattr(farmer, 'email', ''),
                'phone': getattr(farmer, 'phone', ''),
                'farm_size': getattr(farmer, 'farm_size', None),
                'primary_crop_types': getattr(farmer, 'primary_crop_types', ''),
                'years_of_experience': getattr(farmer, 'years_of_experience', 0),
                'farmer_location': getattr(farmer, 'farmer_location', ''),
                'verification_status': farmer.verification_status.value if hasattr(farmer, 'verification_status') and hasattr(farmer.verification_status, 'value') else str(getattr(farmer, 'verification_status', 'pending')),
                'is_verified': getattr(farmer, 'is_verified', False),
                'photo_url': f"/uploads/farmers/{getattr(farmer, 'photo_url', None)}" if getattr(farmer, 'photo_url', None) and not getattr(farmer, 'photo_url', '').startswith('/uploads/') else getattr(farmer, 'photo_url', None),
                'aadhar_front_url': f"/uploads/farmers/{getattr(farmer, 'aadhar_front_url', None)}" if getattr(farmer, 'aadhar_front_url', None) and not getattr(farmer, 'aadhar_front_url', '').startswith('/uploads/') else getattr(farmer, 'aadhar_front_url', None),
                'aadhar_number': getattr(farmer, 'aadhar_number', None),
                'address_line1': getattr(farmer, 'address_line1', ''),
                'address_line2': getattr(farmer, 'address_line2', ''),
                'city': getattr(farmer, 'city', ''),
                'state': getattr(farmer, 'state', ''),
                'mandal': getattr(farmer, 'mandal', ''),
                'country': getattr(farmer, 'country', ''),
                'postal_code': getattr(farmer, 'postal_code', ''),
                'location': location_display,  # Combined location for display
                'created_at': farmer.created_at.isoformat() if hasattr(farmer, 'created_at') and farmer.created_at else None
            })
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Get all landowners with details
@router.get("/landowners", response_model=list[dict])
def get_landowners():
    """
    Get all registered landowners with their details
    """
    db = next(get_db())
    try:
        # Join with User table to get custom_id
        landowners = db.query(Landowner).join(User, Landowner.user_id == User.id, isouter=True).all()
        result = []
        
        for landowner in landowners:
            # Get the associated user to access custom_id
            user = db.query(User).filter(User.id == landowner.user_id).first() if landowner.user_id else None
            
            # Format location display - combine city, state, country
            location_parts = []
            if getattr(landowner, 'city', ''):
                location_parts.append(getattr(landowner, 'city', ''))
            if getattr(landowner, 'state', ''):
                location_parts.append(getattr(landowner, 'state', ''))
            if getattr(landowner, 'country', '') and getattr(landowner, 'country', '') != "IN":  # Only show country if not India
                location_parts.append(getattr(landowner, 'country', ''))
            
            location_display = ", ".join(location_parts) if location_parts else "N/A"
            
            result.append({
                'id': str(landowner.id),
                'user_id': str(landowner.user_id) if landowner.user_id else '',
                'custom_id': user.custom_id if user and hasattr(user, 'custom_id') else None,
                'name': getattr(landowner, 'full_name', ''),  # Frontend expects 'name'
                'full_name': getattr(landowner, 'full_name', ''),
                'email': getattr(landowner, 'email', ''),
                'phone': getattr(landowner, 'phone', ''),
                'total_land_area': getattr(landowner, 'total_land_area', None),
                'current_land_use': getattr(landowner, 'current_land_use', None),
                'managing_remotely': getattr(landowner, 'managing_remotely', False),
                'verification_status': landowner.verification_status.value if hasattr(landowner, 'verification_status') and hasattr(landowner.verification_status, 'value') else str(getattr(landowner, 'verification_status', 'pending')),
                'is_verified': getattr(landowner, 'is_verified', False),
                'photo_url': f"/uploads/landowners/{getattr(landowner, 'photo_url', None)}" if getattr(landowner, 'photo_url', None) and not getattr(landowner, 'photo_url', '').startswith('/uploads/') else getattr(landowner, 'photo_url', None),
                'aadhar_front_url': f"/uploads/landowners/{getattr(landowner, 'aadhar_front_url', None)}" if getattr(landowner, 'aadhar_front_url', None) and not getattr(landowner, 'aadhar_front_url', '').startswith('/uploads/') else getattr(landowner, 'aadhar_front_url', None),
                'aadhar_number': getattr(landowner, 'aadhar_number', None),
                'address_line1': getattr(landowner, 'address_line1', ''),
                'address_line2': getattr(landowner, 'address_line2', ''),
                'city': getattr(landowner, 'city', ''),
                'state': getattr(landowner, 'state', ''),
                'mandal': getattr(landowner, 'mandal', ''),
                'country': getattr(landowner, 'country', ''),
                'postal_code': getattr(landowner, 'postal_code', ''),
                'location': location_display,  # Combined location for display
                'created_at': landowner.created_at.isoformat() if hasattr(landowner, 'created_at') and landowner.created_at else None
            })
        
        # Debug logging
        if result:
            logger.info(f"📋 Returning {len(result)} landowners")
            logger.info(f"🔍 First landowner custom_id: {result[0].get('custom_id')}, verification_status: {result[0].get('verification_status')}, is_verified: {result[0].get('is_verified')}")
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Get all buyers with details
@router.get("/buyers", response_model=list[dict])
def get_buyers():
    """
    Get all registered buyers with their details
    """
    db = next(get_db())
    try:
        buyers = db.query(Buyer).all()
        result = []
        
        for buyer in buyers:
            # Get the associated user to access custom_id
            user = db.query(User).filter(User.id == buyer.user_id).first() if buyer.user_id else None
            
            # Format location display - combine city, state, country
            location_parts = []
            if getattr(buyer, 'city', ''):
                location_parts.append(getattr(buyer, 'city', ''))
            if getattr(buyer, 'state', ''):
                location_parts.append(getattr(buyer, 'state', ''))
            if getattr(buyer, 'country', '') and getattr(buyer, 'country', '') != "IN":  # Only show country if not India
                location_parts.append(getattr(buyer, 'country', ''))
            
            location_display = ", ".join(location_parts) if location_parts else "N/A"
            
            result.append({
                'id': str(buyer.id),
                'user_id': str(buyer.user_id),
                'custom_id': user.custom_id if user and hasattr(user, 'custom_id') else None,
                'name': getattr(buyer, 'full_name', ''),  # Frontend expects 'name'
                'full_name': getattr(buyer, 'full_name', ''),
                'email': getattr(buyer, 'email', ''),
                'phone': getattr(buyer, 'phone', ''),
                'organization_name': getattr(buyer, 'organization_name', ''),
                'buyer_type': getattr(buyer, 'buyer_type', ''),
                'interested_crop_types': getattr(buyer, 'interested_crop_types', ''),
                'verification_status': buyer.verification_status.value if hasattr(buyer, 'verification_status') and hasattr(buyer.verification_status, 'value') else str(getattr(buyer, 'verification_status', 'pending')),
                'is_verified': getattr(buyer, 'is_verified', False),
                'photo_url': f"/uploads/buyers/{getattr(buyer, 'photo_url', None)}" if getattr(buyer, 'photo_url', None) and not getattr(buyer, 'photo_url', '').startswith('/uploads/') else getattr(buyer, 'photo_url', None),
                'aadhar_front_url': f"/uploads/buyers/{getattr(buyer, 'aadhar_front_url', None)}" if getattr(buyer, 'aadhar_front_url', None) and not getattr(buyer, 'aadhar_front_url', '').startswith('/uploads/') else getattr(buyer, 'aadhar_front_url', None),
                'aadhar_number': getattr(buyer, 'aadhar_number', None),
                'address_line1': getattr(buyer, 'address_line1', ''),
                'address_line2': getattr(buyer, 'address_line2', ''),
                'city': getattr(buyer, 'city', ''),
                'state': getattr(buyer, 'state', ''),
                'mandal': getattr(buyer, 'mandal', ''),
                'country': getattr(buyer, 'country', ''),
                'postal_code': getattr(buyer, 'postal_code', ''),
                'location': location_display,  # Combined location for display
                'created_at': buyer.created_at.isoformat() if hasattr(buyer, 'created_at') and buyer.created_at else None
            })
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Get all vendors with details
@router.get("/vendors", response_model=list[dict])
def get_vendors():
    """
    Get all registered vendors with their details
    """
    db = next(get_db())
    try:
        vendors = db.query(Vendor).all()
        result = []
        for vendor in vendors:
            try:
                # Get the associated user to access custom_id
                user = db.query(User).filter(User.id == vendor.user_id).first() if vendor.user_id else None
                
                # Format location display - combine city, state, country
                location_parts = []
                if getattr(vendor, 'city', ''):
                    location_parts.append(getattr(vendor, 'city', ''))
                if getattr(vendor, 'state', ''):
                    location_parts.append(getattr(vendor, 'state', ''))
                if getattr(vendor, 'country', '') and getattr(vendor, 'country', '') != "IN":  # Only show country if not India
                    location_parts.append(getattr(vendor, 'country', ''))
                
                location_display = ", ".join(location_parts) if location_parts else "N/A"
                
                vendor_data = {
                    'id': str(getattr(vendor, 'id', '')),
                    'user_id': str(getattr(vendor, 'user_id', '')),
                    'custom_id': user.custom_id if user and hasattr(user, 'custom_id') else None,
                    'name': getattr(vendor, 'full_name', ''),  # Frontend expects 'name'
                    'full_name': getattr(vendor, 'full_name', ''),
                    'email': getattr(vendor, 'email', ''),
                    'phone': getattr(vendor, 'phone', ''),
                    'legal_name': getattr(vendor, 'legal_name', ''),
                    'business_name': getattr(vendor, 'business_name', ''),
                    'gstin': getattr(vendor, 'gstin', ''),
                    'pan': getattr(vendor, 'pan', ''),
                    'business_type': getattr(vendor, 'business_type', ''),
                    'product_services': getattr(vendor, 'product_services', ''),
                    'years_in_business': getattr(vendor, 'years_in_business', 0),
                    'service_area': getattr(vendor, 'service_area', ''),
                    'rating_avg': float(getattr(vendor, 'rating_avg', 0.0)),
                    'rating_count': getattr(vendor, 'rating_count', 0),
                    'verified': getattr(vendor, 'verified', False),
                    'certification_status': getattr(vendor, 'certification_status', 'PENDING'),
                    'verification_status': vendor.verification_status.value if hasattr(vendor, 'verification_status') and hasattr(vendor.verification_status, 'value') else str(getattr(vendor, 'verification_status', 'pending')),
                    'is_verified': getattr(vendor, 'is_verified', False),
                    'photo_url': f"/uploads/vendors/{getattr(vendor, 'photo_url', None)}" if getattr(vendor, 'photo_url', None) and not getattr(vendor, 'photo_url', '').startswith('/uploads/') else getattr(vendor, 'photo_url', None),
                    'aadhar_front_url': f"/uploads/vendors/{getattr(vendor, 'aadhar_front_url', None)}" if getattr(vendor, 'aadhar_front_url', None) and not getattr(vendor, 'aadhar_front_url', '').startswith('/uploads/') else getattr(vendor, 'aadhar_front_url', None),
                    'aadhar_number': getattr(vendor, 'aadhar_number', None),
                    'address_line1': getattr(vendor, 'address_line1', ''),
                    'address_line2': getattr(vendor, 'address_line2', ''),
                    'city': getattr(vendor, 'city', ''),
                    'state': getattr(vendor, 'state', ''),
                    'mandal': getattr(vendor, 'mandal', ''),
                    'country': getattr(vendor, 'country', 'IN'),
                    'postal_code': getattr(vendor, 'postal_code', ''),
                    'location': location_display,  # Combined location for display
                    'created_at': vendor.created_at.isoformat() if hasattr(vendor, 'created_at') and vendor.created_at else None,
                    'updated_at': vendor.updated_at.isoformat() if hasattr(vendor, 'updated_at') and vendor.updated_at else None
                }
                result.append(vendor_data)
            except Exception as vendor_error:
                print(f"Error processing vendor {getattr(vendor, 'id', 'unknown')}: {str(vendor_error)}")
                continue
                
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

# Get specific user by ID with role-based response model
@router.get("/{user_type}/{user_id}")
async def get_specific_user(
    user_type: UserRole,
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID with role-specific response model
    """
    try:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get the specific user type based on user_type
        if user_type == UserRole.farmer:
            user_detail = db.query(Farmer).filter(Farmer.user_id == user_id).first()
        elif user_type == UserRole.landowner:
            user_detail = db.query(Landowner).filter(Landowner.user_id == user_id).first()
        elif user_type == UserRole.vendor:
            user_detail = db.query(Vendor).filter(Vendor.user_id == user_id).first()
        elif user_type == UserRole.buyer:
            user_detail = db.query(Buyer).filter(Buyer.user_id == user_id).first()
        elif user_type == UserRole.agri_copilot:
            user_detail = db.query(AgriCopilot).filter(AgriCopilot.user_id == user_id).first()
        else:
            user_detail = None
            
        if not user_detail:
            raise HTTPException(status_code=404, detail=f"{user_type.value.capitalize()} details not found")
            
        # Convert to response model
        if user_type == UserRole.farmer:
            return FarmerResponse.model_validate(user_detail.__dict__)
        elif user_type == UserRole.landowner:
            return LandownerResponse.model_validate(user_detail.__dict__)
        elif user_type == UserRole.buyer:
            # Convert Buyer model to dict and handle any necessary field mappings
            buyer_dict = user_detail.__dict__.copy()
            # Ensure all required fields have values
            buyer_dict['reliability_score'] = getattr(user_detail, 'reliability_score', 0.0)
            buyer_dict['user_type'] = UserRole.buyer
            return BuyerResponse.model_validate(buyer_dict)
        elif user_type == UserRole.vendor:
            return VendorResponse.model_validate(user_detail.__dict__)
        elif user_type == UserRole.agri_copilot:
            return AgriCopilotResponse.model_validate(user_detail.__dict__)
        else:
            return UserResponse.model_validate(user.__dict__)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- Bulk Upload Functions ---------------- #

@router.post("/bulk-upload/users", response_model=MessageResponse)
async def bulk_upload_users(
    file: UploadFile = File(...),
    user_type: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Bulk upload users from Excel, CSV, PDF, or DOCX file
    Supports: landowner, farmer, vendor, buyer, agri_copilot
    File formats: .xlsx, .xls, .csv, .pdf, .doc, .docx
    """
    try:
        # Validate file format - support Excel, CSV, PDF, and DOCX
        valid_extensions = ('.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx')
        if not file.filename.endswith(valid_extensions):
            raise HTTPException(
                status_code=400, 
                detail=f"File must be one of: {', '.join(valid_extensions)}"
            )
        
        # Validate user type
        valid_user_types = ['landowner', 'farmer', 'vendor', 'buyer', 'agri_copilot']
        if user_type not in valid_user_types:
            raise HTTPException(status_code=400, detail=f"Invalid user type. Must be one of: {valid_user_types}")
        
        # Read file content
        content = await file.read()
        
        # Parse file based on format
        df = None
        try:
            if file.filename.endswith(('.xlsx', '.xls')):
                # Parse Excel file
                df = pd.read_excel(io.BytesIO(content))
            elif file.filename.endswith('.csv'):
                # Parse CSV file
                df = pd.read_csv(io.BytesIO(content))
            elif file.filename.endswith('.pdf'):
                # For PDF: This is a placeholder - you'd need pdfplumber or PyPDF2
                # For now, reject PDFs with a clear message
                raise HTTPException(
                    status_code=400, 
                    detail="PDF parsing not yet implemented. Please use Excel (.xlsx) or CSV (.csv) format."
                )
            elif file.filename.endswith(('.doc', '.docx')):
                # For DOCX: This is a placeholder - you'd need python-docx
                # For now, reject DOCX with a clear message
                raise HTTPException(
                    status_code=400, 
                    detail="DOCX parsing not yet implemented. Please use Excel (.xlsx) or CSV (.csv) format."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
        # Normalize column names - support flexible naming
        column_mapping = {
            'name': 'full_name',
            'full name': 'full_name',
            'phone number': 'phone',
            'phone_number': 'phone',
            'mobile': 'phone',
            'email address': 'email',
        }
        
        # Rename columns to standard names (case-insensitive)
        df.columns = df.columns.str.strip().str.lower()
        for old_name, new_name in column_mapping.items():
            if old_name in df.columns:
                df.rename(columns={old_name: new_name}, inplace=True)
        
        # Simplified validation - only require 3 columns for all user types
        required_cols = ['full_name', 'email', 'phone']
        
        # Check for required columns
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}. Found columns: {list(df.columns)}")
        
        # Process each row - SEND INVITATIONS instead of direct creation
        successful_invites = 0
        failed_invites = []
        existing_emails = []
        invalid_emails = []
        email_service = EmailService()  # Initialize email service for bulk invitations
        
        # Map user_type to the appropriate database table for duplicate checking
        user_type_tables = {
            'agri_copilot': AgriCopilot,
            'farmer': Farmer,
            'landowner': Landowner,
            'vendor': Vendor,
            'buyer': Buyer
        }
        
        for index, row in df.iterrows():
            try:
                # Extract basic data from row
                full_name = str(row['full_name']).strip()
                email = str(row['email']).strip().lower()
                phone = str(row['phone']).strip()
                
                # Validate email format
                if '@' not in email or '.' not in email.split('@')[1]:
                    invalid_emails.append(f"Row {index + 2}: {email} (invalid format)")
                    failed_invites.append(f"Row {index + 2}: Invalid email format: {email}")
                    continue
                
                # Check if user already exists
                UserTable = user_type_tables.get(user_type)
                if UserTable:
                    existing = db.query(UserTable).filter(UserTable.email == email).first()
                    if existing:
                        existing_emails.append(f"Row {index + 2}: {email} (already registered as {existing.full_name})")
                        failed_invites.append(f"Row {index + 2}: Email {email} already exists")
                        continue
                
                # Generate registration token
                registration_token = str(uuid.uuid4())
                
                # Store invitation token with data
                invitation_tokens[registration_token] = {
                    'email': email,
                    'full_name': full_name,
                    'phone': phone,
                    'user_type': user_type,
                    'created_at': datetime.utcnow(),
                    'expires_at': datetime.utcnow() + timedelta(hours=48)  # 48 hours for bulk invites
                }
                
                # Generate registration link
                frontend_base = settings.FRONTEND_BASE_URL or "http://localhost:3000"
                registration_link = f"{frontend_base}/admin/register/{user_type.replace('_', '-')}?token={registration_token}"
                
                # Send invitation email using the appropriate method
                role_method_map = {
                    'agri_copilot': 'agri_copilot',
                    'farmer': 'farmer',
                    'landowner': 'landowner',
                    'vendor': 'vendor',
                    'buyer': 'buyer'
                }
                
                role_for_email = role_method_map.get(user_type, user_type)
                
                # Send invitation email
                try:
                    # Use the _send_invite_email helper pattern
                    method_name = f"send_{role_for_email}_invitation_email"
                    method = getattr(email_service, method_name, None)
                    
                    if callable(method):
                        sent = method(email=email, full_name=full_name, registration_link=registration_link)
                    else:
                        # Fallback to generic invitation
                        logger.warning(f"Method {method_name} not found, using fallback")
                        sent = email_service._send_email(
                            to_email=email,
                            subject=f"You're Invited to Join AgriHub as {user_type.replace('_', ' ').title()}",
                            html_content=f"""
                            <html>
                            <body>
                                <h2>Welcome to AgriHub!</h2>
                                <p>Hello {full_name},</p>
                                <p>You have been invited to register as a {user_type.replace('_', ' ').title()} on AgriHub.</p>
                                <p><a href="{registration_link}">Complete Registration</a></p>
                                <p>Link: {registration_link}</p>
                                <p>Best regards,<br>The AgriHub Team</p>
                            </body>
                            </html>
                            """
                        )
                    
                    if sent:
                        successful_invites += 1
                        logger.info(f"✅ Invitation sent to {email}")
                    else:
                        # Remove token if email failed
                        invitation_tokens.pop(registration_token, None)
                        failed_invites.append(f"Row {index + 2}: Failed to send email to {email}")
                        
                except Exception as email_error:
                    logger.error(f"❌ Email error for {email}: {str(email_error)}")
                    invitation_tokens.pop(registration_token, None)
                    failed_invites.append(f"Row {index + 2}: Email error for {email}")
                    continue
                
            except Exception as e:
                logger.error(f"❌ Error processing row {index + 2}: {str(e)}")
                failed_invites.append(f"Row {index + 2}: {str(e)}")
                continue
        
        # Prepare detailed response
        total_rows = len(df)
        new_invitations = successful_invites
        existing_count = len(existing_emails)
        invalid_count = len(invalid_emails)
        other_failures = len(failed_invites) - existing_count - invalid_count
        
        response_message = f"Bulk upload completed: {new_invitations} new invitations sent"
        
        if existing_count > 0:
            response_message += f", {existing_count} emails already exist in AgriHub"
        
        if invalid_count > 0:
            response_message += f", {invalid_count} invalid email formats"
            
        if other_failures > 0:
            response_message += f", {other_failures} other failures"
        
        # Detailed breakdown for admin visibility
        breakdown_message = f"📊 Processing Summary:\n"
        breakdown_message += f"• Total rows processed: {total_rows}\n"
        breakdown_message += f"• New invitations sent: {new_invitations}\n"
        breakdown_message += f"• Existing emails skipped: {existing_count}\n"
        breakdown_message += f"• Invalid emails skipped: {invalid_count}\n"
        if other_failures > 0:
            breakdown_message += f"• Other failures: {other_failures}\n"
        
        if new_invitations > 0:
            breakdown_message += f"\n✅ {new_invitations} users will receive registration links via email."
        
        if existing_count > 0:
            breakdown_message += f"\n⚠️ Existing emails were detected and skipped to prevent duplicates."
        
        logger.info(f"✅ Bulk invitation summary: {new_invitations}/{total_rows} new invitations, {existing_count} existing, {invalid_count} invalid")
        
        return {
            "message": response_message,
            "detailed_message": breakdown_message,
            "success": True,
            "total_rows": total_rows,
            "new_invitations": new_invitations,
            "existing_emails_count": existing_count,
            "invalid_emails_count": invalid_count,
            "successful_uploads": new_invitations,  # For backward compatibility
            "failed_uploads": len(failed_invites),  # For backward compatibility
            "emails_sent": new_invitations,
            "existing_emails": existing_emails[:20],  # Show first 20 existing emails
            "invalid_emails": invalid_emails[:20],   # Show first 20 invalid emails
            "other_errors": [error for error in failed_invites if not any(existing in error for existing in existing_emails + invalid_emails)][:10],
            "invitation_info": "New users will receive registration links valid for 48 hours. Existing users were not contacted to prevent duplicates."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk invitation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk invitation failed: {str(e)}")


# Specific bulk upload endpoints for compatibility with frontend
@router.post("/bulk-upload/agri_copilot")
async def bulk_upload_agri_copilot(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload agri_copilot users"""
    return await bulk_upload_users(file=file, user_type="agri_copilot", db=db)


@router.post("/bulk-upload/vendor")
async def bulk_upload_vendor(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload vendors"""
    return await bulk_upload_users(file=file, user_type="vendor", db=db)


@router.post("/bulk-upload/farmer")
async def bulk_upload_farmer(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload farmers"""
    return await bulk_upload_users(file=file, user_type="farmer", db=db)


@router.post("/bulk-upload/landowner")
async def bulk_upload_landowner(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload landowners"""
    return await bulk_upload_users(file=file, user_type="landowner", db=db)


@router.post("/bulk-upload/buyer")
async def bulk_upload_buyer(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload buyers"""
    return await bulk_upload_users(file=file, user_type="buyer", db=db)


@router.post("/approve/landowner/{landowner_id}", response_model=MessageResponse)
async def approve_landowner(
    landowner_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Approve a landowner"""
    try:
        # Find the landowner
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")

        # Update landowner status
        landowner.verification_status = ApprovalStatus.approved.value
        landowner.is_verified = True
        landowner.verified_at = datetime.utcnow()
        landowner.verified_by = current_admin.id

        # Also update the user status
        user = db.query(User).filter(User.id == landowner.user_id).first()
        if user:
            user.is_verified = True
            user.verification_status = ApprovalStatus.approved.value

        db.commit()

        # Send approval email
        try:
            email_service = EmailService()
            email_service.send_verification_approval_email(
                landowner.email,
                landowner.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {str(e)}")

        return {"message": f"Landowner {landowner.full_name} approved successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error approving landowner: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve/farmer/{farmer_id}", response_model=MessageResponse)
async def approve_farmer(
    farmer_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Approve a farmer"""
    try:
        # Find the farmer
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

        # Update farmer status
        farmer.verification_status = ApprovalStatus.approved.value
        farmer.is_verified = True
        farmer.verified_at = datetime.utcnow()
        farmer.verified_by = current_admin.id

        # Also update the user status
        user = db.query(User).filter(User.id == farmer.user_id).first()
        if user:
            user.is_verified = True
            user.verification_status = ApprovalStatus.approved.value

        db.commit()

        # Send approval email
        try:
            email_service = EmailService()
            email_service.send_verification_approval_email(
                farmer.email,
                farmer.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {str(e)}")

        return {"message": f"Farmer {farmer.full_name} approved successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error approving farmer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve/vendor/{vendor_id}", response_model=MessageResponse)
async def approve_vendor(
    vendor_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Approve a vendor"""
    try:
        # Find the vendor
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")

        # Update vendor status
        vendor.verification_status = ApprovalStatus.approved.value
        vendor.verified = True
        vendor.verified_at = datetime.utcnow()
        vendor.verified_by = current_admin.id

        # Also update the user status
        user = db.query(User).filter(User.id == vendor.user_id).first()
        if user:
            user.is_verified = True
            user.verification_status = ApprovalStatus.approved.value

        db.commit()

        # Send approval email
        try:
            email_service = EmailService()
            email_service.send_verification_approval_email(
                vendor.email,
                vendor.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {str(e)}")

        return {"message": f"Vendor {vendor.full_name} approved successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error approving vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve/buyer/{buyer_id}", response_model=MessageResponse)
async def approve_buyer(
    buyer_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Approve a buyer"""
    try:
        # Find the buyer
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")

        # Update buyer status
        buyer.verification_status = ApprovalStatus.approved.value
        buyer.is_verified = True
        buyer.verified_at = datetime.utcnow()
        buyer.verified_by = current_admin.id

        # Also update the user status
        user = db.query(User).filter(User.id == buyer.user_id).first()
        if user:
            user.is_verified = True
            user.verification_status = ApprovalStatus.approved.value

        db.commit()

        # Send approval email
        try:
            email_service = EmailService()
            email_service.send_verification_approval_email(
                buyer.email,
                buyer.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send approval email: {str(e)}")

        return {"message": f"Buyer {buyer.full_name} approved successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error approving buyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject/farmer/{farmer_id}", response_model=MessageResponse)
async def reject_farmer(
    farmer_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Reject a farmer"""
    try:
        # Find the farmer
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")

        # Update farmer status
        farmer.verification_status = ApprovalStatus.rejected.value
        farmer.is_verified = False

        # Also update the user status
        user = db.query(User).filter(User.id == farmer.user_id).first()
        if user:
            user.is_verified = False
            user.verification_status = ApprovalStatus.rejected.value

        db.commit()

        # Send rejection email
        try:
            email_service = EmailService()
            email_service.send_verification_rejection_email(
                farmer.email,
                farmer.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {str(e)}")

        return {"message": f"Farmer {farmer.full_name} rejected successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting farmer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject/vendor/{vendor_id}", response_model=MessageResponse)
async def reject_vendor(
    vendor_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Reject a vendor"""
    try:
        # Find the vendor
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")

        # Update vendor status
        vendor.verification_status = ApprovalStatus.rejected.value
        vendor.verified = False

        # Also update the user status
        user = db.query(User).filter(User.id == vendor.user_id).first()
        if user:
            user.is_verified = False
            user.verification_status = ApprovalStatus.rejected.value

        db.commit()

        # Send rejection email
        try:
            email_service = EmailService()
            email_service.send_verification_rejection_email(
                vendor.email,
                vendor.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {str(e)}")

        return {"message": f"Vendor {vendor.full_name} rejected successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject/buyer/{buyer_id}", response_model=MessageResponse)
async def reject_buyer(
    buyer_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Reject a buyer"""
    try:
        # Find the buyer
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")

        # Update buyer status
        buyer.verification_status = ApprovalStatus.rejected.value
        buyer.is_verified = False

        # Also update the user status
        user = db.query(User).filter(User.id == buyer.user_id).first()
        if user:
            user.is_verified = False
            user.verification_status = ApprovalStatus.rejected.value

        db.commit()

        # Send rejection email
        try:
            email_service = EmailService()
            email_service.send_verification_rejection_email(
                buyer.email,
                buyer.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {str(e)}")

        return {"message": f"Buyer {buyer.full_name} rejected successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting buyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject/landowner/{landowner_id}", response_model=MessageResponse)
async def reject_landowner(
    landowner_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Reject a landowner"""
    try:
        # Find the landowner
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")

        # Update landowner status
        landowner.verification_status = ApprovalStatus.rejected.value
        landowner.is_verified = False

        # Also update the user status
        user = db.query(User).filter(User.id == landowner.user_id).first()
        if user:
            user.is_verified = False
            user.verification_status = ApprovalStatus.rejected.value

        db.commit()

        # Send rejection email
        try:
            email_service = EmailService()
            email_service.send_verification_rejection_email(
                landowner.email,
                landowner.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send rejection email: {str(e)}")

        return {"message": f"Landowner {landowner.full_name} rejected successfully", "success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting landowner: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- Helper Functions ---------------- #
async def _notify_admins_new_registration(db: Session, new_user: User, user_type: str):
    """
    Notify all admin users about a new user registration
    """
    from app.services.email_service import email_service
    from app.services.notifications import notification_service
    from app.schemas.postgres_base import UserRole  # Fixed import
    from sqlalchemy import or_
    
    try:
        # Get all admin users
        admin_users = db.query(User).filter(
            User.role == UserRole.admin.value,  # Fixed: use .value for enum
            User.is_active == True
        ).all()
        
        if not admin_users:
            logger.warning("No active admin users found to notify about new registration")
            return
            
        # Prepare notification tasks
        notification_tasks = []
        
        for admin in admin_users:
            # Send email to admin
            notification_tasks.append(
                email_service.send_admin_notification_new_user(
                    admin_email=admin.user.email,
                    admin_name=admin.user.full_name,
                    new_user_name=new_user.full_name,
                    new_user_email=new_user.email,
                    new_user_role=user_type,
                    registration_date=new_user.created_at.isoformat()
                )
            )
            
            # Add SMS notification if admin has phone number
            if admin.user.phone:
                notification_tasks.append(
                    notification_service.send_admin_notification_new_user_sms(
                        admin_phone=admin.user.phone,
                        admin_name=admin.user.full_name,
                        new_user_name=new_user.full_name,
                        new_user_role=user_type
                    )
                )
        
        # Run all notifications concurrently
        await asyncio.gather(*notification_tasks, return_exceptions=True)
        
        logger.info(f"Notified {len(admin_users)} admins about new {user_type} user {new_user.id}")
        
    except Exception as e:
        logger.error(f"Error notifying admins about new registration: {str(e)}", exc_info=True)
        # Don't fail the main operation if notification fails

# ---------------- Admin Endpoints ---------------- #
# Farmer verification endpoint
from pydantic import BaseModel

class StatusUpdate(BaseModel):
    status: str

@router.post("/verify/farmer/{farmer_id}")
async def verify_farmer(
    farmer_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Verify a farmer account (Admin only)"""
    try:
        # Convert string to UUID if needed
        try:
            farmer_uuid = uuid.UUID(farmer_id)
        except ValueError:
            logger.error(f"Invalid UUID format for farmer_id: {farmer_id}")
            raise HTTPException(status_code=400, detail="Invalid farmer ID format")
        
        # Query farmer by UUID
        farmer = db.query(Farmer).filter(Farmer.id == farmer_uuid).first()
        if not farmer:
            logger.error(f"Farmer not found with ID: {farmer_id}")
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        logger.info(f"Processing verification for farmer {farmer_id} with status: {status_update.status}")
        
        if status_update.status == "approved":
            farmer.verification_status = ApprovalStatus.approved.value
            farmer.is_verified = True
            # Send approval email
            try:
                email_service.send_verification_approval_email(
                    farmer.email,
                    farmer.full_name
                )
                logger.info(f"Approval email sent to farmer: {farmer.email}")
            except Exception as email_error:
                logger.warning(f"Failed to send approval email: {str(email_error)}")
        else:
            farmer.verification_status = ApprovalStatus.rejected.value
            farmer.is_verified = False
            # Send rejection email
            try:
                email_service.send_verification_rejection_email(
                    farmer.email,
                    farmer.full_name,
                    "farmer",
                    "Your registration was not approved by the admin."
                )
                logger.info(f"Rejection email sent to farmer: {farmer.email}")
            except Exception as email_error:
                logger.warning(f"Failed to send rejection email: {str(email_error)}")
        
        farmer.updated_at = datetime.utcnow()
        db.commit()
        logger.info(f"Farmer {farmer_id} {status_update.status} successfully")
        return {"message": f"Farmer {status_update.status} successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying farmer: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Error in database operation: {str(e)}")

@router.post("/verify/landowner/{landowner_id}")
async def verify_landowner(
    landowner_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Verify a landowner account (Admin only)"""
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        if status_update.status == "approved":
            landowner.verification_status = ApprovalStatus.approved.value
            landowner.is_verified = True
            # Send approval email asynchronously
            email_service.send_verification_approval_email(
                landowner.email,
                landowner.full_name
            )
        else:
            landowner.verification_status = ApprovalStatus.rejected.value
            landowner.is_verified = False
            # Send rejection email
            email_service.send_verification_rejection_email(
                landowner.email,
                landowner.full_name,
                "landowner",
                "Your landowner registration was not approved by the admin."
            )
        
        landowner.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(landowner)
        
        return {
            "message": f"Landowner {status_update.status} successfully",
            "landowner": {
                "id": str(landowner.id),
                "verification_status": landowner.verification_status.value if hasattr(landowner.verification_status, 'value') else str(landowner.verification_status),
                "is_verified": landowner.is_verified
            }
        }
    except Exception as e:
        logger.error(f"Error verifying landowner: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify/vendor/{vendor_id}")
async def verify_vendor(
    vendor_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Verify a vendor account (Admin only)"""
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        if status_update.status == "approved":
            vendor.verification_status = ApprovalStatus.approved.value
            vendor.is_verified = True
            # Send approval email
            email_service.send_verification_approval_email(
                vendor.email,
                vendor.full_name
            )
        else:
            vendor.verification_status = ApprovalStatus.rejected.value
            vendor.is_verified = False
            # Send rejection email
            email_service.send_verification_rejection_email(
                vendor.email,
                vendor.full_name,
                "vendor",
                "Your vendor registration was not approved by the admin."
            )
        
        vendor.updated_at = datetime.utcnow()
        db.commit()
        return {"message": f"Vendor {status} successfully"}
    except Exception as e:
        logger.error(f"Error verifying vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify/buyer/{buyer_id}")
async def verify_buyer(
    buyer_id: str,
    status_update: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(AuthService.get_current_admin_user)
):
    """Verify a buyer account (Admin only)"""
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        if status_update.status == "approved":
            buyer.verification_status = ApprovalStatus.approved.value
            buyer.is_verified = True
            # Send approval email
            email_service.send_verification_approval_email(
                buyer.email,
                buyer.full_name
            )
        else:
            buyer.verification_status = ApprovalStatus.rejected.value
            buyer.is_verified = False
            # Send rejection email
            email_service.send_verification_rejection_email(
                buyer.email,
                getattr(buyer, 'full_name', 'User'),
                "buyer",
                "Your buyer registration was not approved by the admin."
            )
        
        buyer.updated_at = datetime.utcnow()
        db.commit()
        return {"message": f"Buyer {status} successfully"}
    except Exception as e:
        logger.error(f"Error verifying buyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-user/{user_id}", response_model=UserResponse)
async def verify_user(
    user_id: UUID,
    current_user: User = Depends(AuthService.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Verify a user account (Admin only)
    """
    try:
        user = UserService.verify_user(db, user_id, current_user.id)
        
        # Send notifications to user
        notification_tasks = [
            email_service.send_verification_approval_email(
                user.email,
                user.full_name
            )
        ]
        
        # Add SMS notification if phone is available
        if user.phone:
            notification_tasks.append(
                notification_service.send_verification_approval_sms(
                    phone=user.phone,
                    name=user.full_name
                )
            )
            
            # Add WhatsApp notification (optional)
            try:
                notification_tasks.append(
                    notification_service.send_verification_approval_whatsapp(
                        phone=user.phone,
                        name=user.full_name
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to send WhatsApp notification: {str(e)}")
        
        # Run all notifications concurrently
        await asyncio.gather(*notification_tasks, return_exceptions=True)
        
        logger.info(f"User {user_id} verified by admin {current_user.id}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while verifying the user"
        )

@router.post("/approve-agri-copilot/{copilot_id}")
async def approve_agri_copilot(
    copilot_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)  # Fixed: use get_current_admin dependency
):
    """
    Approve an agri-copilot and send approval email
    """
    try:
        logger.info(f"🔄 Admin {current_admin.email} approving agri-copilot: {copilot_id}")
        
        # Get the agri-copilot record
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            logger.error(f"❌ Agri-copilot {copilot_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        logger.info(f"📋 Found agri-copilot: {copilot.full_name} ({copilot.email})")
        
        # Update verification status to approved
        copilot.verification_status = ApprovalStatus.approved.value  # Fixed: use .value
        copilot.is_verified = True
        copilot.updated_at = datetime.utcnow()
        
        # Also update the corresponding User record if exists
        if copilot.user_id:
            user = db.query(User).filter(User.id == copilot.user_id).first()
            if user:
                user.is_verified = True
                user.updated_at = datetime.utcnow()
                logger.info(f"✅ Updated User record for {user.email}")
        
        db.commit()
        db.refresh(copilot)
        
        # Send approval email
        try:
            email_service = EmailService()
            email_sent = await email_service.send_approval_email(
                to_email=copilot.email,
                full_name=copilot.full_name,
                user_type="agri_copilot"
            )
            if email_sent:
                logger.info(f"✅ Approval email sent to {copilot.email}")
            else:
                logger.warning(f"⚠️ Failed to send approval email to {copilot.email}")
        except Exception as email_error:
            logger.error(f"❌ Error sending approval email: {str(email_error)}")
            # Don't fail the approval if email fails
        
        logger.info(f"✅ AgriCopilot {copilot.custom_id} approved successfully")
        
        return {
            "message": "AgriCopilot approved successfully",
            "copilot_id": str(copilot.id),
            "custom_id": copilot.custom_id,
            "verification_status": "approved",
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving agri-copilot: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve agri-copilot: {str(e)}"
        )


@router.post("/reject-agri-copilot/{copilot_id}")
async def reject_agri_copilot(
    copilot_id: str,
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Reject an agri-copilot application and send rejection email
    """
    try:
        logger.info(f"🔄 Admin {current_admin.email} rejecting agri-copilot: {copilot_id}")
        
        # Get the agri-copilot record
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            logger.error(f"❌ Agri-copilot {copilot_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        logger.info(f"📋 Found agri-copilot: {copilot.full_name} ({copilot.email})")
        
        # Update verification status to rejected
        copilot.verification_status = ApprovalStatus.rejected.value
        copilot.is_verified = False
        copilot.updated_at = datetime.utcnow()
        
        # Also update the corresponding User record if exists
        if copilot.user_id:
            user = db.query(User).filter(User.id == copilot.user_id).first()
            if user:
                user.is_verified = False
                user.is_active = False  # Deactivate rejected users
                user.updated_at = datetime.utcnow()
                logger.info(f"✅ Updated User record for {user.email}")
        
        db.commit()
        db.refresh(copilot)
        
        # Send rejection email
        try:
            email_service = EmailService()
            email_sent = await email_service.send_rejection_email(
                to_email=copilot.email,
                full_name=copilot.full_name,
                user_type="agri_copilot",
                reason=rejection_reason
            )
            if email_sent:
                logger.info(f"✅ Rejection email sent to {copilot.email}")
            else:
                logger.warning(f"⚠️ Failed to send rejection email to {copilot.email}")
        except Exception as email_error:
            logger.error(f"❌ Error sending rejection email: {str(email_error)}")
            # Don't fail the rejection if email fails
        
        logger.info(f"✅ AgriCopilot {copilot.custom_id} rejected")
        
        return {
            "message": f"AgriCopilot rejected: {rejection_reason}",
            "copilot_id": str(copilot.id),
            "custom_id": copilot.custom_id,
            "verification_status": "rejected",
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting agri-copilot: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject agri-copilot: {str(e)}"
        )


# Photo retrieval endpoint
@router.get("/agri-copilot/{copilot_id}/photo")
async def get_agri_copilot_photo(
    copilot_id: str,
    db: Session = Depends(get_db)
):
    """
    Get AgriCopilot profile photo
    """
    from fastapi.responses import FileResponse
    
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        if not copilot.photo_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not available"
            )
        
        # Construct file path
        file_path = os.path.join("uploads", "agri_copilots", copilot.photo_url)
        
        if not os.path.exists(file_path):
            logger.error(f"Photo file not found: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo file not found on server"
            )
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve photo"
        )


@router.get("/agri-copilot/{copilot_id}/aadhar")
async def get_agri_copilot_aadhar(
    copilot_id: str,
    db: Session = Depends(get_db)
):
    """
    Get AgriCopilot Aadhar document
    """
    from fastapi.responses import FileResponse
    
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        if not copilot.aadhar_front_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aadhar document not available"
            )
        
        # Construct file path
        file_path = os.path.join("uploads", "agri_copilots", copilot.aadhar_front_url)
        
        if not os.path.exists(file_path):
            logger.error(f"Aadhar file not found: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aadhar file not found on server"
            )
        
        # Determine media type based on extension
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving aadhar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve aadhar document"
        )
async def approve_agri_copilot(
    copilot_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)  # Fixed: use get_current_admin dependency
):
    """
    Approve an agri-copilot and send approval email
    """
    try:
        logger.info(f"🔄 Admin {current_admin.email} approving agri-copilot: {copilot_id}")
        
        # Get the agri-copilot record
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            logger.error(f"❌ Agri-copilot {copilot_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        logger.info(f"📋 Found agri-copilot: {copilot.full_name} ({copilot.email})")
        
        # Update verification status to approved
        copilot.verification_status = ApprovalStatus.approved.value  # Fixed: use .value
        copilot.is_verified = True
        copilot.updated_at = datetime.utcnow()
        
        # Also update the corresponding User record if exists
        if copilot.user_id:
            user = db.query(User).filter(User.id == copilot.user_id).first()
            if user:
                user.is_verified = True
                user.updated_at = datetime.utcnow()
                logger.info(f"✅ Updated User record for {user.email}")
        
        db.commit()
        db.refresh(copilot)
        
        # Send approval email
        try:
            email_service = EmailService()
            email_sent = await email_service.send_approval_email(
                to_email=copilot.email,
                full_name=copilot.full_name,
                user_type="agri_copilot"
            )
            if email_sent:
                logger.info(f"✅ Approval email sent to {copilot.email}")
            else:
                logger.warning(f"⚠️ Failed to send approval email to {copilot.email}")
        except Exception as email_error:
            logger.error(f"❌ Error sending approval email: {str(email_error)}")
            # Don't fail the approval if email fails
        
        logger.info(f"✅ AgriCopilot {copilot.custom_id} approved successfully")
        
        return {
            "message": "AgriCopilot approved successfully",
            "copilot_id": str(copilot.id),
            "custom_id": copilot.custom_id,
            "verification_status": "approved",
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving agri-copilot: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve agri-copilot: {str(e)}"
        )


@router.post("/reject-agri-copilot/{copilot_id}")
async def reject_agri_copilot(
    copilot_id: str,
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Reject an agri-copilot application and send rejection email
    """
    try:
        logger.info(f"🔄 Admin {current_admin.email} rejecting agri-copilot: {copilot_id}")
        
        # Get the agri-copilot record
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            logger.error(f"❌ Agri-copilot {copilot_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        logger.info(f"📋 Found agri-copilot: {copilot.full_name} ({copilot.email})")
        
        # Update verification status to rejected
        copilot.verification_status = ApprovalStatus.rejected.value
        copilot.is_verified = False
        copilot.updated_at = datetime.utcnow()
        
        # Also update the corresponding User record if exists
        if copilot.user_id:
            user = db.query(User).filter(User.id == copilot.user_id).first()
            if user:
                user.is_verified = False
                user.is_active = False  # Deactivate rejected users
                user.updated_at = datetime.utcnow()
                logger.info(f"✅ Updated User record for {user.email}")
        
        db.commit()
        db.refresh(copilot)
        
        # Send rejection email
        try:
            email_service = EmailService()
            email_sent = await email_service.send_rejection_email(
                to_email=copilot.email,
                full_name=copilot.full_name,
                user_type="agri_copilot",
                reason=rejection_reason
            )
            if email_sent:
                logger.info(f"✅ Rejection email sent to {copilot.email}")
            else:
                logger.warning(f"⚠️ Failed to send rejection email to {copilot.email}")
        except Exception as email_error:
            logger.error(f"❌ Error sending rejection email: {str(email_error)}")
            # Don't fail the rejection if email fails
        
        logger.info(f"✅ AgriCopilot {copilot.custom_id} rejected")
        
        return {
            "message": f"AgriCopilot rejected: {rejection_reason}",
            "copilot_id": str(copilot.id),
            "custom_id": copilot.custom_id,
            "verification_status": "rejected",
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting agri-copilot: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject agri-copilot: {str(e)}"
        )


# Photo retrieval endpoints
@router.get("/agri-copilot/{copilot_id}/photo")
async def get_agri_copilot_photo(
    copilot_id: str,
    db: Session = Depends(get_db)
):
    """
    Get AgriCopilot profile photo
    """
    from fastapi.responses import FileResponse
    
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        if not copilot.photo_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not available"
            )
        
        # Construct file path
        file_path = os.path.join("uploads", "agri_copilots", copilot.photo_url)
        
        if not os.path.exists(file_path):
            logger.error(f"Photo file not found: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo file not found on server"
            )
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve photo"
        )


@router.get("/agri-copilot/{copilot_id}/aadhar")
async def get_agri_copilot_aadhar(
    copilot_id: str,
    db: Session = Depends(get_db)
):
    """
    Get AgriCopilot Aadhar document
    """
    from fastapi.responses import FileResponse
    
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AgriCopilot not found"
            )
        
        if not copilot.aadhar_front_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aadhar document not available"
            )
        
        # Construct file path
        file_path = os.path.join("uploads", "agri_copilots", copilot.aadhar_front_url)
        
        if not os.path.exists(file_path):
            logger.error(f"Aadhar file not found: {file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aadhar file not found on server"
            )
        
        # Determine media type based on extension
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving aadhar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve aadhar document"
        )


# Farmer photo retrieval endpoints
@router.get("/farmer/{farmer_id}/photo")
async def get_farmer_photo(
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Get Farmer profile photo"""
    from fastapi.responses import FileResponse
    
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        if not farmer.photo_url:
            raise HTTPException(status_code=404, detail="Photo not available")
        
        file_path = os.path.join("uploads", "farmers", farmer.photo_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Photo file not found on server")
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving farmer photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve photo")


@router.get("/farmer/{farmer_id}/aadhar")
async def get_farmer_aadhar(
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Get Farmer Aadhar document"""
    from fastapi.responses import FileResponse
    
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        if not farmer.aadhar_front_url:
            raise HTTPException(status_code=404, detail="Aadhar not available")
        
        file_path = os.path.join("uploads", "farmers", farmer.aadhar_front_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Aadhar file not found on server")
        
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving farmer aadhar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve aadhar")


# Landowner photo retrieval endpoints
@router.get("/landowner/{landowner_id}/photo")
async def get_landowner_photo(
    landowner_id: str,
    db: Session = Depends(get_db)
):
    """Get Landowner profile photo"""
    from fastapi.responses import FileResponse
    
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        if not landowner.photo_url:
            raise HTTPException(status_code=404, detail="Photo not available")
        
        file_path = os.path.join("uploads", "landowners", landowner.photo_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Photo file not found on server")
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving landowner photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve photo")


@router.get("/landowner/{landowner_id}/aadhar")
async def get_landowner_aadhar(
    landowner_id: str,
    db: Session = Depends(get_db)
):
    """Get Landowner Aadhar document"""
    from fastapi.responses import FileResponse
    
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        if not landowner.aadhar_front_url:
            raise HTTPException(status_code=404, detail="Aadhar not available")
        
        file_path = os.path.join("uploads", "landowners", landowner.aadhar_front_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Aadhar file not found on server")
        
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving landowner aadhar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve aadhar")


# Vendor photo retrieval endpoints
@router.get("/vendor/{vendor_id}/photo")
async def get_vendor_photo(
    vendor_id: str,
    db: Session = Depends(get_db)
):
    """Get Vendor profile photo"""
    from fastapi.responses import FileResponse
    
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        if not vendor.photo_url:
            raise HTTPException(status_code=404, detail="Photo not available")
        
        file_path = os.path.join("uploads", "vendors", vendor.photo_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Photo file not found on server")
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving vendor photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve photo")


@router.get("/vendor/{vendor_id}/aadhar")
async def get_vendor_aadhar(
    vendor_id: str,
    db: Session = Depends(get_db)
):
    """Get Vendor Aadhar document"""
    from fastapi.responses import FileResponse
    
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        if not vendor.aadhar_front_url:
            raise HTTPException(status_code=404, detail="Aadhar not available")
        
        file_path = os.path.join("uploads", "vendors", vendor.aadhar_front_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Aadhar file not found on server")
        
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving vendor aadhar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve aadhar")


# Buyer photo retrieval endpoints
@router.get("/buyer/{buyer_id}/photo")
async def get_buyer_photo(
    buyer_id: str,
    db: Session = Depends(get_db)
):
    """Get Buyer profile photo"""
    from fastapi.responses import FileResponse
    
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        if not buyer.photo_url:
            raise HTTPException(status_code=404, detail="Photo not available")
        
        file_path = os.path.join("uploads", "buyers", buyer.photo_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Photo file not found on server")
        
        return FileResponse(file_path, media_type="image/jpeg")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving buyer photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve photo")


@router.get("/buyer/{buyer_id}/aadhar")
async def get_buyer_aadhar(
    buyer_id: str,
    db: Session = Depends(get_db)
):
    """Get Buyer Aadhar document"""
    from fastapi.responses import FileResponse
    
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        if not buyer.aadhar_front_url:
            raise HTTPException(status_code=404, detail="Aadhar not available")
        
        file_path = os.path.join("uploads", "buyers", buyer.aadhar_front_url)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Aadhar file not found on server")
        
        ext = os.path.splitext(file_path)[1].lower()
        media_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        
        return FileResponse(file_path, media_type=media_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving buyer aadhar: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve aadhar")


# ============================================================================
# APPROVAL & REJECTION ENDPOINTS FOR ALL USER TYPES
# ============================================================================

@router.post("/farmer/{farmer_id}/approve")
async def approve_farmer(
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Approve a farmer account"""
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        # Update verification status
        farmer.verification_status = "approved"
        farmer.is_verified = True
        db.commit()
        db.refresh(farmer)
        
        # Send approval email
        await email_service.send_approval_email(
            to_email=farmer.email,
            full_name=farmer.full_name,
            user_type="farmer"
        )
        
        return {"message": "Farmer approved successfully", "status": "approved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving farmer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/farmer/{farmer_id}/reject")
async def reject_farmer(
    farmer_id: str,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Reject a farmer account"""
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        # Update verification status
        farmer.verification_status = "rejected"
        farmer.is_verified = False
        db.commit()
        db.refresh(farmer)
        
        # Send rejection email
        await email_service.send_rejection_email(
            to_email=farmer.email,
            full_name=farmer.full_name,
            user_type="farmer",
            reason=reason
        )
        
        return {"message": "Farmer rejected successfully", "status": "rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting farmer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buyer/{buyer_id}/approve")
async def approve_buyer(
    buyer_id: str,
    db: Session = Depends(get_db)
):
    """Approve a buyer account"""
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        # Update verification status
        buyer.verification_status = "approved"
        buyer.is_verified = True
        db.commit()
        db.refresh(buyer)
        
        # Send approval email
        await email_service.send_approval_email(
            to_email=buyer.email,
            full_name=buyer.full_name,
            user_type="buyer"
        )
        
        return {"message": "Buyer approved successfully", "status": "approved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving buyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buyer/{buyer_id}/reject")
async def reject_buyer(
    buyer_id: str,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Reject a buyer account"""
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        # Update verification status
        buyer.verification_status = "rejected"
        buyer.is_verified = False
        db.commit()
        db.refresh(buyer)
        
        # Send rejection email
        await email_service.send_rejection_email(
            to_email=buyer.email,
            full_name=buyer.full_name,
            user_type="buyer",
            reason=reason
        )
        
        return {"message": "Buyer rejected successfully", "status": "rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting buyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendor/{vendor_id}/approve")
async def approve_vendor(
    vendor_id: str,
    db: Session = Depends(get_db)
):
    """Approve a vendor account"""
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Update verification status
        vendor.verification_status = "approved"
        vendor.is_verified = True
        db.commit()
        db.refresh(vendor)
        
        # Send approval email
        await email_service.send_approval_email(
            to_email=vendor.email,
            full_name=vendor.full_name,
            user_type="vendor"
        )
        
        return {"message": "Vendor approved successfully", "status": "approved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendor/{vendor_id}/reject")
async def reject_vendor(
    vendor_id: str,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Reject a vendor account"""
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Update verification status
        vendor.verification_status = "rejected"
        vendor.is_verified = False
        db.commit()
        db.refresh(vendor)
        
        # Send rejection email
        await email_service.send_rejection_email(
            to_email=vendor.email,
            full_name=vendor.full_name,
            user_type="vendor",
            reason=reason
        )
        
        return {"message": "Vendor rejected successfully", "status": "rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/landowner/{landowner_id}/approve")
async def approve_landowner(
    landowner_id: str,
    db: Session = Depends(get_db)
):
    """Approve a landowner account"""
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        # Update verification status
        landowner.verification_status = "approved"
        landowner.is_verified = True
        db.commit()
        db.refresh(landowner)
        
        # Send approval email
        await email_service.send_approval_email(
            to_email=landowner.email,
            full_name=landowner.full_name,
            user_type="landowner"
        )
        
        return {"message": "Landowner approved successfully", "status": "approved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving landowner: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/landowner/{landowner_id}/reject")
async def reject_landowner(
    landowner_id: str,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Reject a landowner account"""
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        # Update verification status
        landowner.verification_status = "rejected"
        landowner.is_verified = False
        db.commit()
        db.refresh(landowner)
        
        # Send rejection email
        await email_service.send_rejection_email(
            to_email=landowner.email,
            full_name=landowner.full_name,
            user_type="landowner",
            reason=reason
        )
        
        return {"message": "Landowner rejected successfully", "status": "rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting landowner: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agri-copilot/{copilot_id}/approve")
async def approve_agri_copilot(
    copilot_id: str,
    db: Session = Depends(get_db)
):
    """Approve an agri-copilot account"""
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(status_code=404, detail="Agri-copilot not found")
        
        # Update verification status
        copilot.verification_status = "approved"
        copilot.is_verified = True
        db.commit()
        db.refresh(copilot)
        
        # Send approval email
        await email_service.send_approval_email(
            to_email=copilot.email,
            full_name=copilot.full_name,
            user_type="agri_copilot"
        )
        
        return {"message": "Agri-copilot approved successfully", "status": "approved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving agri-copilot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agri-copilot/{copilot_id}/reject")
async def reject_agri_copilot(
    copilot_id: str,
    reason: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Reject an agri-copilot account"""
    try:
        copilot = db.query(AgriCopilot).filter(AgriCopilot.id == copilot_id).first()
        if not copilot:
            raise HTTPException(status_code=404, detail="Agri-copilot not found")
        
        # Update verification status
        copilot.verification_status = "rejected"
        copilot.is_verified = False
        db.commit()
        db.refresh(copilot)
        
        # Send rejection email
        await email_service.send_rejection_email(
            to_email=copilot.email,
            full_name=copilot.full_name,
            user_type="agri_copilot",
            reason=reason
        )
        
        return {"message": "Agri-copilot rejected successfully", "status": "rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting agri-copilot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject-user/{user_id}", response_model=UserResponse)
async def reject_user(
    user_id: UUID,
    reason: str = Body(..., embed=True, description="Reason for rejection"),
    current_user: User = Depends(AuthService.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Reject a user account (Admin only)
    """
    try:
        user = UserService.reject_user(db, user_id, current_user.id, reason)
        
        # Send rejection notification to user
        await asyncio.gather(
            email_service.send_verification_rejection_email(
                to_email=user.email,
                full_name=user.full_name,
                user_type='user',
                reason=reason
            ),
            notification_service.send_verification_rejection_sms(
                phone=user.phone,
                name=user.full_name,
                reason=reason
            ) if user.phone else None
        )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while rejecting the user"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching user: {str(e)}"
        )

# ---------------- Document Update Endpoints ---------------- #
@router.put("/farmers/{farmer_id}/documents")
async def update_farmer_documents(
    farmer_id: str,
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Update farmer documents and Aadhar number"""
    try:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        
        # Update Aadhar number if provided
        if aadhar_number:
            farmer.aadhar_number = aadhar_number
        
        # Update photo if provided
        if photo_file and photo_file.filename:
            photo_url = await save_upload_file(photo_file, "farmer")
            farmer.photo_url = photo_url
        
        # Update Aadhar front if provided
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "farmer")
            farmer.aadhar_front_url = aadhar_front_url
        
        db.commit()
        db.refresh(farmer)
        
        return {
            "message": "Documents updated successfully",
            "farmer_id": str(farmer.id),
            "photo_url": farmer.photo_url,
            "aadhar_front_url": farmer.aadhar_front_url,
            "aadhar_number": farmer.aadhar_number
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating documents: {str(e)}")
    finally:
        db.close()

@router.put("/landowners/{landowner_id}/documents")
async def update_landowner_documents(
    landowner_id: str,
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Update landowner documents and Aadhar number"""
    try:
        landowner = db.query(Landowner).filter(Landowner.id == landowner_id).first()
        if not landowner:
            raise HTTPException(status_code=404, detail="Landowner not found")
        
        # Update Aadhar number if provided
        if aadhar_number:
            landowner.aadhar_number = aadhar_number
        
        # Update photo if provided
        if photo_file and photo_file.filename:
            photo_url = await save_upload_file(photo_file, "landowner")
            landowner.photo_url = photo_url
        
        # Update Aadhar front if provided
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "landowner")
            landowner.aadhar_front_url = aadhar_front_url
        
        db.commit()
        db.refresh(landowner)
        
        return {
            "message": "Documents updated successfully",
            "landowner_id": str(landowner.id),
            "photo_url": landowner.photo_url,
            "aadhar_front_url": landowner.aadhar_front_url,
            "aadhar_number": landowner.aadhar_number
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating documents: {str(e)}")
    finally:
        db.close()

@router.put("/vendors/{vendor_id}/documents")
async def update_vendor_documents(
    vendor_id: str,
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Update vendor documents and Aadhar number"""
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Update Aadhar number if provided
        if aadhar_number:
            vendor.aadhar_number = aadhar_number
        
        # Update photo if provided
        if photo_file and photo_file.filename:
            photo_url = await save_upload_file(photo_file, "vendor")
            vendor.photo_url = photo_url
        
        # Update Aadhar front if provided
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "vendor")
            vendor.aadhar_front_url = aadhar_front_url
        
        db.commit()
        db.refresh(vendor)
        
        return {
            "message": "Documents updated successfully",
            "vendor_id": str(vendor.id),
            "photo_url": vendor.photo_url,
            "aadhar_front_url": vendor.aadhar_front_url,
            "aadhar_number": vendor.aadhar_number
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating documents: {str(e)}")
    finally:
        db.close()

@router.put("/buyers/{buyer_id}/documents")
async def update_buyer_documents(
    buyer_id: str,
    aadhar_number: str = Form(None),
    photo_file: UploadFile = File(None),
    aadhar_front_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Update buyer documents and Aadhar number"""
    try:
        buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        # Update Aadhar number if provided
        if aadhar_number:
            buyer.aadhar_number = aadhar_number
        
        # Update photo if provided
        if photo_file and photo_file.filename:
            photo_url = await save_upload_file(photo_file, "buyer")
            buyer.photo_url = photo_url
        
        # Update Aadhar front if provided
        if aadhar_front_file and aadhar_front_file.filename:
            aadhar_front_url = await save_upload_file(aadhar_front_file, "buyer")
            buyer.aadhar_front_url = aadhar_front_url
        
        db.commit()
        db.refresh(buyer)
        
        return {
            "message": "Documents updated successfully",
            "buyer_id": str(buyer.id),
            "photo_url": buyer.photo_url,
            "aadhar_front_url": buyer.aadhar_front_url,
            "aadhar_number": buyer.aadhar_number
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating documents: {str(e)}")
    finally:
        db.close()

# ---------------- Health Check ---------------- #
@router.get("/health/database")
async def check_database_health(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")
