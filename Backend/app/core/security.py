from passlib.context import CryptContext
import bcrypt

# Try to initialize passlib context, fallback to direct bcrypt if needed
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_PASSLIB = True
except Exception as e:
    print(f"Warning: Passlib initialization failed: {e}. Using direct bcrypt.")
    USE_PASSLIB = False

def get_password_hash(password: str) -> str:
    """Generate password hash with bcrypt 72-byte limit handling"""
    # Ensure password is within bcrypt's 72-byte limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Safely truncate password to fit bcrypt limit while preserving UTF-8 character boundaries
        truncated_bytes = password_bytes[:72]
        # Use a more robust decoder that handles incomplete characters at the end
        try:
            password = truncated_bytes.decode('utf-8')
        except UnicodeDecodeError:
            # If truncation broke a character, find the last complete character
            for i in range(72, 0, -1):
                try:
                    password = password_bytes[:i].decode('utf-8')
                    break
                except UnicodeDecodeError:
                    continue
            else:
                # Fallback: use first 50 characters of original string (safe for most cases)
                password = password[:50]
        print(f"Password truncated from {len(password_bytes)} to {len(password.encode('utf-8'))} bytes for bcrypt compatibility")
    
    if USE_PASSLIB:
        try:
            return pwd_context.hash(password)
        except Exception as e:
            print(f"Passlib hashing failed: {e}. Falling back to direct bcrypt.")
    
    # Fallback to direct bcrypt
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
            for i in range(72, 0, -1):
                try:
                    plain_password = password_bytes[:i].decode('utf-8')
                    break
                except UnicodeDecodeError:
                    continue
            else:
                # Fallback: use first 50 characters of original string (safe for most cases)
                plain_password = plain_password[:50]
    
    if USE_PASSLIB:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            print(f"Passlib verification failed: {e}. Falling back to direct bcrypt.")
    
    # Fallback to direct bcrypt
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False