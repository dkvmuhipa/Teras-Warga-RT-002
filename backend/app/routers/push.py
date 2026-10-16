import logging
from typing import Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import messaging
from app.services.firebase import cleanup_defunct_tokens

logger = logging.getLogger("push")
router = APIRouter(prefix="/api/push", tags=["push"])

class PushSendRequest(BaseModel):
    tokens: list[str]
    notification: Optional[dict[str, Any]] = None
    data: Optional[dict[str, str]] = None

@router.post("/send")
async def handle_push_send(payload: PushSendRequest):
    if not payload.tokens:
        raise HTTPException(status_code=400, detail="No tokens provided")

    try:
        # Build FCM notification
        fcm_notification = None
        if payload.notification:
            fcm_notification = messaging.Notification(
                title=payload.notification.get("title"),
                body=payload.notification.get("body"),
                image=payload.notification.get("image")
            )
            
        # Ensure all data values are strings
        safe_data = {str(k): str(v) for k, v in (payload.data or {}).items()}

        message = messaging.MulticastMessage(
            tokens=payload.tokens,
            notification=fcm_notification,
            data=safe_data
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(f"Successfully sent {response.success_count} messages; {response.failure_count} errors.")

        # Handle failed tokens
        if response.failure_count > 0:
            tokens_to_cleanup = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    err = resp.exception
                    err_code = getattr(err, "code", "")
                    err_msg = str(err)
                    
                    if (
                        err_code in ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]
                        or "not registered" in err_msg.lower()
                        or "unregistered" in err_msg.lower()
                        or "invalid-registration-token" in err_msg.lower()
                    ):
                        tokens_to_cleanup.append(payload.tokens[idx])

            if tokens_to_cleanup:
                logger.info(f"Attempting to auto-clean up {len(tokens_to_cleanup)} defunct FCM tokens...")
                await cleanup_defunct_tokens(tokens_to_cleanup)

        return {
            "success": True,
            "response": {
                "successCount": response.success_count,
                "failureCount": response.failure_count,
            }
        }
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))
