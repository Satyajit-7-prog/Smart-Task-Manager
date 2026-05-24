import pytest
from app.auth import get_password_hash, verify_password

def test_password_hashing():
    password = "my-secure-password"
    hashed = get_password_hash(password)
    
    # Ensure it's not plain text
    assert hashed != password
    
    # Ensure verification works
    assert verify_password(password, hashed) is True
    
    # Ensure incorrect password verification fails
    assert verify_password("wrong-password", hashed) is False
