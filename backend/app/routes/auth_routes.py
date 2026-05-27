from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

from app import models, schemas, auth
from app.database import get_db
from app.email_utils import send_otp_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
    
    # Generate 6-digit OTP
    otp = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Save or update in database
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.email == request.email).first()
    if db_otp:
        db_otp.otp = otp
        db_otp.expires_at = expires_at
        db_otp.attempts = 0
        db_otp.verified = False
        db_otp.created_at = datetime.utcnow()
    else:
        db_otp = models.OTPVerification(
            email=request.email,
            otp=otp,
            expires_at=expires_at,
            attempts=0,
            verified=False
        )
        db.add(db_otp)
    
    db.commit()
    
    # Send email
    try:
        send_otp_email(request.email, otp)
    except Exception as e:
        logger.warning(f"SMTP failed to send registration email to {request.email}. Fallback OTP printed to console. Error: {e}")
        print(f"\n========================================\n[SMTP FALLBACK] OTP for {request.email} is: {otp}\n========================================\n")
        
    return {"message": "OTP verification code sent successfully. (If email delivery fails, check backend server logs for developer OTP fallback)"}

@router.post("/register/verify-otp")
def verify_otp(request: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.email == request.email).first()
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP request found for this email. Please request an OTP first."
        )
    
    # Check if expired
    if db_otp.expires_at < datetime.utcnow():
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
        
    # Check attempts
    if db_otp.attempts >= 5:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many invalid OTP verification attempts. Please request a new OTP."
        )
        
    # Verify code
    if db_otp.otp != request.otp:
        db_otp.attempts += 1
        db.commit()
        attempts_left = 5 - db_otp.attempts
        if attempts_left <= 0:
            db.delete(db_otp)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid OTP verification attempts. Please request a new OTP."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. {attempts_left} attempts remaining."
        )
        
    # OTP is correct! Mark as verified and extend expiration
    db_otp.verified = True
    db_otp.expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    return {"message": "Email verified successfully."}

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email is verified
    db_otp = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == user_in.email,
        models.OTPVerification.verified == True
    ).first()
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification is required. Please verify your email first."
        )
    
    # Check if verification expired
    if db_otp.expires_at < datetime.utcnow():
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification session has expired. Please verify again."
        )
        
    # OTP is verified! Delete it from DB
    db.delete(db_otp)
    db.commit()

    # Check if user already exists (extra safety check)
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
    
    # Hash password and create user
    hashed_pw = auth.get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed default categories for instant high-quality UX
    default_categories = [
        {"name": "Coding", "color": "#06b6d4"},
        {"name": "Work", "color": "#a855f7"},
        {"name": "Studies", "color": "#3b82f6"},
        {"name": "Health", "color": "#10b981"},
        {"name": "Finance", "color": "#f59e0b"},
        {"name": "Personal", "color": "#ec4899"}
    ]
    for cat in default_categories:
        db_cat = models.Category(
            name=cat["name"],
            color=cat["color"],
            user_id=user.id
        )
        db.add(db_cat)
    db.commit()
    
    # Create registration activity log
    log = models.ActivityLog(user_id=user.id, action="registered_account")
    db.add(log)
    db.commit()

    return user


@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Standard JSON API Login"""
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    # Log action
    log = models.ActivityLog(user_id=user.id, action="logged_in")
    db.add(log)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-swagger", response_model=schemas.Token)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 Form Login for Swagger Interactive Documentation"""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.post("/password-reset/send-otp")
def password_reset_send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )
    
    # Generate 6-digit OTP
    otp = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Save or update in database
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.email == request.email).first()
    if db_otp:
        db_otp.otp = otp
        db_otp.expires_at = expires_at
        db_otp.attempts = 0
        db_otp.verified = False
        db_otp.created_at = datetime.utcnow()
    else:
        db_otp = models.OTPVerification(
            email=request.email,
            otp=otp,
            expires_at=expires_at,
            attempts=0,
            verified=False
        )
        db.add(db_otp)
    
    db.commit()
    
    # Send reset email
    try:
        send_password_reset_email(request.email, otp)
    except Exception as e:
        logger.warning(f"SMTP failed to send reset email to {request.email}. Fallback OTP printed to console. Error: {e}")
        print(f"\n========================================\n[SMTP RESET FALLBACK] OTP for {request.email} is: {otp}\n========================================\n")
        
    return {"message": "Verification code sent to your email. (If email delivery fails, check backend server logs for developer OTP fallback)"}

@router.post("/password-reset/verify-otp")
def password_reset_verify_otp(request: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPVerification).filter(models.OTPVerification.email == request.email).first()
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP request found for this email. Please request a code first."
        )
    
    # Check if expired
    if db_otp.expires_at < datetime.utcnow():
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
        
    # Check attempts
    if db_otp.attempts >= 5:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many invalid OTP verification attempts. Please request a new code."
        )
        
    # Verify code
    if db_otp.otp != request.otp:
        db_otp.attempts += 1
        db.commit()
        attempts_left = 5 - db_otp.attempts
        if attempts_left <= 0:
            db.delete(db_otp)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many invalid OTP verification attempts. Please request a new code."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {attempts_left} attempts remaining."
        )
        
    # OTP is correct! Mark as verified and extend expiration
    db_otp.verified = True
    db_otp.expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    return {"message": "Verification successful. You can now reset your password."}

@router.post("/password-reset/confirm")
def password_reset_confirm(request: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    # Check if email is verified
    db_otp = db.query(models.OTPVerification).filter(
        models.OTPVerification.email == request.email,
        models.OTPVerification.verified == True
    ).first()
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification is required. Please verify your email first."
        )
    
    # Check if verification expired
    if db_otp.expires_at < datetime.utcnow():
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification session has expired. Please verify again."
        )
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
        
    # Validated! Hash the new password and update
    user.hashed_password = auth.get_password_hash(request.new_password)
    
    # Delete the verification record
    db.delete(db_otp)
    db.commit()
    
    # Create activity log
    log = models.ActivityLog(user_id=user.id, action="reset_password")
    db.add(log)
    db.commit()

    return {"message": "Password reset completed successfully. Please log in with your new password."}

