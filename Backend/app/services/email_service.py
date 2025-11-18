import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.sender_email = os.getenv('SENDER_EMAIL', self.smtp_username or 'noreply@agrihub.com')
        self.sender_name = os.getenv('SENDER_NAME', 'AgriHub Team')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        # Simulation flag for dev/test environments
        self.simulate = os.getenv('EMAIL_SIMULATE', 'true').lower() == 'true'
        # Track configuration state instead of raising to avoid startup crash
        self.is_configured = all([self.smtp_server, self.smtp_username, self.smtp_password])
        if not self.is_configured:
            print(
                "ℹ️ EmailService: SMTP configuration incomplete. "
                "Set SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD. "
                f"Simulation is {'ENABLED' if self.simulate else 'DISABLED'} (EMAIL_SIMULATE)."
            )

    def _get_title(self, gender: str = None) -> str:
        """
        Get the appropriate title (MR/MS) based on gender.
        
        Args:
            gender: Gender string - 'male', 'female', 'Male', 'Female', 'M', 'F', etc.
            
        Returns:
            str: 'MR' for male, 'MS' for female, 'MR/MS' if gender not provided or unknown
        """
        if not gender:
            return "MR/MS"
        
        gender_lower = str(gender).lower().strip()
        
        if gender_lower in ['male', 'm', 'man']:
            return "MR"
        elif gender_lower in ['female', 'f', 'woman']:
            return "MS"
        else:
            # Fallback for unknown gender values
            return "MR/MS"

    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Send an email using SMTP with enhanced error handling
        """
        if not all([to_email, subject, html_content]):
            print("❌ Missing required email parameters")
            return False

        # If SMTP not configured, honor simulation for development
        if not getattr(self, 'is_configured', False):
            if getattr(self, 'simulate', False):
                print(
                    "🧪 EmailService (simulated):", {"to": to_email, "subject": subject}
                )
                return True
            else:
                print("❌ EmailService: SMTP not configured and simulation disabled. Email not sent.")
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
                server.ehlo()  # Can be omitted
                if self.use_tls:
                    server.starttls(context=context)
                    server.ehlo()  # Secure the connection
                
                # Log in to server
                server.login(self.smtp_username, self.smtp_password)
                
                # Send email
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

    
    
    # -------------------------------------------------
    # 🌱 NEW 1️⃣ — AgriCopilot Invitation Email
    # -------------------------------------------------
    def send_agri_copilot_invitation_email(self, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        """
        Send an invitation email to AgriCopilot with registration link.
        """
        subject = "You're Invited to Join as an AgriCopilot - AgriHub 🌾"
        title = self._get_title(gender)
        
        # Use the registration_link parameter directly (already contains the full URL with token)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 25px;">
                <h2 style="color: #2e7d32;">🌱 Welcome to AgriHub!</h2>
                <p>Hello <strong>{title} {full_name}</strong>,</p>
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

    # -------------------------------------------------
    # Generic role invitation helper + role wrappers
    # -------------------------------------------------
    def _send_role_invitation(self, role: str, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        """
        Generic invitation email for different user roles (farmer, vendor, buyer, landowner).
        """
        role_display = role.capitalize()
        subject = f"You're Invited to Join as a {role_display} - AgriHub 🌾"
        title = self._get_title(gender)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 25px;">
                <h2 style="color: #2e7d32;">🌱 Welcome to AgriHub!</h2>
                <p>Hello <strong>{title} {full_name}</strong>,</p>
                <p>You have been invited to register as a <strong>{role_display}</strong> on AgriHub.</p>
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

    def send_farmer_invitation_email(self, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        return self._send_role_invitation('farmer', email, full_name, registration_link, gender)

    def send_vendor_invitation_email(self, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        return self._send_role_invitation('vendor', email, full_name, registration_link, gender)

    def send_buyer_invitation_email(self, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        return self._send_role_invitation('buyer', email, full_name, registration_link, gender)

    def send_landowner_invitation_email(self, email: str, full_name: str, registration_link: str, gender: str = None) -> bool:
        return self._send_role_invitation('landowner', email, full_name, registration_link, gender)

    # -------------------------------------------------
    # 🌿 NEW 2️⃣ — AgriCopilot Onboarding (Post-Approval)
    # -------------------------------------------------
    def send_agri_copilot_onboarding_email(self, email: str, full_name: str, custom_id: str, gender: str = None) -> bool:
        """
        Send onboarding email to approved AgriCopilot.
        """
        subject = "🎉 Welcome to AgriHub - Your AgriCopilot Account is Active!"
        title = self._get_title(gender)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 25px;">
                <h2 style="color: #2e7d32;">🎉 Congratulations, {title} {full_name}!</h2>
                <p>Your AgriCopilot account has been <strong>approved</strong> and activated.</p>
                <p>Your unique registration ID is: <strong>{custom_id}</strong></p>
                <p>You can now log in to the AgriHub platform, access your dashboard, and start collaborating with farmers and landowners.</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="https://kpl.genailakes.com/landing"
                       style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                        Go to AgriHub Dashboard
                    </a>
                </div>
                <p>We’re thrilled to have you as part of our growing AgriHub community 🌾</p>
                <p>Best regards,<br><strong>The AgriHub Team</strong></p>
                <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply.</p>
            </div>
        </body>
        </html>
        """

        return self._send_email(email, subject, html_content)

    # -------------------------------------------------
    # EXISTING METHODS (unchanged)
    # -------------------------------------------------
    def send_verification_approval_email(self, email: str, name: str, gender: str = None) -> bool:
        subject = "Your Account Has Been Approved"
        title = self._get_title(gender)
        html_content = f"""
        <html><body>
            <h2>Account Approved</h2>
            <p>Hello {title} {name},</p>
            <p>Your account has been approved by the administrator. You can now log in to your account.</p>
            <p>Thank you for joining our platform!</p>
            <p>Best regards,<br>The AgriHub Team</p>
        </body></html>
        """
        return self._send_email(email, subject, html_content)

    def send_verification_rejection_email(self, email: str, name: str, reason: str, gender: str = None) -> bool:
        subject = "Your Account Registration Status"
        title = self._get_title(gender)
        html_content = f"""
        <html><body>
            <h2>Account Registration Update</h2>
            <p>Hello {title} {name},</p>
            <p>We regret to inform you that your registration has been rejected:</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>If you believe this is a mistake, please contact our support team.</p>
            <p>Best regards,<br>The AgriHub Team</p>
        </body></html>
        """
        return self._send_email(email, subject, html_content)



    def send_verification_approval_email(self, email: str, name: str, gender: str = None) -> bool:
        """
        Send email notification when user is approved by admin
        
        Args:
            email: User's email address
            name: User's full name
            gender: User's gender for appropriate title
        """
        subject = "Your Account Has Been Approved"
        title = self._get_title(gender)
        
        html_content = f"""
        <html>
            <body>
                <h2>Account Approved</h2>
                <p>Hello {title} {name},</p>
                <p>Your account has been approved by the administrator. You can now log in to your account.</p>
                <p>Thank you for joining our platform!</p>
                <p>Best regards,<br>The AgriHub Team</p>
            </body>
        </html>
        """
        
        return self._send_email(email, subject, html_content)
        
    def send_verification_rejection_email(self, email: str, name: str, reason: str, gender: str = None) -> bool:
        """
        Send email notification when user is rejected by admin
        
        Args:
            email: User's email address
            name: User's full name
            reason: Reason for rejection
            gender: User's gender for appropriate title
        """
        subject = "Your Account Registration Status"
        title = self._get_title(gender)
        
        html_content = f"""
        <html>
            <body>
                <h2>Account Registration Update</h2>
                <p>Hello {title} {name},</p>
                <p>We regret to inform you that your account registration has been rejected for the following reason:</p>
                <p><strong>Reason:</strong> {reason}</p>
                <p>If you believe this is a mistake, please contact our support team.</p>
                <p>Best regards,<br>The AgriHub Team</p>
            </body>
        </html>
        """
        
        return self._send_email(email, subject, html_content)
        
    def send_welcome_email(self, to_email: str = None, full_name: str = None, 
                          user_type: str = None, registration_id: str = None, 
                          gender: str = None, **kwargs) -> bool:
        """
        Send a welcome email to the newly registered user
        
        Args:
            to_email: User's email address (required)
            full_name: User's full name (required)
            user_type: Type of user (required)
            registration_id: Registration ID (required)
            **kwargs: Additional user data (for backward compatibility)
        """
        # Handle backward compatibility with dictionary argument
        if to_email is None and 'user_data' in kwargs and isinstance(kwargs['user_data'], dict):
            user_data = kwargs['user_data']
            to_email = user_data.get('email')
            full_name = full_name or user_data.get('full_name')
            user_type = user_type or user_data.get('user_type')
            registration_id = registration_id or user_data.get('registration_id')
            gender = gender or user_data.get('gender')
        
        # Validate required parameters
        if not all([to_email, full_name, user_type, registration_id]):
            print("❌ Missing required parameters for welcome email")
            print(f"to_email: {to_email}, full_name: {full_name}, "
                  f"user_type: {user_type}, registration_id: {registration_id}")
            return False

        # Map user types to display names
        user_type_display = {
            'farmer': 'Farmer',
            'landowner': 'Landowner',
            'officer': 'Agriculture Officer',
            'vendor': 'Vendor',
            'buyer': 'Buyer'
        }.get(user_type.lower(), user_type.capitalize())

        subject = f"Welcome to AgriHub - Your {user_type_display} Account is Ready!"

        # Get password from kwargs if provided
        password = kwargs.get('password', 'your chosen password')
        title = self._get_title(gender)
        
        # Create email HTML content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
                <h1>Welcome to AgriHub!</h1>
            </div>
            <div style="padding: 20px;">
                <p>Dear {title} {full_name},</p>
                <p>Thank you for registering as a {user_type_display} on AgriHub. We're excited to have you on board!</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <p><strong>Your Login Credentials:</strong></p>
                    <p>Email: <strong>{to_email}</strong></p>
                    <p>Password: <strong>{password}</strong></p>
                    <p>User ID: <strong>{registration_id}</strong></p>
                    <p>Account Type: <strong>{user_type_display}</strong></p>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="https://kpl.genailakes.com/landing" 
                       style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; 
                              color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Go to AgriHub Portal
                    </a>
                </div>
                
                <p>Please keep your login credentials secure and do not share them with anyone.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>The AgriHub Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>Website: <a href="https://kpl.genailakes.com/landing" style="color: #4CAF50;">kpl.genailakes.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        return self._send_email(to_email, subject, html_content)


    def notify_admin_new_registration(self, admin_email: str, admin_name: str, new_user_name: str, 
                                    new_user_email: str, new_user_role: str, registration_date: str) -> bool:
        """
        Send notification to admin about a new user registration
        
        Args:
            admin_email: Admin's email address
            admin_name: Admin's full name
            new_user_name: New user's full name
            new_user_email: New user's email
            new_user_role: Role of the new user (e.g., 'farmer', 'landowner')
            registration_date: Date of registration in ISO format
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        subject = f"New {new_user_role.capitalize()} Registration Requires Approval"
        
        # Format the registration date for display
        from datetime import datetime
        try:
            reg_date = datetime.fromisoformat(registration_date.replace('Z', '+00:00'))
            formatted_date = reg_date.strftime('%B %d, %Y at %I:%M %p')
        except (ValueError, AttributeError):
            formatted_date = registration_date
            
        # Map user role to display name
        role_display = {
            'farmer': 'Farmer',
            'landowner': 'Landowner',
            'officer': 'Agriculture Officer',
            'vendor': 'Vendor',
            'buyer': 'Buyer',
            'admin': 'Administrator'
        }.get(new_user_role.lower(), new_user_role.capitalize())
        
        # Login URL for admin dashboard (replace with actual URL)
        login_url = "https://kpl.genailakes.com/admin/dashboard"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
                <h1>New User Registration</h1>
            </div>
            <div style="padding: 20px;">
                <p>Hello {admin_name},</p>
                <p>A new user has registered on AgriHub and is awaiting your approval.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <p><strong>New User Details:</strong></p>
                    <p><strong>Name:</strong> {new_user_name}</p>
                    <p><strong>Email:</strong> {new_user_email}</p>
                    <p><strong>Role:</strong> {role_display}</p>
                    <p><strong>Registered On:</strong> {formatted_date}</p>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{login_url}" 
                       style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; 
                              color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Review Registration
                    </a>
                </div>
                
                <p>Please review this registration at your earliest convenience to approve or reject the new account.</p>
                
                <p>Best regards,<br>The AgriHub Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>Website: <a href="https://kpl.genailakes.com/landing" style="color: #4CAF50;">kpl.genailakes.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """.format(
            admin_name=admin_name,
            new_user_name=new_user_name,
            new_user_email=new_user_email,
            role_display=role_display,
            formatted_date=formatted_date,
            login_url=login_url
        )
        
        return self._send_email(admin_email, subject, html_content)

    def send_password_reset_email(self, to_email: str, otp: str, expiry_minutes: int = 5) -> bool:
        """
        Send a password reset email with OTP
        
        Args:
            to_email: Recipient's email address
            otp: One-time password for password reset
            expiry_minutes: Number of minutes until the OTP expires (default: 5)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not to_email or not otp:
            print("❌ Missing required parameters for password reset email")
            return False

        subject = "AgriHub - Password Reset OTP"
        
        # Create email HTML content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
                <h1>Password Reset Request</h1>
            </div>
            <div style="padding: 20px;">
                <p>Hello,</p>
                <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 15px 30px; background-color: #f5f5f5; 
                                border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                        {otp}
                    </div>
                </div>
                
                <p>This OTP is valid for {expiry_minutes} minutes.</p>
                <p>If you didn't request this, please ignore this email or contact support if you have any concerns.</p>
                
                <p>Best regards,<br>The AgriHub Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return self._send_email(to_email, subject, html_content)


    # -------------------------------------------------
    # ✅ Approval Email
    # -------------------------------------------------
    async def send_approval_email(self, to_email: str, full_name: str, user_type: str, gender: str = None) -> bool:
        """
        Send approval confirmation email
        """
        subject = f"🎉 Your {user_type.replace('_', ' ').title()} Application Approved - AgriHub"
        title = self._get_title(gender)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Application Approved!</h1>
                </div>
                <div class="content">
                    <p>Dear {title} {full_name},</p>
                    
                    <p>Congratulations! Your application to join AgriHub as a <strong>{user_type.replace('_', ' ').title()}</strong> has been approved.</p>
                    
                    <p>You can now log in to your account and start using AgriHub platform:</p>
                    
                    <a href="{settings.FRONTEND_URL or 'http://localhost:3000'}/admin" class="button">Login to AgriHub</a>
                    
                    <p>Welcome to the AgriHub family! We're excited to have you onboard.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Explore the platform features</li>
                        <li>Connect with the community</li>
                    </ul>
                    
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    
                    <p>Best regards,<br>The AgriHub Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 AgriHub. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)


    # -------------------------------------------------
    # ❌ Rejection Email
    # -------------------------------------------------
    async def send_rejection_email(self, to_email: str, full_name: str, user_type: str, reason: str = "", gender: str = None) -> bool:
        """
        Send rejection notification email
        """
        subject = f"Application Status Update - AgriHub"
        title = self._get_title(gender)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .reason-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Application Status</h1>
                </div>
                <div class="content">
                    <p>Dear {title} {full_name},</p>
                    
                    <p>Thank you for your interest in joining AgriHub as a <strong>{user_type.replace('_', ' ').title()}</strong>.</p>
                    
                    <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
                    
                    {f'<div class="reason-box"><strong>Reason:</strong><br>{reason}</div>' if reason else ''}
                    
                    <p>You are welcome to reapply in the future. We encourage you to:</p>
                    <ul>
                        <li>Review the application requirements</li>
                        <li>Ensure all information is accurate and complete</li>
                        <li>Provide all necessary documentation</li>
                    </ul>
                    
                    <p>If you have any questions or would like more information, please contact our support team.</p>
                    
                    <a href="{settings.FRONTEND_URL or 'http://localhost:3000'}/contact" class="button">Contact Support</a>
                    
                    <p>Thank you for your understanding.</p>
                    
                    <p>Best regards,<br>The AgriHub Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 AgriHub. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)


# Create singleton instance
email_service = EmailService()

