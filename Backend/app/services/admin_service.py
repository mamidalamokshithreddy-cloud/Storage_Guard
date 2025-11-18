from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.postgres_base import User, Admin, UserRole
from app.services.copilot_services import AuthService

class AdminService:
    @staticmethod
    def create_admin_user(
        db: Session, 
        email: str,
        phone: str,
        password: str,
        full_name: str,
        is_super_admin: bool = False,
        department: Optional[str] = None,
        permissions: Optional[str] = None
    ) -> User:
        """Create a new admin user with associated admin profile"""
        
        # Create base user with admin role
        user = User(
            email=email,
            phone=phone,
            password_hash=AuthService.get_password_hash(password),
            role=UserRole.admin.value,  # Convert enum to string
            is_active=True,
            is_verified=True  # Admins are verified by default
        )
        
        try:
            db.add(user)
            db.flush()  # Get the user ID without committing
            
            # Create admin profile
            admin = Admin(
                user_id=user.id,
                is_super_admin=is_super_admin,
                department=department,
                permissions=permissions
            )
            
            db.add(admin) 
            db.commit()
            db.refresh(user)
            return user
             
        except Exception as e: 
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creating admin user: {str(e)}"
            )
    
    @staticmethod
    def get_admin_by_id(db: Session, user_id: UUID) -> Optional[Admin]:
        """Get admin profile by user ID"""
        return db.query(Admin).filter(Admin.user_id == user_id).first()
    
    @staticmethod
    def is_super_admin(db: Session, user_id: UUID) -> bool:
        """Check if a user is a super admin"""
        admin = AdminService.get_admin_by_id(db, user_id)
        return bool(admin and admin.is_super_admin)
    
    @staticmethod
    def update_admin_permissions(
        db: Session,
        user_id: UUID,
        permissions: str,
        department: Optional[str] = None
    ) -> Admin:
        """Update admin permissions and department"""
        admin = AdminService.get_admin_by_id(db, user_id)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin profile not found"
            )
        
        admin.permissions = permissions
        if department:
            admin.department = department
            
        try:
            db.commit()
            db.refresh(admin)
            return admin
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error updating admin permissions: {str(e)}"
            )