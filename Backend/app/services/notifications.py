from typing import Optional, Dict, Any, List
import logging
import asyncio
from fastapi import HTTPException, status
from dotenv import load_dotenv
import os
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserRole(str, Enum):
    FARMER = "farmer"
    LANDOWNER = "landowner"
    OFFICER = "officer"
    VENDOR = "vendor"
    BUYER = "buyer"
    ADMIN = "admin"

class NotificationService:
    """
    Service for handling notifications including email and SMS.
    Currently implements a mock SMS service for development purposes.
    In production, integrate with a real SMS gateway like Twilio.
    """
    
    def __init__(self):
        load_dotenv(override=True)
        self.app_name = os.getenv("APP_NAME", "AgriHub")
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        # Try TWILIO_SMS_NUMBER first, fall back to TWILIO_PHONE_NUMBER
        self.twilio_phone_number = os.getenv("TWILIO_SMS_NUMBER") or os.getenv("TWILIO_PHONE_NUMBER")
        self.twilio_status_callback = os.getenv("TWILIO_STATUS_CALLBACK", "")
        self.default_country_code = os.getenv("DEFAULT_COUNTRY_CODE", "91")  # Default to India
        
        # Verify required Twilio credentials are set
        if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone_number]):
            logger.error("❌ Twilio credentials not properly configured in environment variables")
            logger.error(f"Account SID: {'Set' if self.twilio_account_sid else 'Missing'}")
            logger.error(f"Auth Token: {'Set' if self.twilio_auth_token else 'Missing'}")
            logger.error(f"SMS Number: {'Set' if self.twilio_phone_number else 'Missing'}")
            
            if not self.twilio_phone_number:
                logger.error("Neither TWILIO_SMS_NUMBER nor TWILIO_PHONE_NUMBER is set")
        
    async def send_verification_approval_sms(self, phone: str, name: str) -> bool:
        """
        Send SMS notification when user is approved by admin
        
        Args:
            phone: Recipient's phone number
            name: User's full name
            
        Returns:
            bool: True if message was sent successfully, False otherwise
        """
        message = (
            f"Hello {name}, your AgriHub account has been approved! "
            "You can now log in to your account. Welcome aboard!"
        )
        return await self.send_sms(phone, message)
        
    async def send_verification_rejection_sms(self, phone: str, name: str, reason: str) -> bool:
        """
        Send SMS notification when user is rejected by admin
        
        Args:
            phone: Recipient's phone number
            name: User's full name
            reason: Reason for rejection
            
        Returns:
            bool: True if message was sent successfully, False otherwise
        """
        message = (
            f"Hello {name}, your AgriHub registration was not approved. "
            f"Reason: {reason}. Please contact support for more details."
        )
        return await self.send_sms(phone, message)
        
    async def send_verification_approval_whatsapp(self, phone: str, name: str) -> bool:
        """
        Send WhatsApp notification when user is approved by admin
        
        Args:
            phone: Recipient's phone number with country code
            name: User's full name
            
        Returns:
            bool: True if message was sent successfully, False otherwise
        """
        message = (
            f"Hello {name}, your AgriHub account has been approved! 🎉\n\n"
            "You can now log in to your account and start using our platform. "
            "If you have any questions, feel free to contact our support team.\n\n"
            "Best regards,\nThe AgriHub Team"
        )
        return await self.send_whatsapp(phone, message)
        
    async def send_verification_rejection_whatsapp(self, phone: str, name: str, reason: str) -> bool:
        """
        Send WhatsApp notification when user is rejected by admin
        
        Args:
            phone: Recipient's phone number with country code
            name: User's full name
            reason: Reason for rejection
            
        Returns:
            bool: True if message was sent successfully, False otherwise
        """
        message = (
            f"Hello {name},\n\n"
            "We regret to inform you that your AgriHub registration was not approved.\n\n"
            f"*Reason:* {reason}\n\n"
            "If you believe this is a mistake or have any questions, "
            "please contact our support team for assistance.\n\n"
            "Best regards,\nThe AgriHub Team"
        )
        return await self.send_whatsapp(phone, message)
        
    async def send_sms(self, phone_number: str, message: str) -> bool:
        """
        Send an SMS message to the specified phone number using Twilio.
        
        Args:
            phone_number: The recipient's phone number in E.164 format
            message: The message content to send
            
        Returns:
            bool: True if the message was sent successfully, False otherwise
        """
        try:
            logger.info(f"📱 Preparing to send SMS to {phone_number}")
            
            # Verify Twilio credentials
            if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone_number]):
                error_msg = "❌ Twilio credentials not properly configured"
                logger.error(error_msg)
                logger.error(f"Account SID: {'Set' if self.twilio_account_sid else 'Missing'}")
                logger.error(f"Auth Token: {'Set' if self.twilio_auth_token else 'Missing'}")
                logger.error(f"Phone Number: {'Set' if self.twilio_phone_number else 'Missing'}")
                
                # Check if environment variables are loaded
                load_dotenv(override=True)  # Reload environment variables
                self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
                self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
                self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
                
                if all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone_number]):
                    logger.info("✅ Successfully loaded Twilio credentials from environment")
                else:
                    logger.error("❌ Still missing Twilio credentials after reloading environment")
                    return False
                
            from twilio.rest import Client
            from twilio.postgres_base.exceptions import TwilioRestException
            
            try:
                logger.info(f"🔑 Initializing Twilio client with SID: {self.twilio_account_sid[:5]}...")
                client = Client(self.twilio_account_sid, self.twilio_auth_token)
                
                # Format phone number using the helper method
                formatted_number = self.format_phone_number(phone_number)
                if not formatted_number:
                    logger.error(f"❌ Invalid phone number format: {phone_number}")
                    return False
                    
                logger.info(f"🔢 Formatted phone number: {formatted_number}")
                
                # Log the message that will be sent (without sensitive data)
                logger.info(f"💬 SMS content (first 50 chars): {message[:50]}...")
                
                # Prepare message parameters
                message_params = {
                    'body': message,
                    'from_': self.twilio_phone_number,
                    'to': formatted_number
                }
                
                # Add status callback if configured
                if self.twilio_status_callback:
                    message_params['status_callback'] = self.twilio_status_callback
                
                # Log SMS details before sending
                logger.info("\n" + "="*50)
                logger.info("📱 OUTGOING SMS NOTIFICATION")
                logger.info("="*50)
                logger.info(f"   🔢 Recipient: {formatted_number}")
                logger.info(f"   📝 Message Length: {len(message)} characters")
                logger.info(f"   📡 Sender ID: {self.twilio_phone_number}")
                
                if self.twilio_status_callback:
                    logger.info(f"   🔄 Status Callback: {self.twilio_status_callback}")
                
                # Send the SMS
                logger.info("\n🚀 Sending SMS...")
                sent_message = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: client.messages.create(**message_params)
                )
                
                # Log successful delivery details
                logger.info("\n✅ SMS SENT SUCCESSFULLY")
                logger.info("-"*50)
                logger.info(f"   📨 Message SID: {sent_message.sid}")
                logger.info(f"   📱 Recipient: {formatted_number}")
                logger.info(f"   📡 From: {sent_message.from_}")
                logger.info(f"   📊 Status: {getattr(sent_message, 'status', 'queued').upper()}")
                if hasattr(sent_message, 'date_created'):
                    logger.info(f"   ⏰ Sent at: {sent_message.date_created}")
                logger.info("="*50 + "\n")
                
                return True
                
            except TwilioRestException as e:
                logger.error(f"❌ Twilio API Error: {str(e)}")
                logger.error(f"   - Status: {e.status}")
                logger.error(f"   - Code: {e.code}")
                logger.error(f"   - More Info: {e.uri}")
                return False
                
            except Exception as e:
                logger.error(f"❌ Unexpected error while sending SMS: {str(e)}", exc_info=True)
                return False
            
        except Exception as e:
            logger.error(f"❌ Critical error in send_sms: {str(e)}", exc_info=True)
            return False
    
    async def send_otp_sms(self, phone_number: str, otp: str, expiry_minutes: int = 5) -> bool:
        """
        Send an OTP via SMS to the specified phone number.
        
        Args:
            phone_number: The recipient's phone number in E.164 format
            otp: The OTP code to send
            expiry_minutes: Number of minutes until the OTP expires
            
        Returns:
            bool: True if the OTP was sent successfully, False otherwise
        """
        message = (
            f"Your {self.app_name} verification code is: {otp}. "
            f"This code is valid for {expiry_minutes} minutes. "
            "Do not share this code with anyone."
        )
        return await self.send_sms(phone_number, message)

    async def send_password_reset_success_sms(self, phone_number: str, email: str) -> bool:
        """
        Send a password reset success notification via SMS.
        
        Args:
            phone_number: The recipient's phone number in E.164 format
            email: The user's email address
            
        Returns:
            bool: True if the notification was sent successfully, False otherwise
        """
        message = (
            f"Your {self.app_name} password has been successfully reset. "
            f"If you did not make this change, please contact support immediately. "
            f"For more information, visit: kplgenailakes.com"
        )
        return await self.send_sms(phone_number, message)

    async def send_welcome_sms(self, phone_number: str, email: str, user_id: str, user_type: str, password: str = None) -> bool:
        """
        Send a welcome SMS after successful registration.
        
        Args:
            phone_number: The recipient's phone number in E.164 format
            email: The user's email address
            user_id: The user's unique identifier
            user_type: Type of user (farmer, landowner, etc.)
            password: User's password (optional, for new registrations)
            
        Returns:
            bool: True if the notification was sent successfully, False otherwise
        """
        try:
            logger.info(f"🔔 Starting welcome SMS for {email} with phone {phone_number}")
            
            if not phone_number:
                logger.error("❌ No phone number provided for welcome SMS")
                return False
                
            # Clean and validate phone number
            phone_number = str(phone_number).strip()
            if not phone_number:
                logger.error("❌ Empty phone number provided")
                return False
                
            user_type_display = user_type.upper()
            
            # Format message with all required information
            message = (
                f"{self.app_name.upper()} - REGISTRATION SUCCESSFUL\n"
                f"----------------------------\n"
                f"Welcome! Your {user_type_display} account is ready.\n\n"
                f"📧 {email}\n"
                f"🆔 {user_id}\n"
            )
            
            if password:
                message += f"🔑 {password}\n\n"
            else:
                message += "\n"
                
            message += (
                f"🌐 Login: https://kpl.genailakes.com/landing\n"
                f"📞 Need help? Contact support"
            )
            
            # Format phone number to E.164 format
            formatted_number = self.format_phone_number(phone_number)
            if not formatted_number:
                logger.error(f"❌ Invalid phone number format: {phone_number}")
                return False
                
            logger.info(f"📱 Formatted phone number: {formatted_number}")
            logger.info(f"📨 Sending welcome SMS to {formatted_number}")
            logger.debug(f"💬 SMS content: {message}")
            
            # Send the SMS
            result = await self.send_sms(formatted_number, message)
            
            if result:
                logger.info(f"✅ Welcome SMS sent successfully to {formatted_number}")
            else:
                logger.error(f"❌ Failed to send welcome SMS to {formatted_number}")
                
            return result
            
        except Exception as e:
            logger.error(f"❌ Critical error in send_welcome_sms for {email}: {str(e)}", exc_info=True)
            return False
            
    def format_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Format phone number to E.164 format
        
        Args:
            phone_number: The phone number to format
            
        Returns:
            str: Formatted phone number in E.164 format or None if invalid
        """
        if not phone_number:
            return None
            
        try:
            # Remove all non-digit characters
            digits = ''.join(filter(str.isdigit, str(phone_number)))
            
            # If empty after cleaning, return None
            if not digits:
                return None
            
            # Handle numbers with country code but no +
            if len(digits) > 10 and digits.startswith(self.default_country_code):
                return f"+{digits}"
                
            # Handle local numbers (add default country code)
            if len(digits) == 10:
                return f"+{self.default_country_code}{digits}"
                
            # Already in E.164 format (starts with +)
            if phone_number.startswith('+') and len(digits) > 1:
                return f"+{digits}"
                
            # Handle numbers with 00 prefix
            if digits.startswith('00') and len(digits) > 2:
                return f"+{digits[2:]}"
                
            logger.warning(f"⚠️ Unrecognized phone number format: {phone_number}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error formatting phone number {phone_number}: {str(e)}")
            return None
        
    async def send_registration_notifications(
        self,
        user_data: Dict[str, Any],
        user_type: UserRole,
        password: Optional[str] = None
    ) -> Dict[str, bool]:
        """
        Send both email and SMS notifications after successful registration.
        
        Args:
            user_data: Dictionary containing user information
            user_type: Type of user (from UserRole enum)
            password: Plain text password (only for email, optional)
            
        Returns:
            Dict[str, bool]: Status of each notification type
        """
        results = {
            'email_sent': False,
            'sms_sent': False
        }
        
        email = user_data.get('email')
        phone_number = user_data.get('phone')
        full_name = user_data.get('full_name', 'User')
        user_id = user_data.get('custom_id', user_data.get('id', ''))
        
        # Send welcome email
        if email:
            try:
                from .email_service import EmailService  # Import here to avoid circular imports
                email_service = EmailService()
                await email_service.send_welcome_email(
                    to_email=email,
                    full_name=full_name,
                    user_type=user_type.value,
                    user_id=user_id,
                    password=password,
                    registration_id=user_id
                )
                results['email_sent'] = True
                logger.info(f"Welcome email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        
        # Send welcome SMS
        if phone_number:
            try:
                sms_sent = await self.send_welcome_sms(
                    phone_number=phone_number,
                    email=email,
                    user_id=user_id,
                    user_type=user_type.value
                )
                results['sms_sent'] = sms_sent
                if sms_sent:
                    logger.info(f"Welcome SMS sent to {phone_number}")
            except Exception as e:
                logger.error(f"Failed to send welcome SMS to {phone_number}: {str(e)}")
        
        return results

# Create a singleton instance
notification_service = NotificationService()