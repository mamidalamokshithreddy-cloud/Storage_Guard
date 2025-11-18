from datetime import datetime, timedelta
from typing import List  # Added List import
from app.core.config import FRONTEND_URL, settings
import logging
try:
    import jwt  # PyJWT for decode
    _JWT_INVALID = jwt.InvalidTokenError
except Exception:
    jwt = None
    _JWT_INVALID = Exception

logger = logging.getLogger(__name__)
# JWT encode helper: prefer PyJWT, fallback to python-jose
def _jwt_encode(payload, key, algorithm):
    try:
            import jwt as _pyjwt  # type: ignore
            return _pyjwt.encode(payload, key, algorithm=algorithm)
    except Exception:
        from jose import jwt as jose_jwt  # type: ignore
        return jose_jwt.encode(payload, key, algorithm=algorithm)

def _jwt_decode(token, key, algorithms):
    try:
        import jwt as _pyjwt  # type: ignore
        return _pyjwt.decode(token, key, algorithms=algorithms)
    except Exception:
        from jose import jwt as jose_jwt  # type: ignore
        return jose_jwt.decode(token, key, algorithms=algorithms)
from app.schemas.postgres_base import UserRole, ServiceType, Vendor, Buyer, User, ApprovalStatus
from app.services.auth_service import jwt_encode  # reuse common helper
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends, Header
from passlib.context import CryptContext
from app.core.security import (
    verify_password as core_verify_password,
    get_password_hash as core_get_password_hash,
)
import os
from dotenv import load_dotenv
import secrets
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from app.schemas.postgres_base_models import VendorCreate, BuyerCreate
from app.schemas import postgres_base as models
from app.schemas.postgres_base import (
    User, Farmer, Landowner, AgriCopilot, Vendor
)
from app.schemas.postgres_base_models import (
    UserCreate, UserResponse, 
    FarmerCreate, FarmerResponse,
    LandownerCreate, LandownerResponse,
    AgriCopilotCreate, AgriCopilotResponse,
    VendorCreate, VendorResponse,
    BuyerCreate, BuyerResponse
)
from app.connections.postgres_connection import get_db
from datetime import datetime, timedelta
from typing import List
from app.schemas.postgres_base import UserRole, ServiceType, Vendor, Buyer, User, ApprovalStatus
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends, Header
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import secrets
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from app.schemas.postgres_base_models import AgriCopilotRegister, VendorCreate, BuyerCreate
from app.schemas.postgres_base import User, Farmer, Landowner, AgriCopilot, Vendor
from app.schemas.postgres_base_models import (
    UserCreate, UserResponse, 
    FarmerCreate, FarmerResponse,
    LandownerCreate, LandownerResponse,
    VendorCreate, VendorResponse,
    BuyerCreate, BuyerResponse
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    # Token expiration time in minutes
    ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours (changed from 30 minutes)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str):
        # Delegate to central security which handles bcrypt 72-byte limit
        return core_verify_password(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str):
        # Delegate to central security which handles bcrypt 72-byte limit
        return core_get_password_hash(password)
        
    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None):
        logger.info(f"🔑 copilot_services [FIRST]: Creating token with SECRET_KEY: {AuthService.SECRET_KEY[:10]}...{AuthService.SECRET_KEY[-10:]}")
        
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt_encode(to_encode, AuthService.SECRET_KEY, AuthService.ALGORITHM)
        
        logger.info(f"✅ copilot_services [FIRST]: Token created: {encoded_jwt[:50]}...")
        
        return encoded_jwt
        
    @staticmethod
    async def get_current_admin_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
    ):
        """
        Dependency to get the current admin user from the token.
        Raises HTTPException if user is not an admin.
        """
        # Extract token from Authorization header
        if not authorization.startswith("Bearer "):
            logger.error("❌ [FIRST] Invalid authorization header format")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        token = authorization.split(" ")[1]
        
        logger.info(f"🔍 copilot_services [FIRST]: Decoding token: {token[:50]}...")
        logger.info(f"🔑 copilot_services [FIRST]: Using SECRET_KEY: {AuthService.SECRET_KEY[:10]}...{AuthService.SECRET_KEY[-10:]}")
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = _jwt_decode(
                token,
                key=AuthService.SECRET_KEY,
                algorithms=[AuthService.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            logger.info(f"✅ copilot_services [FIRST]: Token decoded. User ID: {user_id}")
            
            if user_id is None:
                logger.error("❌ [FIRST] No 'sub' found in token payload")
                raise credentials_exception
        except _JWT_INVALID as e:
            logger.error(f"❌ JWT decode error in copilot_services [FIRST]: {str(e)}")
            raise credentials_exception
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            logger.error(f"❌ [FIRST] User not found in database: {user_id}")
            raise credentials_exception
            
        # Check if user is admin - handle both Enum and string role values
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if user_role != UserRole.admin.value and user_role != 'admin':
            logger.error(f"❌ [FIRST] User {user.email} has role {user_role}, not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        logger.info(f"✅ [FIRST] Admin user authenticated: {user.email}")
        return user

class UserService:
    @staticmethod
    def to_response(user: User) -> dict:
        """Convert User model to response dictionary"""
        return {
            "id": user.id,
            "custom_id": user.custom_id or "",
            "email": user.email or "",
            "full_name": user.full_name or "",
            "phone": user.phone or "",
            "address_line1": user.address_line1 or "",
            "address_line2": user.address_line2 or "",
            "city": user.city or "",
            "state": getattr(user, 'state', ''),
            "mandal": getattr(user, 'mandal', ''),
            "country": getattr(user, 'country', ''),
            "postal_code": getattr(user, 'postal_code', ''),
            "role": (user.role.value if hasattr(user, 'role') and user.role and hasattr(user.role, 'value') else (user.role if hasattr(user, 'role') else '')),
            "user_type": (user.role.value if hasattr(user, 'role') and user.role and hasattr(user.role, 'value') else (user.role if hasattr(user, 'role') else '')),  # Get user_type or fall back to role
            "is_active": getattr(user, 'is_active', True),
            "is_verified": getattr(user, 'is_verified', False),
            "created_at": getattr(user, 'created_at', None)
        }
    
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID):
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_phone(db: Session, phone: str):
        return db.query(User).filter(User.phone == phone).first()
        
    @staticmethod
    def get_user_by_user_id(db: Session, user_id: str):
        return db.query(User).filter(User.user_id == user_id).first()
        
    @staticmethod
    def get_users_by_role(
        db: Session, 
        role: UserRole, 
        skip: int = 0, 
        limit: int = 100
    ):
        """
        Get users by role with pagination
        
        Args:
            db: Database session
            role: UserRole enum value (farmer, landowner, vendor, buyer, officer)
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return (for pagination)
            
        Returns:
            List of user objects matching the role
        """
        # Convert role to string if it's an enum
        role_value = role.value if hasattr(role, 'value') else role
        
        return (
            db.query(User)
            .filter(User.role == role_value)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    @staticmethod
    def get_users_count_by_role(db: Session) -> dict:
        """
        Get count of users grouped by role
        
        Returns:
            Dictionary with role as key and count as value
        """
        from sqlalchemy import func
        
        result = (
            db.query(User.role, func.count(User.id))
            .all()
        )
        return {str(role): count for role, count in result}
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, created_by_admin: bool = False):
        # Check if user with email already exists
        if UserService.get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Check if user with phone already exists
        if UserService.get_user_by_phone(db, user_data.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
            
        # Create user
        hashed_password = AuthService.get_password_hash(user_data.password)
        # Convert role enum to string value for database storage
        role_value = user_data.role.value if hasattr(user_data.role, 'value') else str(user_data.role)
        db_user = User(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            role=role_value,  # Use string value instead of enum object
            address_line1=user_data.address_line1,
            address_line2=user_data.address_line2,
            city=user_data.city,
            state=user_data.state,
            mandal=user_data.mandal,
            postal_code=user_data.postal_code,
            country=user_data.country,
            is_active=True,
            # If created by admin, mark as verified automatically
            is_verified=created_by_admin 
        )
        
        db.add(db_user) 
        db.commit()
        db.refresh(db_user)
        
        # Generate and set custom ID after commit to ensure we have the user ID
        try:
            from app.schemas.postgres_base import generate_user_id
            role_enum = user_data.role if hasattr(user_data.role, 'value') else user_data.role
            custom_id = generate_user_id(role_enum, db_user.id, db)
            db_user.custom_id = custom_id
        except Exception as e:
            # Fallback: Use a simple UUID-based custom ID if the sequential method fails
            print(f"Warning: Custom ID generation failed ({e}), using fallback method")
            role_str = user_data.role.value if hasattr(user_data.role, 'value') else str(user_data.role)
            uuid_short = str(db_user.id).replace('-', '')[:8].upper()
            db_user.custom_id = f"{role_str[:3].upper()}-{uuid_short}"
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    # Verification methods removed as all users are automatically verified    @staticmethod
    def get_pending_verifications(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get list of users pending verification
        """
        return db.query(User).filter(
            User.verification_status == ApprovalStatus.pending
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def authenticate_user(db: Session, identifier: str, password: str):
        # Check if identifier is email or phone
        if '@' in identifier:
            user = UserService.get_user_by_email(db, identifier)
        else:
            # Remove any non-digit characters from phone number
            phone = ''.join(filter(str.isdigit, identifier))
            if phone.startswith('0') and len(phone) > 10:
                phone = phone[1:]  # Remove leading 0 if present
            user = UserService.get_user_by_phone(db, phone)
            
        if not user or not AuthService.verify_password(password, user.password_hash):
            return False
        return user
        
    @staticmethod
    def update_password(user: User, new_password: str, db: Session):
        # Hash the new password
        hashed_password = AuthService.get_password_hash(new_password)
        # Update the user's password hash
        user.password_hash = hashed_password
        db.commit()
        db.refresh(user)
        return user

class FarmerService:
    @staticmethod
    def create_farmer(db: Session, farmer_data: FarmerCreate):
        # Check for existing farmer with same email or phone
        existing_farmer = db.query(Farmer).filter(
            (Farmer.email == farmer_data.email) |
            (Farmer.phone == farmer_data.phone)
        ).first()
        
        if existing_farmer:
            raise HTTPException(
                status_code=400,
                detail="A farmer with this email or phone number already exists"
            )
            
        # Create user first
        user = UserService.create_user(db, farmer_data)
        
        # Create farmer profile with common fields
        db_farmer = Farmer(
            user_id=user.id,
            full_name=farmer_data.full_name,
            email=farmer_data.email,
            phone=farmer_data.phone,
            address_line1=farmer_data.address_line1,
            address_line2=farmer_data.address_line2,
            city=farmer_data.city,
            state=farmer_data.state,
            mandal=farmer_data.mandal,
            country=farmer_data.country,
            postal_code=farmer_data.postal_code,
            # Farmer specific fields
            farm_size=farmer_data.farm_size,
            primary_crop_types=farmer_data.primary_crop_types,
            years_of_experience=farmer_data.years_of_experience,
            farmer_location=farmer_data.farmer_location,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(farmer_data, 'photo_url', None),
            aadhar_front_url=getattr(farmer_data, 'aadhar_front_url', None),
            aadhar_number=getattr(farmer_data, 'aadhar_number', None)
        )
        
        db.add(db_farmer)
        db.commit()
        db.refresh(db_farmer)
        
        # Set the user relationship
        db_farmer.user = user
        return db_farmer
    
    @staticmethod
    def get_farmer_by_user_id(db: Session, user_id: UUID):
        return db.query(Farmer).filter(Farmer.user_id == user_id).first()

class LandownerService:
    @staticmethod
    def create_landowner(db: Session, landowner_data: LandownerCreate) -> User:
        # Create user first
        user = UserService.create_user(db, landowner_data)
        
        # Create landowner profile with common fields
        db_landowner = Landowner(
            user_id=user.id,
            full_name=landowner_data.full_name,
            email=landowner_data.email,
            phone=landowner_data.phone,
            address_line1=landowner_data.address_line1,
            address_line2=landowner_data.address_line2,
            city=landowner_data.city,
            state=landowner_data.state,
            mandal=landowner_data.mandal,
            country=landowner_data.country,
            postal_code=landowner_data.postal_code,
            # Landowner specific fields
            total_land_area=landowner_data.total_land_area,
            current_land_use=landowner_data.current_land_use.value if hasattr(landowner_data.current_land_use, 'value') else str(landowner_data.current_land_use),  # Enum to string
            managing_remotely=landowner_data.managing_remotely,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(landowner_data, 'photo_url', None),
            aadhar_front_url=getattr(landowner_data, 'aadhar_front_url', None),
            aadhar_number=getattr(landowner_data, 'aadhar_number', None)
        )
        
        db.add(db_landowner)
        db.commit()
        db.refresh(db_landowner)
        db.refresh(user)
        
        return user

class AgriCopilotService:
    @staticmethod
    def create_agri_copilot(db: Session, agri_copilot_data: AgriCopilotCreate) -> dict:
        # Create user first
        user = UserService.create_user(db, agri_copilot_data)
        
        # Create agri copilot profile with common fields
        db_agri_copilot = AgriCopilot(
            user_id=user.id,
            full_name=agri_copilot_data.full_name,
            email=agri_copilot_data.email,
            phone=agri_copilot_data.phone,
            address_line1=agri_copilot_data.address_line1,
            address_line2=agri_copilot_data.address_line2,
            city=agri_copilot_data.city,
            state=agri_copilot_data.state,
            mandal=agri_copilot_data.mandal,
            country=agri_copilot_data.country,
            postal_code=agri_copilot_data.pincode,
            # Agri Copilot specific fields
            employee_id=agri_copilot_data.employee_id,
            department=agri_copilot_data.department,
            designation=agri_copilot_data.designation,
            jurisdiction_area=agri_copilot_data.jurisdiction_area,
            # Document uploads
            education_document_url=agri_copilot_data.education_document_url,
            id_proof_url=agri_copilot_data.id_proof_url,
            resume_url=agri_copilot_data.resume_url,
            profile_photo_url=agri_copilot_data.profile_photo_url
        )
        
        db.add(db_agri_copilot)
        db.commit()
        db.refresh(db_agri_copilot)
        
        # Return success message with request data
        response = agri_copilot_data.dict()
        response.update({
            "message": "Agri Copilot registration successful!",
            "success": True
        })
        return response

class VendorService:
    @staticmethod
    def create_vendor(db: Session, vendor_data: VendorCreate) -> User:
        # Create user first
        user = UserService.create_user(db, vendor_data)
        
        # Create vendor profile with common fields and default values
        db_vendor = Vendor(
            user_id=user.id,
            full_name=vendor_data.full_name,
            email=vendor_data.email,
            phone=vendor_data.phone,
            address_line1=vendor_data.address_line1,
            address_line2=vendor_data.address_line2,
            city=vendor_data.city,
            state=vendor_data.state,
            mandal=vendor_data.mandal,
            country=vendor_data.country,
            postal_code=vendor_data.postal_code,
            # Vendor specific fields
            legal_name=vendor_data.legal_name,
            business_name=vendor_data.business_name,
            gstin=vendor_data.gstin,
            pan=vendor_data.pan,
            business_type=vendor_data.business_type.value if hasattr(vendor_data.business_type, 'value') else str(vendor_data.business_type),  # Enum to string
            product_services=vendor_data.product_services,
            years_in_business=vendor_data.years_in_business,
            service_area=vendor_data.service_area,
            rating_avg=0.0,
            rating_count=0,
            verified=False,
            certification_status="PENDING",
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(vendor_data, 'photo_url', None),
            aadhar_front_url=getattr(vendor_data, 'aadhar_front_url', None),
            aadhar_number=getattr(vendor_data, 'aadhar_number', None)
        )
        
        db.add(db_vendor)
        db.commit()
        db.refresh(db_vendor)
        db.refresh(user)
        
        return user

class BuyerService:
    @staticmethod
    def create_buyer(db: Session, buyer_data: BuyerCreate) -> User:
        # Create user first
        user = UserService.create_user(db, buyer_data)
        
        # Create buyer profile with common fields and default values
        db_buyer = Buyer(
            user_id=user.id,
            full_name=buyer_data.full_name,
            email=buyer_data.email,
            phone=buyer_data.phone,
            address_line1=buyer_data.address_line1,
            address_line2=buyer_data.address_line2,
            city=buyer_data.city,
            state=buyer_data.state,
            mandal=buyer_data.mandal,
            country=buyer_data.country,
            postal_code=buyer_data.postal_code,
            # Buyer specific fields
            organization_name=buyer_data.organization_name,
            buyer_type=buyer_data.buyer_type,
            interested_crop_types=buyer_data.interested_crop_types,
            preferred_products=buyer_data.preferred_products,
            monthly_purchase_volume=buyer_data.monthly_purchase_volume,
            business_license_number=buyer_data.business_license_number,
            gst_number=buyer_data.gst_number,
            reliability_score=0.0,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(buyer_data, 'photo_url', None),
            aadhar_front_url=getattr(buyer_data, 'aadhar_front_url', None),
            aadhar_number=getattr(buyer_data, 'aadhar_number', None)
        )
        
        db.add(db_buyer)
        db.commit()
        db.refresh(db_buyer)
        db.refresh(user)
        
        return user
        response = buyer_data.dict()
        response.update({
            "message": "Buyer registration successful!",
            "success": True
        })
        return response

class PasswordResetService:
    @staticmethod
    def reset_password(db: Session, email: str, new_password: str):
        """
        Reset user's password after OTP verification.
        """
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        # Hash the new password
        hashed_password = AuthService.get_password_hash(new_password)
        user.password_hash = hashed_password
        
        try:
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password."
            )

# Email service implementation using SendGrid
class EmailService:
    @staticmethod
    def send_verification_email(email: str, name: str):
        """
        Send an email verification email to the user.
        
        Args:
            email: User's email address
            name: User's full name
        """
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        # Use FRONTEND_URL from config (configured in .env)
        
        # Create verification link (you might want to generate a token here)
        verification_link = f"{FRONTEND_URL}/verify-email"
        
        # Create the email content
        subject = 'Verify Your Email Address'
        
        # Plain text version
        text_content = f"""
        Hello {name},
        
        Thank you for registering with AgriHub AI! Please verify your email address by clicking the link below:
        
        {verification_link}
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        The AgriHub AI Team
        """
        
        # HTML version
        html_content = f"""
        <html>
        <body>
            <p>Hello {name},</p>
            <p>Thank you for registering with AgriHub AI! Please verify your email address by clicking the button below:</p>
            <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:<br>
            <code>{verification_link}</code></p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>The AgriHub AI Team</p>
        </body>
        </html>
        """
        
        # Create the message
        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriHub AI"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            # Send the email
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            print(f"Verification email sent to {email}. Status code: {response.status_code}")
            return True
        except Exception as e:
            print(f"Failed to send verification email to {email}. Error: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_email(email: str, token: str):
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv

        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        # Use FRONTEND_URL from config (configured in .env)
        
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        # Create the email content
        subject = 'Password Reset Request'
        
        # Plain text version
        text_content = f"""
        You have requested to reset your password.
        
        Please click on the following link to reset your password:
        {reset_link}
        
        If you didn't request this, please ignore this email or contact support.
        """
        
        # HTML version
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Please click on the following link to reset your password:</p>
            <p><a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:<br>{reset_link}</p>
            <p>If you didn't request this, please ignore this email or contact support.</p>
        </div>
        """

        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriConnect Support"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                print(f"Password reset email sent to {email} successfully.")
                return True
            else:
                print(f"Failed to send password reset email. Status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error sending email with SendGrid: {e}")
            return False
    
    @staticmethod
    def send_welcome_email(email: str, name: str, user_type: str):
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv

        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        
        # Create the email content
        subject = f'Welcome to AgriConnect, {name}!'
        
        # Plain text version
        text_content = f"""
        Welcome to AgriConnect, {name}!
        
        Thank you for registering as a {user_type}. We're excited to have you on board.
        
        You can now log in to your account and start using our services.
        
        If you have any questions, please don't hesitate to contact our support team.
        """
        
        # HTML version
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to AgriConnect, {name}!</h2>
            <p>Thank you for registering as a {user_type}. We're excited to have you on board.</p>
            <p>You can now log in to your account and start using our services.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        """.format(name=name, user_type=user_type)

        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriConnect Team"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                print(f"Welcome email sent to {email} successfully.")
                return True
            else:
                print(f"Failed to send welcome email. Status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error sending welcome email with SendGrid: {e}")
            return False

# SMS service (mock implementation)
class SMSService:
    @staticmethod
    def send_otp_sms(phone: str, otp: str):
        print(f"OTP SMS would be sent to {phone}")
        print(f"Your OTP is: {otp}")
        
        # Mock success
        return True
    
    @staticmethod
    def generate_otp() -> str:
        return secrets.token_hex(3)  # 6-digit hex OTP

# Validation service
class ValidationService:
    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        # Basic phone validation (can be enhanced)
        import re
        pattern = r'^[\+]?[1-9][\d]{0,15}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def validate_gst_number(gst: str) -> bool:
        # Basic GST validation
        import re
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        return re.match(pattern, gst) is not None
    
    @staticmethod
    def validate_strong_password(password: str) -> dict:
        """
        Validate password strength
        Returns dict with validation results
        """
        import re
        
        result = {
            'is_valid': True,
            'errors': []
        }
        
        if len(password) < 8:
            result['is_valid'] = False
            result['errors'].append('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            result['errors'].append('Password should contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            result['errors'].append('Password should contain at least one lowercase letter')
        
        if not re.search(r'[0-9]', password):
            result['errors'].append('Password should contain at least one number')
        
        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
            result['errors'].append('Password should contain at least one special character')
        
        return result

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    # Token expiration time in minutes - CRITICAL: Use settings from config
    ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours (changed from 30 minutes)
    SECRET_KEY = settings.SECRET_KEY
    ALGORITHM = settings.ALGORITHM
    
    # Log the SECRET_KEY being used
    logger.info(f"🔐 copilot_services.AuthService initialized with SECRET_KEY: {SECRET_KEY[:10]}...{SECRET_KEY[-10:]}")
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str):
        # Delegate to central security which handles bcrypt 72-byte limit
        return core_verify_password(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str):
        # Delegate to central security which handles bcrypt 72-byte limit
        return core_get_password_hash(password)
            
    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None):
        logger.info(f"🔑 copilot_services [SECOND]: Creating token with SECRET_KEY: {AuthService.SECRET_KEY[:10]}...{AuthService.SECRET_KEY[-10:]}")
        
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt_encode(to_encode, AuthService.SECRET_KEY, AuthService.ALGORITHM)
        
        logger.info(f"✅ copilot_services [SECOND]: Token created: {encoded_jwt[:50]}...")
        
        return encoded_jwt
        
    @staticmethod
    async def get_current_admin_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
    ):
        """
        Dependency to get the current admin user from the token.
        Raises HTTPException if user is not an admin.
        """
        # Extract token from Authorization header
        if not authorization.startswith("Bearer "):
            logger.error("❌ [SECOND] Invalid authorization header format")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        token = authorization.split(" ")[1]
        
        logger.info(f"🔍 copilot_services [SECOND]: Decoding token: {token[:50]}...")
        logger.info(f"🔑 copilot_services [SECOND]: Using SECRET_KEY: {AuthService.SECRET_KEY[:10]}...{AuthService.SECRET_KEY[-10:]}")
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = _jwt_decode(
                token,
                key=AuthService.SECRET_KEY,
                algorithms=[AuthService.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            logger.info(f"✅ copilot_services [SECOND]: Token decoded. User ID: {user_id}")
            
            if user_id is None:
                logger.error("❌ [SECOND] No 'sub' found in token payload")
                raise credentials_exception
        except _JWT_INVALID as e:
            logger.error(f"❌ JWT decode error in copilot_services [SECOND]: {str(e)}")
            raise credentials_exception
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            logger.error(f"❌ [SECOND] User not found in database: {user_id}")
            raise credentials_exception
            
        # Check if user is admin - handle both Enum and string role values
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if user_role != UserRole.admin.value and user_role != 'admin':
            logger.error(f"❌ [SECOND] User {user.email} has role {user_role}, not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
            
        return user

class UserService:
    @staticmethod
    def to_response(user: User) -> dict:
        """Convert User model to response dictionary"""
        return {
            "id": user.id,
            "custom_id": user.custom_id or "",
            "email": user.email or "",
            "full_name": user.full_name or "",
            "phone": user.phone or "",
            "address_line1": user.address_line1 or "",
            "address_line2": user.address_line2 or "",
            "city": user.city or "",
            "state": getattr(user, 'state', ''),
            "mandal": getattr(user, 'mandal', ''),
            "country": getattr(user, 'country', ''),
            "postal_code": getattr(user, 'postal_code', ''),
            "role": (user.role.value if hasattr(user, 'role') and user.role and hasattr(user.role, 'value') else (user.role if hasattr(user, 'role') else '')),
            "user_type": (user.role.value if hasattr(user, 'role') and user.role and hasattr(user.role, 'value') else (user.role if hasattr(user, 'role') else '')),  # Get user_type or fall back to role
            "is_active": getattr(user, 'is_active', True),
            "is_verified": getattr(user, 'is_verified', False),
            "created_at": getattr(user, 'created_at', None)
        }
    
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID):
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_phone(db: Session, phone: str):
        return db.query(User).filter(User.phone == phone).first()
        
    @staticmethod
    def get_user_by_user_id(db: Session, user_id: str):
        return db.query(User).filter(User.user_id == user_id).first()
        
    @staticmethod
    def get_users_by_role(
        db: Session, 
        role: UserRole, 
        skip: int = 0, 
        limit: int = 100
    ):
        """
        Get users by role with pagination
        
        Args:
            db: Database session
            role: UserRole enum value (farmer, landowner, vendor, buyer, officer)
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return (for pagination)
            
        Returns:
            List of user objects matching the role
        """
        # Convert role to string if it's an enum
        role_value = role.value if hasattr(role, 'value') else role
        
        return (
            db.query(User)
            .filter(User.role == role_value)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    @staticmethod
    def get_users_count_by_role(db: Session) -> dict:
        """
        Get count of users grouped by role
        
        Returns:
            Dictionary with role as key and count as value
        """
        from sqlalchemy import func
        
        result = (
            db.query(User.role, func.count(User.id))
            .all()
        )
        return {str(role): count for role, count in result}
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate, created_by_admin: bool = False):
        # Check if user with email already exists
        if UserService.get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Check if user with phone already exists
        if UserService.get_user_by_phone(db, user_data.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
            
        # Create user
        hashed_password = AuthService.get_password_hash(user_data.password)
        # Convert role enum to string value for database storage
        role_value = user_data.role.value if hasattr(user_data.role, 'value') else str(user_data.role)
        db_user = User(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=hashed_password,
            full_name=user_data.full_name,
            role=role_value,  # Use string value instead of enum object
            address_line1=user_data.address_line1,
            address_line2=user_data.address_line2,
            city=user_data.city,
            state=user_data.state,
            mandal=user_data.mandal,
            postal_code=user_data.postal_code,
            country=user_data.country,
            is_active=True,
            # If created by admin, mark as verified automatically
            is_verified=created_by_admin
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Set custom ID after commit to ensure we have the user ID
        db_user.set_custom_id(db)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    # Verification methods removed as all users are automatically verified    @staticmethod
    def get_pending_verifications(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get list of users pending verification
        """
        return db.query(User).filter(
            User.verification_status == ApprovalStatus.pending
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def authenticate_user(db: Session, identifier: str, password: str):
        # Check if identifier is email or phone
        if '@' in identifier:
            user = UserService.get_user_by_email(db, identifier)
        else:
            # Remove any non-digit characters from phone number
            phone = ''.join(filter(str.isdigit, identifier))
            if phone.startswith('0') and len(phone) > 10:
                phone = phone[1:]  # Remove leading 0 if present
            user = UserService.get_user_by_phone(db, phone)
            
        if not user or not AuthService.verify_password(password, user.password_hash):
            return False
        return user
        
    @staticmethod
    def update_password(user: User, new_password: str, db: Session):
        # Hash the new password
        hashed_password = AuthService.get_password_hash(new_password)
        # Update the user's password hash
        user.password_hash = hashed_password
        db.commit()
        db.refresh(user)
        return user

class FarmerService:
    @staticmethod
    def create_farmer(db: Session, farmer_data: FarmerCreate):
        # Check for existing farmer with same email or phone
        existing_farmer = db.query(Farmer).filter(
            (Farmer.email == farmer_data.email) |
            (Farmer.phone == farmer_data.phone)
        ).first()
        
        if existing_farmer:
            raise HTTPException(
                status_code=400,
                detail="A farmer with this email or phone number already exists"
            )
            
        # Create user first
        user = UserService.create_user(db, farmer_data)
        
        # Create farmer profile with common fields
        db_farmer = Farmer(
            user_id=user.id,
            full_name=farmer_data.full_name,
            email=farmer_data.email,
            phone=farmer_data.phone,
            address_line1=farmer_data.address_line1,
            address_line2=farmer_data.address_line2,
            city=farmer_data.city,
            state=farmer_data.state,
            mandal=farmer_data.mandal,
            country=farmer_data.country,
            postal_code=farmer_data.postal_code,
            # Farmer specific fields
            farm_size=farmer_data.farm_size,
            primary_crop_types=farmer_data.primary_crop_types,
            years_of_experience=farmer_data.years_of_experience,
            farmer_location=farmer_data.farmer_location,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(farmer_data, 'photo_url', None),
            aadhar_front_url=getattr(farmer_data, 'aadhar_front_url', None),
            aadhar_number=getattr(farmer_data, 'aadhar_number', None)
        )
        
        db.add(db_farmer)
        db.commit()
        db.refresh(db_farmer)
        
        # Set the user relationship
        db_farmer.user = user
        return db_farmer
    
    @staticmethod
    def get_farmer_by_user_id(db: Session, user_id: UUID):
        return db.query(Farmer).filter(Farmer.user_id == user_id).first()

class LandownerService:
    @staticmethod
    def create_landowner(db: Session, landowner_data: LandownerCreate) -> User:
        # Create user first
        user = UserService.create_user(db, landowner_data)
        
        # Create landowner profile with common fields
        db_landowner = Landowner(
            user_id=user.id,
            full_name=landowner_data.full_name,
            email=landowner_data.email,
            phone=landowner_data.phone,
            address_line1=landowner_data.address_line1,
            address_line2=landowner_data.address_line2,
            city=landowner_data.city,
            state=landowner_data.state,
            mandal=landowner_data.mandal,
            country=landowner_data.country,
            postal_code=landowner_data.postal_code,
            # Landowner specific fields
            total_land_area=landowner_data.total_land_area,
            current_land_use=landowner_data.current_land_use.value if hasattr(landowner_data.current_land_use, 'value') else str(landowner_data.current_land_use),  # Enum to string
            managing_remotely=landowner_data.managing_remotely,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(landowner_data, 'photo_url', None),
            aadhar_front_url=getattr(landowner_data, 'aadhar_front_url', None),
            aadhar_number=getattr(landowner_data, 'aadhar_number', None)
        )
        
        db.add(db_landowner)
        db.commit()
        db.refresh(db_landowner)
        db.refresh(user)
        
        return user

class AgriCopilotService:
    @staticmethod
    def create_agri_copilot(db: Session, data: AgriCopilotRegister) -> AgriCopilot:
        if data.password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")

        existing = db.query(AgriCopilot).filter(
            (AgriCopilot.email == data.email) | (AgriCopilot.phone == data.phone)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="AgriCopilot with this email or phone already exists")

        hashed_password = AuthService.get_password_hash(data.password)

        copilot = AgriCopilot(
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            aadhar_number=data.aadhar_number,
            password_hash=hashed_password,
            photo_url=data.photo_url,
            aadhar_front_url=data.aadhar_front_url,
        )

        copilot.set_custom_id(db)
        db.add(copilot)
        db.commit()
        db.refresh(copilot)

        return copilot


class VendorService:
    @staticmethod
    def create_vendor(db: Session, vendor_data: VendorCreate) -> User:
        # Create user first
        user = UserService.create_user(db, vendor_data)
        
        # Create vendor profile with common fields and default values
        db_vendor = Vendor(
            user_id=user.id,
            full_name=vendor_data.full_name,
            email=vendor_data.email,
            phone=vendor_data.phone,
            address_line1=vendor_data.address_line1,
            address_line2=vendor_data.address_line2,
            city=vendor_data.city,
            state=vendor_data.state,
            mandal=vendor_data.mandal,
            country=vendor_data.country,
            postal_code=vendor_data.postal_code,
            # Vendor specific fields
            legal_name=vendor_data.legal_name,
            business_name=vendor_data.business_name,
            gstin=vendor_data.gstin,
            pan=vendor_data.pan,
            business_type=vendor_data.business_type.value if hasattr(vendor_data.business_type, 'value') else str(vendor_data.business_type),  # Enum to string
            product_services=vendor_data.product_services,
            years_in_business=vendor_data.years_in_business,
            service_area=vendor_data.service_area,
            rating_avg=0.0,
            rating_count=0,
            verified=False,
            certification_status="PENDING",
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(vendor_data, 'photo_url', None),
            aadhar_front_url=getattr(vendor_data, 'aadhar_front_url', None),
            aadhar_number=getattr(vendor_data, 'aadhar_number', None)
        )
        
        db.add(db_vendor)
        db.commit()
        db.refresh(db_vendor)
        db.refresh(user)
        
        return user

class BuyerService:
    @staticmethod
    def create_buyer(db: Session, buyer_data: BuyerCreate) -> User:
        # Create user first
        user = UserService.create_user(db, buyer_data)
        
        # Create buyer profile with common fields and default values
        db_buyer = Buyer(
            user_id=user.id,
            full_name=buyer_data.full_name,
            email=buyer_data.email,
            phone=buyer_data.phone,
            address_line1=buyer_data.address_line1,
            address_line2=buyer_data.address_line2,
            city=buyer_data.city,
            state=buyer_data.state,
            mandal=buyer_data.mandal,
            country=buyer_data.country,
            postal_code=buyer_data.postal_code,
            # Buyer specific fields
            organization_name=buyer_data.organization_name,
            buyer_type=buyer_data.buyer_type,
            interested_crop_types=buyer_data.interested_crop_types,
            preferred_products=buyer_data.preferred_products,
            monthly_purchase_volume=buyer_data.monthly_purchase_volume,
            business_license_number=buyer_data.business_license_number,
            gst_number=buyer_data.gst_number,
            reliability_score=0.0,
            # Document fields - FIXED: Now saving uploaded files!
            photo_url=getattr(buyer_data, 'photo_url', None),
            aadhar_front_url=getattr(buyer_data, 'aadhar_front_url', None),
            aadhar_number=getattr(buyer_data, 'aadhar_number', None)
        )
        
        db.add(db_buyer)
        db.commit()
        db.refresh(db_buyer)
        db.refresh(user)
        
        return user
        response = buyer_data.dict()
        response.update({
            "message": "Buyer registration successful!",
            "success": True
        })
        return response

class PasswordResetService:
    @staticmethod
    def reset_password(db: Session, email: str, new_password: str):
        """
        Reset user's password after OTP verification.
        """
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        # Hash the new password
        hashed_password = AuthService.get_password_hash(new_password)
        user.password_hash = hashed_password
        
        try:
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password."
            )

# Email service implementation using SendGrid
class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.sender_email = os.getenv('SENDER_EMAIL', self.smtp_username or 'noreply@agrihub.com')
        self.sender_name = os.getenv('SENDER_NAME', 'AgriHub Team')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        
        # Validate required configuration
        if not all([self.smtp_server, self.smtp_username, self.smtp_password]):
            raise ValueError("SMTP configuration is incomplete. Please check your environment variables.")

    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Send an email using SMTP with enhanced error handling
        """
        import smtplib, ssl
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        if not all([to_email, subject, html_content]):
            print("❌ Missing required email parameters")
            return False

        try:
            # Create message container
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f'"{self.sender_name}" <{self.sender_email}>'
            msg['To'] = to_email

            # Attach HTML content
            msg.attach(MIMEText(html_content, 'html'))

            # Create SSL context
            context = ssl.create_default_context()

            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.ehlo()
                if self.use_tls:
                    server.starttls(context=context)
                    server.ehlo()
                
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ SMTP Authentication Error: {str(e)}\n"
                  "Please check your SMTP credentials and ensure 'Less secure app access' is enabled\n"
                  "or use an App Password if 2-Step Verification is enabled.")
        except smtplib.SMTPException as e:
            print(f"❌ SMTP Error: {str(e)}")
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}. Error: {str(e)}")
        
        return False

    def send_agri_copilot_invitation_email(self, email: str, full_name: str, registration_link: str) -> bool:
        """
        Send an invitation email to AgriCopilot with registration link.
        """
        subject = "You're Invited to Join as an AgriCopilot - AgriHub 🌾"

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 25px;">
                <h2 style="color: #2e7d32;">🌱 Welcome to AgriHub!</h2>
                <p>Hello <strong>{full_name}</strong>,</p>
                <p>You have been invited to register as an <strong>AgriCopilot</strong> on AgriHub.</p>
                <p>As an AgriCopilot, you’ll collaborate with farmers and landowners to guide agricultural growth using smart insights.</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{registration_link}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                        Complete Registration
                    </a>
                </div>
                <p>If the button above doesn’t work, you can also copy and paste the following link into your browser:</p>
                <p style="color: #4CAF50; word-break: break-all;">{registration_link}</p>
                <p>We look forward to having you onboard!</p>
                <p>Best regards,<br><strong>The AgriHub Team</strong></p>
            </div>
        </body>
        </html>
        """

        return self._send_email(email, subject, html_content)

    @staticmethod
    def send_verification_email(email: str, name: str):
        """
        Send an email verification email to the user.
        
        Args:
            email: User's email address
            name: User's full name
        """
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        # Use FRONTEND_URL from config (configured in .env)
        
        # Create verification link (you might want to generate a token here)
        verification_link = f"{FRONTEND_URL}/verify-email"
        
        # Create the email content
        subject = 'Verify Your Email Address'
        
        # Plain text version
        text_content = f"""
        Hello {name},
        
        Thank you for registering with AgriHub AI! Please verify your email address by clicking the link below:
        
        {verification_link}
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        The AgriHub AI Team
        """
        
        # HTML version
        html_content = f"""
        <html>
        <body>
            <p>Hello {name},</p>
            <p>Thank you for registering with AgriHub AI! Please verify your email address by clicking the button below:</p>
            <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:<br>
            <code>{verification_link}</code></p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>The AgriHub AI Team</p>
        </body>
        </html>
        """
        
        # Create the message
        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriHub AI"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            # Send the email
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            print(f"Verification email sent to {email}. Status code: {response.status_code}")
            return True
        except Exception as e:
            print(f"Failed to send verification email to {email}. Error: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_email(email: str, token: str):
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv

        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        # Use FRONTEND_URL from config (configured in .env)
        
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        # Create the email content
        subject = 'Password Reset Request'
        
        # Plain text version
        text_content = f"""
        You have requested to reset your password.
        
        Please click on the following link to reset your password:
        {reset_link}
        
        If you didn't request this, please ignore this email or contact support.
        """
        
        # HTML version
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Please click on the following link to reset your password:</p>
            <p><a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:<br>{reset_link}</p>
            <p>If you didn't request this, please ignore this email or contact support.</p>
        </div>
        """

        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriConnect Support"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                print(f"Password reset email sent to {email} successfully.")
                return True
            else:
                print(f"Failed to send password reset email. Status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error sending email with SendGrid: {e}")
            return False
    
    @staticmethod
    def send_welcome_email(email: str, name: str, user_type: str):
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, From
        import os
        from dotenv import load_dotenv

        load_dotenv()
        
        SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        
        # Create the email content
        subject = f'Welcome to AgriConnect, {name}!'
        
        # Plain text version
        text_content = f"""
        Welcome to AgriConnect, {name}!
        
        Thank you for registering as a {user_type}. We're excited to have you on board.
        
        You can now log in to your account and start using our services.
        
        If you have any questions, please don't hesitate to contact our support team.
        """
        
        # HTML version
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to AgriConnect, {name}!</h2>
            <p>Thank you for registering as a {user_type}. We're excited to have you on board.</p>
            <p>You can now log in to your account and start using our services.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        """.format(name=name, user_type=user_type)

        message = Mail(
            from_email=From(SENDER_EMAIL, "AgriConnect Team"),
            to_emails=email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            if response.status_code in [200, 202]:
                print(f"Welcome email sent to {email} successfully.")
                return True
            else:
                print(f"Failed to send welcome email. Status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error sending welcome email with SendGrid: {e}")
            return False

# SMS service (mock implementation)
class SMSService:
    @staticmethod
    def send_otp_sms(phone: str, otp: str):
        print(f"OTP SMS would be sent to {phone}")
        print(f"Your OTP is: {otp}")
        
        # Mock success
        return True
    
    @staticmethod
    def generate_otp() -> str:
        return secrets.token_hex(3)  # 6-digit hex OTP

# Validation service
class ValidationService:
    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        # Basic phone validation (can be enhanced)
        import re
        pattern = r'^[\+]?[1-9][\d]{0,15}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def validate_gst_number(gst: str) -> bool:
        # Basic GST validation
        import re
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        return re.match(pattern, gst) is not None
    
    @staticmethod
    def validate_strong_password(password: str) -> dict:
        """
        Validate password strength
        Returns dict with validation results
        """
        import re
        
        result = {
            'is_valid': True,
            'errors': []
        }
        
        if len(password) < 8:
            result['is_valid'] = False
            result['errors'].append('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            result['errors'].append('Password should contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            result['errors'].append('Password should contain at least one lowercase letter')
        
        if not re.search(r'[0-9]', password):
            result['errors'].append('Password should contain at least one number')
        
        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
            result['errors'].append('Password should contain at least one special character')
        
        return result



