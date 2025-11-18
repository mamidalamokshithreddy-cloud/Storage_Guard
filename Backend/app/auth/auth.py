from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.core.config import settings
from app.schemas.postgres_base import User, UserRole
from app.connections.postgres_connection import get_db

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Log SECRET_KEY at startup for debugging (show first/last 10 chars only)
logger.info(f"🔐 AUTH MODULE: Using SECRET_KEY: {settings.SECRET_KEY[:10]}...{settings.SECRET_KEY[-10:]}")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        logger.info(f"🔍 Attempting to decode token: {token[:50]}...")
        logger.info(f"🔑 Using SECRET_KEY: {settings.SECRET_KEY[:10]}...{settings.SECRET_KEY[-10:]}")
        
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")  # Changed: This is user.id, not email!
        logger.info(f"✅ Token decoded successfully. User ID: {user_id}")
        
        if user_id is None:
            logger.error("❌ No 'sub' (user_id) found in token payload")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"❌ JWT decode error: {str(e)}")
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()  # Changed: Query by ID, not email!
    if user is None:
        logger.error(f"❌ User not found in database: {user_id}")
        raise credentials_exception
    
    logger.info(f"✅ User authenticated: {user.email} (role: {user.role})")
    return user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    # Normalize role to string for comparison (handles both Enum and string values)
    user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    admin_role_str = UserRole.admin.value if hasattr(UserRole.admin, 'value') else 'admin'
    
    logger.info(f"🔐 Role check: user_role='{user_role_str}' (type: {type(current_user.role).__name__}), admin_role='{admin_role_str}'")
    
    if user_role_str != admin_role_str and user_role_str != 'admin':
        logger.error(f"❌ User {current_user.email} has role '{user_role_str}', not admin. Access denied.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    
    logger.info(f"✅ Admin authorization successful for {current_user.email}")
    return current_user

async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return current_user