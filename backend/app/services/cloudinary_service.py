import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_file(file_path_or_bytes, folder: str = "teras-warga", upload_preset: str = None):
    preset = upload_preset or settings.CLOUDINARY_UPLOAD_PRESET or None
    params = {
        "folder": folder,
        "resource_type": "auto"
    }
    if preset:
        params["upload_preset"] = preset
        
    result = cloudinary.uploader.upload(file_path_or_bytes, **params)
    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "format": result.get("format"),
        "resource_type": result.get("resource_type")
    }

def get_sign_upload():
    timestamp = int(time.time())
    folder = "teras-warga"
    api_secret = settings.CLOUDINARY_API_SECRET or ""
    
    signature = cloudinary.utils.api_sign_request(
        {"timestamp": timestamp, "folder": folder},
        api_secret
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "folder": folder,
        "apiKey": settings.CLOUDINARY_API_KEY,
        "cloudName": settings.CLOUDINARY_CLOUD_NAME or "dwybhobnw",
        "uploadPreset": settings.CLOUDINARY_UPLOAD_PRESET or "",
    }
