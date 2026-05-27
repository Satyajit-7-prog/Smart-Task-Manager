import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime

from app.main import app
from app.database import Base, get_db
from app import models, auth

# Use a temporary SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reset_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_password_reset_success(client, db_session):
    # 1. Register a user first
    hashed_pw = auth.get_password_hash("old_secure_password")
    user = models.User(email="user@example.com", hashed_password=hashed_pw, full_name="User Name")
    db_session.add(user)
    db_session.commit()
    
    # Verify login with old password works
    login_res = client.post("/api/auth/login", json={"email": "user@example.com", "password": "old_secure_password"})
    assert login_res.status_code == 200

    # 2. Request Password Reset OTP
    send_res = client.post("/api/auth/password-reset/send-otp", json={"email": "user@example.com"})
    assert send_res.status_code == 200
    assert send_res.json()["message"] == "Verification code sent to your email."
    
    otp_record = db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "user@example.com").first()
    assert otp_record is not None
    assert otp_record.verified is False
    
    # 3. Verify OTP
    verify_res = client.post("/api/auth/password-reset/verify-otp", json={
        "email": "user@example.com",
        "otp": otp_record.otp
    })
    assert verify_res.status_code == 200
    
    db_session.refresh(otp_record)
    assert otp_record.verified is True

    # 4. Confirm Password Reset
    confirm_res = client.post("/api/auth/password-reset/confirm", json={
        "email": "user@example.com",
        "new_password": "new_super_secret_password"
    })
    assert confirm_res.status_code == 200
    assert "completed successfully" in confirm_res.json()["message"]
    
    # 5. Verify database changes
    # OTP record should be deleted
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "user@example.com").first() is None
    
    # Old password login should fail
    login_old_res = client.post("/api/auth/login", json={"email": "user@example.com", "password": "old_secure_password"})
    assert login_old_res.status_code == 401
    
    # New password login should succeed
    login_new_res = client.post("/api/auth/login", json={"email": "user@example.com", "password": "new_super_secret_password"})
    assert login_new_res.status_code == 200

def test_password_reset_user_not_found(client, db_session):
    # Try sending OTP for non-existent user
    response = client.post("/api/auth/password-reset/send-otp", json={"email": "doesnotexist@example.com"})
    assert response.status_code == 404
    assert "No account associated" in response.json()["detail"]

def test_password_reset_invalid_otp(client, db_session):
    # Create user
    hashed_pw = auth.get_password_hash("old_password")
    user = models.User(email="user@example.com", hashed_password=hashed_pw, full_name="User Name")
    db_session.add(user)
    db_session.commit()
    
    # Request OTP
    client.post("/api/auth/password-reset/send-otp", json={"email": "user@example.com"})
    
    # Attempt verification with wrong OTP
    for i in range(4):
        response = client.post("/api/auth/password-reset/verify-otp", json={
            "email": "user@example.com",
            "otp": "000000"
        })
        assert response.status_code == 400
        assert f"{4 - i} attempts remaining" in response.json()["detail"]
        
    # 5th wrong attempt should delete the OTP
    response = client.post("/api/auth/password-reset/verify-otp", json={
        "email": "user@example.com",
        "otp": "000000"
    })
    assert response.status_code == 400
    assert "Too many invalid OTP verification attempts" in response.json()["detail"]
    
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "user@example.com").first() is None

def test_password_reset_without_verifying_fails(client, db_session):
    # Create user
    hashed_pw = auth.get_password_hash("old_password")
    user = models.User(email="user@example.com", hashed_password=hashed_pw, full_name="User Name")
    db_session.add(user)
    db_session.commit()
    
    # Try to confirm reset without sending/verifying OTP
    response = client.post("/api/auth/password-reset/confirm", json={
        "email": "user@example.com",
        "new_password": "new_password_123"
    })
    assert response.status_code == 400
    assert "Verification is required" in response.json()["detail"]
