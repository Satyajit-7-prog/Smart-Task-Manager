import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_task_manager.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-ai-smart-task-manager")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Optional AI Enhancements
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # SMTP Configuration for Email-based OTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_SENDER: str = os.getenv("SMTP_SENDER", "")

settings = Settings()

