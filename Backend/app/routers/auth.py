from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.connections.postgres_connection import get_db
from app.auth.otp_service import OTPService
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.schemas.postgres_base_models import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    OTPVerify,
    LoginRequest,
    Token
)
from app.services.user_service import UserService
from app.schemas.postgres_base_models import FarmerCreate, FarmerResponse
from app.schemas.postgres_base import User, Farmer, Buyer, Vendor, Landowner, AgriCopilot
import logging
from typing import Optional


class HTTPError(BaseModel):
    detail: str

authentication_router = APIRouter()

logger = logging.getLogger(__name__)
email_service = EmailService()
auth_service = AuthService()

@authentication_router.post("/login", 
         response_model=Token,
         responses={
             401: {"model": HTTPError},
             400: {"model": HTTPError},
             500: {"model": HTTPError}
         })
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Login for any user type using password
    """
    try:
        # Log login attempt
        logger.info(f"Login attempt for {'email' if request.email else 'phone'}: {request.email or request.phone}")
        
        # Check if user exists
        user = UserService.get_user_by_email_or_phone(db, request.email, request.phone)
        if not user:
            logger.warning(f"Login failed for {request.email or request.phone}: User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Validate login credentials
        identifier = request.email or request.phone
        if not identifier or not request.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both identifier (email/phone) and password are required"
            )

        try:
            # Convert identifier to string to handle any type issues
            identifier_str = str(identifier).strip()
            if not identifier_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid identifier format"
                )

            # Authenticate user and get response with token
            auth_response = await auth_service.authenticate_user(
                db=db,
                identifier=identifier_str,
                password=request.password
            )
            
            # Log successful login with token info
            logger.info(f"Successful login for user: {identifier}")
            logger.info(f"🔑 Token generated: {auth_response.get('access_token', 'MISSING')[:50]}...")
            logger.info(f"📋 Response keys: {list(auth_response.keys())}")
            
            # Set secure cookie with token (8 hours to match JWT expiration)
            response.set_cookie(
                key="Authorization",
                value=f"Bearer {auth_response['access_token']}",
                httponly=True,
                secure=False,  # Changed to False for localhost development
                samesite="lax",  # Changed from "strict" to "lax" for better compatibility
                max_age=28800  # 8 hours (480 minutes * 60 seconds)
            )
            
            logger.info(f"✅ Returning auth response to frontend")
            return auth_response
        except HTTPException as he:
            logger.warning(f"Login failed for {identifier}: {he.detail}")
            raise he
        
    except HTTPException as he:
        # Re-raise HTTPExceptions (like approval errors) to preserve status codes and messages
        logger.warning(f"Authentication failed: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

# Farmer registration moved to admin_routes.py to avoid duplication

@authentication_router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Handle forgot password request by sending OTP.
    """
    try:
        identifier = request.email or request.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or phone number is required"
            )
        
        # Determine identifier type
        is_email = "@" in identifier
        identifier_type = "email" if is_email else "phone"
        
        # Check if user exists in database
        user = None
        if is_email:
            user = db.query(User).filter(User.email == identifier.strip().lower()).first()
        else:
            # Normalize phone number for lookup
            phone_digits = "".join(filter(str.isdigit, identifier))
            if phone_digits.startswith("0"):
                phone_digits = phone_digits[1:]
            if len(phone_digits) == 10:
                phone_normalized = f"+91{phone_digits}"
            elif phone_digits.startswith("91") and len(phone_digits) == 12:
                phone_normalized = f"+{phone_digits}"
            else:
                phone_normalized = identifier
                
            user = db.query(User).filter(User.phone == phone_normalized).first()
        
        # If user doesn't exist, return error with specific message
        if not user:
            if is_email:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"❌ No account found with email '{identifier}'. Please check your email address or register a new account."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"❌ No account found with phone number '{identifier}'. Please check your phone number or register a new account."
                )
        
        # User exists, send OTP
        success, message = await OTPService.send_otp(identifier, identifier_type)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"❌ Failed to send OTP: {message}. Please try again."
            )

        # Success response with detailed message
        return MessageResponse(
            message=f"✅ OTP sent successfully to your {identifier_type}: {identifier}. Please check your {identifier_type} and enter the OTP to reset your password.",
            success=True
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in forgot password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ An error occurred while processing your request: {str(e)}"
        )

@authentication_router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify OTP for password reset.
    """
    try:
        identifier = request.email or request.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="❌ Email or phone number is required"
            )

        # Verify OTP
        is_email = "@" in identifier
        identifier_type = "email" if is_email else "phone"
        is_valid = OTPService.verify_otp(identifier, request.otp, identifier_type)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"❌ Invalid or expired OTP. Please request a new OTP and try again."
            )

        return MessageResponse(
            message=f"✅ OTP verified successfully! You can now reset your password.",
            success=True
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in OTP verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ An error occurred while verifying OTP: {str(e)}"
        )

@authentication_router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password after OTP verification.
    """
    try:
        # Verify OTP as a security measure (and delete it after verification)
        identifier = request.email or request.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="❌ Email or phone number is required"
            )

        is_email = "@" in identifier
        identifier_type = "email" if is_email else "phone"
        
        # Final OTP verification - delete OTP after successful verification
        is_valid = OTPService.verify_otp(identifier, request.otp, identifier_type, delete_after_verify=True)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="❌ Invalid or expired OTP. Please request a new OTP and try again."
            )

        # Update password
        user = AuthService.reset_password(db, identifier, request.new_password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"❌ User not found with {identifier_type}: {identifier}"
            )

        return MessageResponse(
            message="✅ Password reset successful! You can now login with your new password.",
            success=True
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in password reset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ An error occurred while resetting password: {str(e)}"
        )


@authentication_router.get("/api/check-duplicate")
async def check_duplicate(
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Check if email or phone number already exists in the system.
    Used by registration form to prevent duplicate accounts.
    """
    try:
        if not email and not phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either email or phone must be provided"
            )
        
        # Check in User table first
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user:
                logger.info(f"Duplicate check: Email '{email}' already exists in users table")
                return {"exists": True, "field": "email", "message": f"Email '{email}' is already registered"}
        
        if phone:
            # Clean phone number (remove +91 and spaces)
            clean_phone = phone.replace('+91', '').replace(' ', '').strip()
            
            user = db.query(User).filter(User.phone == clean_phone).first()
            if user:
                logger.info(f"Duplicate check: Phone '{clean_phone}' already exists in users table")
                return {"exists": True, "field": "phone", "message": f"Phone number is already registered"}
        
        # Check in all user-type tables (Farmer, Buyer, Vendor, Landowner, AgriCopilot)
        user_tables = [Farmer, Buyer, Vendor, Landowner, AgriCopilot]
        
        for table in user_tables:
            if email:
                record = db.query(table).filter(table.email == email).first()
                if record:
                    table_name = table.__tablename__.replace('_', ' ').title()
                    logger.info(f"Duplicate check: Email '{email}' found in {table_name} table")
                    return {"exists": True, "field": "email", "message": f"Email '{email}' is already registered as {table_name}"}
            
            if phone:
                clean_phone = phone.replace('+91', '').replace(' ', '').strip()
                record = db.query(table).filter(table.phone == clean_phone).first()
                if record:
                    table_name = table.__tablename__.replace('_', ' ').title()
                    logger.info(f"Duplicate check: Phone '{clean_phone}' found in {table_name} table")
                    return {"exists": True, "field": "phone", "message": f"Phone number is already registered as {table_name}"}
        
        # No duplicates found
        logger.info(f"Duplicate check: No duplicates found for email='{email}', phone='{phone}'")
        return {"exists": False, "field": None, "message": "Available"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in duplicate check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking for duplicates: {str(e)}"
        )