from typing import Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import os
import logging

from app.schemas.postgres_base import User, UserRole
from app.auth.otp_service import OTPService
from app.core.security import verify_password, get_password_hash
from app.core.config import settings

logger = logging.getLogger(__name__)

# Robust JWT encode helper (prefers PyJWT, falls back to python-jose)
def jwt_encode(payload: Dict[str, Any], key: str, algorithm: str) -> str:
    # Prefer PyJWT if available
    try:
        import jwt as pyjwt  # type: ignore
        return pyjwt.encode(payload, key, algorithm=algorithm)
    except Exception:
        # Fallback to python-jose
        try:
            from jose import jwt as jose_jwt  # type: ignore
            return jose_jwt.encode(payload, key, algorithm=algorithm)
        except Exception as e:
            raise RuntimeError("JWT library not available. Install 'PyJWT' or 'python-jose'.") from e


class AuthService:
    # Token settings - CRITICAL: Use settings from config to ensure consistency
    SECRET_KEY = settings.SECRET_KEY
    ALGORITHM = settings.ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours (30 minutes was too short)
    
    # Log the SECRET_KEY being used (show first/last 10 chars only for security)
    logger.info(f"🔐 AuthService initialized with SECRET_KEY: {SECRET_KEY[:10]}...{SECRET_KEY[-10:]}")

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a new access token"""
        logger.info(f"🔑 Creating token with SECRET_KEY: {AuthService.SECRET_KEY[:10]}...{AuthService.SECRET_KEY[-10:]}")
        
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        
        logger.info(f"📝 Token payload: sub={to_encode.get('sub')}, exp={expire}")
        
        encoded_jwt = jwt_encode(to_encode, AuthService.SECRET_KEY, AuthService.ALGORITHM)
        
        logger.info(f"✅ Token created: {encoded_jwt[:50]}...")
        
        return encoded_jwt

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify if the plain password matches the hash"""
        return verify_password(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return get_password_hash(password)

    @staticmethod
    async def authenticate_user(
        db: Session,
        identifier: str,
        password: str,
    ) -> Dict[str, Any]:
        """
        Authenticate user with password and return login response with token
        Returns login response dictionary with token and user info
        """
        # Determine if identifier is email or phone
        is_email = "@" in identifier
        identifier_type = "email" if is_email else "phone"

        # Clean phone number if necessary
        if not is_email:
            # Remove any non-digit characters and ensure proper format
            phone = "".join(filter(str.isdigit, identifier))
            if phone.startswith("0"):
                phone = phone[1:]
            if len(phone) == 10:
                phone = f"+91{phone}"
            identifier = phone

        # Get user from database
        user = None
        if is_email:
            user = db.query(User).filter(User.email == identifier).first()
        else:
            user = db.query(User).filter(User.phone == identifier).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )

        # Check verification status for non-admin users
        if user.role != UserRole.admin:
            # Get user's role-specific record to check verification_status
            from app.schemas.postgres_base import Farmer, Buyer, Vendor, Landowner, AgriCopilot
            
            role_model_map = {
                "farmer": Farmer,
                "buyer": Buyer,
                "vendor": Vendor,
                "landowner": Landowner,
                "agri_copilot": AgriCopilot
            }
            
            role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
            
            if role_str in role_model_map:
                model = role_model_map[role_str]
                user_record = db.query(model).filter(model.user_id == user.id).first()
                
                if user_record:
                    verification_status = getattr(user_record, 'verification_status', 'approved')
                    
                    if verification_status == 'pending':
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Your account is pending admin approval. Please wait for approval to login."
                        )
                    elif verification_status == 'rejected':
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Your account has been rejected by admin. Please contact support for more information."
                        )

        # Verify password
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()

        # Normalize role to string (supports Enum or plain string stored in DB)
        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

        # Create access token
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "role": role_str}
        )
        
        # Log token creation for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔐 Created token for user {user.email}: {access_token[:50]}...")

        # Return login response with token
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "phone": user.phone,
                "full_name": getattr(user, "full_name", None) or getattr(user, "display_name", None),
                "role": role_str,
                "is_active": user.is_active,
                "is_verified": user.is_verified
            }
        }

    @staticmethod
    async def send_login_otp(identifier: str) -> Tuple[bool, str]:
        """
        Send OTP for login
        Returns (success, message) tuple
        """
        is_email = "@" in identifier
        identifier_type = "email" if is_email else "phone"

        # Clean phone number if necessary
        if not is_email:
            # Remove any non-digit characters and ensure proper format
            phone = "".join(filter(str.isdigit, identifier))
            if phone.startswith("0"):
                phone = phone[1:]
            if len(phone) == 10:
                phone = f"+91{phone}"
            identifier = phone

        try:
            otp_sent, message = await OTPService.send_otp(identifier, identifier_type)
            if otp_sent:
                return True, message
            return False, message
        except Exception as e:
            return False, str(e)

    # NOTE: duplicate create_access_token removed; using the single definition above

    @staticmethod
    def get_login_response(user: User, access_token: str) -> Dict[str, Any]:
        """Generate standardized login response"""
        # Determine redirect path based on user role
        redirect_path = "/dashboard"  # Default path

        # Normalize role to string
        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

        if role_str == UserRole.admin.value:
            redirect_path = "/admin/dashboard"
            # Check for super admin status
            admin = getattr(user, "admin", None)
            if admin and getattr(admin, "is_super_admin", False):
                redirect_path = "/admin/super"
        else:
            # Role-specific redirects
            path_map = {
                UserRole.farmer.value: "/farmer",
                UserRole.landowner.value: "/farmer",  # Landowners now use the same dashboard as farmers
                UserRole.vendor.value: "/vendor",
                UserRole.buyer.value: "/buyer",
                UserRole.agri_copilot.value: "/agricopilot"
            }
            redirect_path = path_map.get(role_str, redirect_path)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "phone": user.phone,
                "role": role_str,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "custom_id": user.custom_id,
                "full_name": user.display_name
            },
            "redirect_to": redirect_path
        }
    @staticmethod
    def reset_password(db: Session, identifier: str, new_password: str) -> Optional[User]:
        """
        Reset user password after OTP verification
        
        Args:
            db: Database session
            identifier: Email or phone number
            new_password: New password to set
            
        Returns:
            User object if successful, None if user not found
        """
        try:
            # Determine if identifier is email or phone
            is_email = "@" in identifier
            
            # Find user
            user = None
            if is_email:
                identifier = identifier.strip().lower()
                user = db.query(User).filter(User.email == identifier).first()
            else:
                # Normalize phone number
                phone = "".join(filter(str.isdigit, identifier))
                if phone.startswith("0"):
                    phone = phone[1:]
                if len(phone) == 10:
                    phone = f"+91{phone}"
                elif phone.startswith("91") and len(phone) == 12:
                    phone = f"+{phone}"
                else:
                    phone = identifier
                    
                user = db.query(User).filter(User.phone == phone).first()
            
            if not user:
                logger.warning(f"User not found for password reset: {identifier}")
                return None
            
            # Hash and update password
            user.password_hash = get_password_hash(new_password)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Password reset successful for user: {identifier}")
            return user
            
        except Exception as e:
            logger.error(f"Error resetting password for {identifier}: {str(e)}")
            db.rollback()
            return None
