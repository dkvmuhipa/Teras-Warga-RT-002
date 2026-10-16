from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.cloudinary_service import upload_file, get_sign_upload

router = APIRouter(prefix="/api", tags=["media"])

@router.post("/upload")
async def handle_upload(
    file: Optional[UploadFile] = File(None),
    folder: Optional[str] = Form("teras-warga"),
    upload_preset: Optional[str] = Form(None)
):
    try:
        if file is not None:
            contents = await file.read()
            result = upload_file(contents, folder=folder or "teras-warga", upload_preset=upload_preset)
            return result
        else:
            raise HTTPException(status_code=400, detail="No file uploaded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sign-upload")
async def handle_sign_upload():
    try:
        return get_sign_upload()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
