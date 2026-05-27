import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime

from app.main import app
from app.database import Base, get_db
from app import models

# Use a temporary SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
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

def test_send_otp_success(client, db_session):
    # Test sending OTP
    response = client.post("/api/auth/register/send-otp", json={"email": "test@example.com"})
    assert response.status_code == 200
    assert response.json()["message"] == "OTP verification code sent successfully."
    
    # Check DB record
    otp_record = db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first()
    assert otp_record is not None
    assert len(otp_record.otp) == 6
    assert otp_record.attempts == 0

def test_send_otp_already_registered(client, db_session):
    # Create user
    user = models.User(email="test@example.com", hashed_password="hashed_password", full_name="Test User")
    db_session.add(user)
    db_session.commit()
    
    # Try sending OTP to registered email
    response = client.post("/api/auth/register/send-otp", json={"email": "test@example.com"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_register_with_otp_success(client, db_session):
    # 1. Send OTP
    client.post("/api/auth/register/send-otp", json={"email": "test@example.com"})
    otp_record = db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first()
    otp_code = otp_record.otp
    
    # Check that it's not verified initially
    assert otp_record.verified is False

    # 2. Verify OTP
    verify_response = client.post("/api/auth/register/verify-otp", json={
        "email": "test@example.com",
        "otp": otp_code
    })
    assert verify_response.status_code == 200
    assert verify_response.json()["message"] == "Email verified successfully."
    
    # Check that verified is True in DB
    db_session.refresh(otp_record)
    assert otp_record.verified is True

    # 3. Register with user details
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "mypassword123",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    
    # 4. Check DB - OTP should be deleted, User should be created
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first() is None
    assert db_session.query(models.User).filter(models.User.email == "test@example.com").first() is not None

def test_register_otp_expired(client, db_session):
    # 1. Send OTP
    client.post("/api/auth/register/send-otp", json={"email": "test@example.com"})
    otp_record = db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first()
    
    # Force expire OTP
    otp_record.expires_at = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
    db_session.commit()
    
    # 2. Verify OTP should fail since it's expired
    response = client.post("/api/auth/register/verify-otp", json={
        "email": "test@example.com",
        "otp": otp_record.otp
    })
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]
    
    # Check DB - OTP should be deleted
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first() is None

def test_register_invalid_otp_attempts(client, db_session):
    # 1. Send OTP
    client.post("/api/auth/register/send-otp", json={"email": "test@example.com"})
    otp_record = db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first()
    
    # 2. Attempt verification with wrong OTP
    for i in range(4):
        response = client.post("/api/auth/register/verify-otp", json={
            "email": "test@example.com",
            "otp": "000000"
        })
        assert response.status_code == 400
        assert "Invalid OTP code" in response.json()["detail"]
        assert f"{4 - i} attempts remaining" in response.json()["detail"]
        
    # Verify OTP still exists
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first() is not None
    
    # 3. 5th wrong attempt should delete the OTP
    response = client.post("/api/auth/register/verify-otp", json={
        "email": "test@example.com",
        "otp": "000000"
    })
    assert response.status_code == 400
    assert "Too many invalid OTP verification attempts" in response.json()["detail"]
    
    # Verify OTP is deleted
    assert db_session.query(models.OTPVerification).filter(models.OTPVerification.email == "test@example.com").first() is None

def test_register_without_verifying_fails(client, db_session):
    # Try to register without sending/verifying OTP
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "mypassword123",
        "full_name": "Test User"
    })
    assert response.status_code == 400
    assert "Email verification is required" in response.json()["detail"]
