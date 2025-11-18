from typing import List
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.postgres_base import User, UserRole
from app.schemas.postgres_base_models import UserCreate
from app.services.auth_service import AuthService

class UserService:
    @staticmethod
    def to_response(user: User) -> dict:
        """Convert User model to response dictionary"""
        return {
            "id": str(user.id),
            "custom_id": user.custom_id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": (user.role.value if hasattr(user, 'role') and hasattr(user.role, 'value') else (user.role if hasattr(user, 'role') else None)),
            "address_line1": user.address_line1,
            "address_line2": user.address_line2,
            "city": user.city,
            "state": user.state,
            "country": user.country,
            "postal_code": user.postal_code,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
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
    def get_user_by_email_or_phone(db: Session, email: str = None, phone: str = None):
        """Get user by email or phone number"""
        if email:
            return db.query(User).filter(User.email == email).first()
        elif phone:
            return db.query(User).filter(User.phone == phone).first()
        else:
            return None
        
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
        """
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
        """
        from sqlalchemy import func
        result = (
            db.query(User.role, func.count(User.id))
            .all()
        )
        # roles are stored as strings; ensure keys are plain strings
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
        
    @staticmethod
    def get_pending_verifications(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get list of users pending verification
        """
        return db.query(User).filter(
            User.is_verified == False
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