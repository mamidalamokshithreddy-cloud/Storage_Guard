import random
import re
import string
import time
from typing import Dict, Optional, Literal, Union
import os
from dotenv import load_dotenv
from fastapi import HTTPException, status
import logging

# Import notification services
from app.services.email_service import email_service
from app.services.notifications import notification_service

# Load environment variables
load_dotenv()

# Get configurations
APP_NAME = os.getenv("APP_NAME", "AgriHub")

# Configure logging
logger = logging.getLogger(__name__)

# In-memory storage for OTPs (in production, use Redis or database)
otp_storage: Dict[str, Dict] = {}

class OTPService:
    OTP_EXPIRY_MINUTES = 5  # OTP valid for 5 minutes
    OTP_LENGTH = 6
    
    @staticmethod
    def normalize_phone_number(phone: str) -> str:
        """
        Normalize phone number to E.164 format with +91 country code.
        
        Args:
            phone: The phone number to normalize
            
        Returns:
            str: Normalized phone number in E.164 format with +91 country code
            
        Raises:
            ValueError: If the phone number is invalid
        """
        if not phone:
            raise ValueError("Phone number cannot be empty")
            
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Handle numbers with country code
        if digits.startswith('91') and len(digits) == 12:
            return f"+{digits}"  # 91XXXXXXXXXX -> +91XXXXXXXXXX
        elif len(digits) == 10:
            return f"+91{digits}"  # XXXXXXXXXX -> +91XXXXXXXXXX
        elif digits.startswith('0') and len(digits) == 11:
            return f"+91{digits[1:]}"  # 0XXXXXXXXXX -> +91XXXXXXXXX
        elif digits.startswith('91') and len(digits) > 12:
            # Handle case where country code is already included but with extra digits
            return f"+91{digits[2:12]}"  # 91XXXXXXXXXX... -> +91XXXXXXXXXX
        elif digits.startswith('+91') and len(digits) >= 13:
            # Already in +91 format, ensure it's exactly 10 digits after +91
            return f"+91{digits[3:13]}"  # +91XXXXXXXXXX... -> +91XXXXXXXXXX
        else:
            raise ValueError(f"Invalid phone number format: {phone}")

    @staticmethod
    def generate_otp(length: int = None) -> str:
        """Generate a random numeric OTP of specified length."""
        length = length or OTPService.OTP_LENGTH
        if not 4 <= length <= 8:
            raise ValueError("OTP length must be between 4 and 8 digits.")
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def create_otp(identifier: str, identifier_type: Literal['email', 'phone']) -> str:
        """Create an OTP for the given identifier (email or phone)."""
        otp = OTPService.generate_otp()
        current_time = time.time()
        storage_key = f"{identifier_type}:{identifier}"
        
        otp_storage[storage_key] = {
            'otp': otp,
            'timestamp': current_time,
            'expires_at': current_time + (OTPService.OTP_EXPIRY_MINUTES * 60),
            'type': identifier_type
        }
        return otp

    @staticmethod
    def verify_otp(identifier: str, otp: str, identifier_type: Literal['email', 'phone'], delete_after_verify: bool = False) -> bool:
        """
        Verify if the provided OTP is valid for the identifier.
        
        Args:
            identifier: Email or phone number
            otp: The OTP to verify
            identifier_type: 'email' or 'phone'
            delete_after_verify: If True, delete OTP after successful verification (default: False)
                                Use False for intermediate verification, True for final verification
        
        Returns:
            bool: True if OTP is valid, False otherwise
        """
        if not identifier or not otp:
            logger.error(f"Missing identifier or OTP - identifier: {identifier}, otp: {otp}")
            return False
        
        # Normalize identifier for consistent lookup
        if identifier_type == 'email':
            identifier = identifier.strip().lower()
        elif identifier_type == 'phone':
            try:
                identifier = OTPService.normalize_phone_number(identifier)
            except ValueError as e:
                logger.error(f"Failed to normalize phone number {identifier}: {str(e)}")
                return False
            
        storage_key = f"{identifier_type}:{identifier}"
        
        logger.info(f"Verifying OTP for storage_key: {storage_key}")
        logger.info(f"Available keys in storage: {list(otp_storage.keys())}")
        
        if storage_key not in otp_storage:
            logger.warning(f"No OTP found for {identifier_type}: {identifier}")
            logger.warning(f"Storage key '{storage_key}' not found in {list(otp_storage.keys())}")
            return False
            
        stored_data = otp_storage[storage_key]
        
        # Check if OTP has expired
        if time.time() > stored_data['expires_at']:
            # Clean up expired OTP
            del otp_storage[storage_key]
            logger.warning(f"OTP expired for {identifier_type}: {identifier}")
            return False
            
        # Verify OTP
        logger.info(f"Comparing OTPs - Stored: {stored_data['otp']}, Provided: {otp}")
        if stored_data['otp'] == otp:
            # Only delete if explicitly requested
            if delete_after_verify:
                del otp_storage[storage_key]
                logger.info(f"✅ OTP verified and deleted for {identifier_type}: {identifier}")
            else:
                logger.info(f"✅ OTP verified (kept in storage) for {identifier_type}: {identifier}")
            return True
            
        logger.warning(f"❌ OTP mismatch for {identifier_type}: {identifier}")
        logger.warning(f"   Expected: {stored_data['otp']}, Got: {otp}")
        return False

    @staticmethod
    async def send_otp(identifier: str, identifier_type: Literal['email', 'phone']) -> tuple[bool, str]:
        """
        Send OTP to the specified identifier (email or phone).
        Returns tuple (success: bool, message: str).
        """
        try:
            if not identifier:
                logger.error("No identifier provided for OTP")
                return False, "No identifier provided"
                
            # Clean and validate the identifier
            original_identifier = identifier
            identifier = identifier.strip()
            
            # Normalize identifier for consistent storage
            if identifier_type == 'email':
                identifier = identifier.lower()
                logger.info(f"Sending OTP to email: {identifier}")
            elif identifier_type == 'phone':
                try:
                    # Normalize phone number to +91XXXXXXXXXX format
                    identifier = OTPService.normalize_phone_number(identifier)
                    logger.info(f"Normalized phone number: {original_identifier} -> {identifier}")
                except ValueError as e:
                    logger.error(f"Invalid phone number format: {original_identifier}: {str(e)}")
                    return False, f"Invalid phone number format: {str(e)}"
            else:
                logger.info(f"Sending OTP to {identifier_type}: {identifier}")
            
            # Generate and store the OTP
            otp = OTPService.create_otp(identifier, identifier_type)
            logger.info(f"Generated OTP for {identifier_type}:{identifier} - Storage key will be: {identifier_type}:{identifier}")
            
            try:
                if identifier_type == 'email':
                    result = await OTPService._send_email_otp(identifier, otp)
                elif identifier_type == 'phone':
                    result = await OTPService._send_sms_otp(identifier, otp)
                else:
                    logger.error(f"Unsupported identifier type: {identifier_type}")
                    return False, f"Unsupported identifier type: {identifier_type}"
                
                if not result:
                    logger.error(f"Failed to send OTP to {identifier_type}: {identifier}")
                    return False, f"Failed to send OTP to {identifier_type}"
                
                logger.info(f"Successfully sent OTP to {identifier_type}: {identifier}")
                return True, f"OTP sent successfully to {identifier_type}"
                
            except Exception as send_error:
                logger.error(f"Error sending OTP to {identifier_type} {identifier}: {str(send_error)}")
                return False, f"Error sending OTP: {str(send_error)}"
            
        except Exception as e:
            logger.error(f"Error in send_otp for {identifier_type} {identifier}: {str(e)}")
            return False, f"Error in send_otp: {str(e)}"

    @staticmethod
    async def _send_sms_otp(phone: str, otp: str) -> bool:
        """
        Send OTP via SMS using Twilio.
        
        Args:
            phone: The phone number to send the OTP to (in E.164 format)
            otp: The OTP to send
            
        Returns:
            bool: True if the OTP was sent successfully, False otherwise
        """
        try:
            # Use the notification service to send the OTP
            return await notification_service.send_otp_sms(
                phone_number=phone,
                otp=otp,
                expiry_minutes=OTPService.OTP_EXPIRY_MINUTES
            )
        except Exception as e:
            logger.error(f"Error sending OTP to {phone}: {str(e)}")
            return False

    @staticmethod
    async def _send_email_otp(email: str, otp: str) -> bool:
        """
        Send OTP via email using our EmailService
        
        Args:
            email: The recipient's email address
            otp: The OTP to send
            
        Returns:
            bool: True if the email was sent successfully, False otherwise
        """
        try:
            return email_service.send_password_reset_email(
                to_email=email, 
                otp=otp,
                expiry_minutes=OTPService.OTP_EXPIRY_MINUTES
            )
        except Exception as e:
            logger.error(f"Error sending OTP email to {email}: {str(e)}")
            return False

    @staticmethod
    def cleanup_expired_otps():
        """Clean up expired OTPs from storage."""
        current_time = time.time()
        expired_keys = []
        
        for key, data in otp_storage.items():
            if current_time > data['expires_at']:
                expired_keys.append(key)
        
        for key in expired_keys:
            del otp_storage[key]
        
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired OTPs")

# Create global instance
otp_service = OTPService()