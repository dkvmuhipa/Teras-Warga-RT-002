from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.whatsapp_service import send_whatsapp_message, get_whatsapp_groups

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

class WhatsAppSendRequest(BaseModel):
    target: str
    message: str

@router.post("/send")
async def handle_whatsapp_send(payload: WhatsAppSendRequest):
    try:
        if not payload.target or not payload.message:
            raise HTTPException(status_code=400, detail="Target and message are required")
        return await send_whatsapp_message(payload.target, payload.message)
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups")
async def handle_whatsapp_groups():
    try:
        return await get_whatsapp_groups()
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
