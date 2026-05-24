from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
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
