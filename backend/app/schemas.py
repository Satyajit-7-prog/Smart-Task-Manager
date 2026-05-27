from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class OTPRequest(BaseModel):
    email: EmailStr

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    color: str = "#06b6d4"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "Medium"  # "High", "Medium", "Low"
    category_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # "Pending", "Completed"
    category_id: Optional[int] = None
    delay_count: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    status: str
    completed_at: Optional[datetime] = None
    ai_predicted_priority: bool
    delay_count: int
    user_id: int
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# --- Activity Log Schemas ---
class ActivityLogResponse(BaseModel):
    id: int
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- NLP Input Schemas ---
class NLPParseRequest(BaseModel):
    text: str

class NLPParseResponse(BaseModel):
    title: str
    due_date: Optional[datetime] = None
    priority: str
    category_name: Optional[str] = None
    confidence: float
    explanation: str


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)

