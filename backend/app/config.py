import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Search for .env in current dir, backend/, or parent project root
root_dir = Path(__file__).resolve().parent.parent.parent
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    root_dir / ".env",
]
for ep in env_paths:
    if ep.exists():
        load_dotenv(ep)
        break

class Settings(BaseSettings):
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    CLOUDINARY_UPLOAD_PRESET: str = os.getenv("CLOUDINARY_UPLOAD_PRESET", "")
    
    # WhatsApp Gateway
    WHATSAPP_GATEWAY_TOKEN: str = os.getenv("WHATSAPP_GATEWAY_TOKEN", "")
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT: str = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "teras-warga")

settings = Settings()
