from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.postgre_schema import get_db
import schemas
from .otp_service import OTPService
from services import UserService
 
router = APIRouter(prefix="/auth", tags=["OTP"])   

@router.post("/send-otp", response_model=schemas.OtpResponse)
async def send_otp(request: schemas.SendOtpRequest, db: Session = Depends(get_db)):
    """
    Send OTP to the provided email for password reset.
    """
    # Check if user exists
    user = UserService.get_user_by_email(db, request.email)
    if not user:
        # For security, don't reveal if the email exists
        return {"message": "If the email exists, an OTP has been sent.", "success": True}
    
    # Generate and store OTP
    otp = OTPService.generate_otp()
    OTPService.store_otp(request.email, otp)
    
    # Send OTP via email
    email_sent = await OTPService.send_email_otp(request.email, otp)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again later."
        )
    
    return {"message": "OTP has been sent to your email.", "success": True}

@router.post("/verify-otp", response_model=schemas.OtpResponse)
async def verify_otp(request: schemas.VerifyOtpRequest):
    """
    Verify the provided OTP for password reset.
    """
    is_valid = OTPService.verify_otp(request.email, request.otp)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please request a new one."
        )
    
    return {"message": "OTP verified successfully.", "success": True}
