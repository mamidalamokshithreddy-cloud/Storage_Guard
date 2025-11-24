from passlib.context import CryptContext
import bcrypt
import logging

logger = logging.getLogger(__name__)

# Try to initialize passlib context, fallback to direct bcrypt if needed
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_PASSLIB = True
except Exception as e:
    logger.warning(f"Passlib initialization failed: {e}. Using direct bcrypt.")
    USE_PASSLIB = False

def get_password_hash(password: str) -> str:
    """Generate password hash with bcrypt 72-byte limit handling"""
    # Truncate password to bcrypt's 72-byte limit BEFORE hashing
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Safely truncate to 72 bytes while preserving UTF-8 character boundaries
        try:
            password = password_bytes[:72].decode('utf-8')
        except UnicodeDecodeError:
            # If truncation broke a character, find the last complete character
            for i in range(71, 0, -1):
                try:
                    password = password_bytes[:i].decode('utf-8')
                    break
                except UnicodeDecodeError:
                    continue
        logger.debug(f"Password truncated from {len(password_bytes)} to {len(password.encode('utf-8'))} bytes for bcrypt")
    
    # Use direct bcrypt to avoid passlib warnings
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash with bcrypt 72-byte limit handling"""
    # Apply same truncation logic for verification
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        # Use the same safe truncation logic as in get_password_hash
        try:
            plain_password = password_bytes[:72].decode('utf-8')
        except UnicodeDecodeError:
            # If truncation broke a character, find the last complete character
            for i in range(71, 0, -1):
                try:
                    plain_password = password_bytes[:i].decode('utf-8')
                    break
                except UnicodeDecodeError:
                    continue
        logger.debug(f"Password truncated for verification")
    
    # Use direct bcrypt to avoid passlib warnings
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False