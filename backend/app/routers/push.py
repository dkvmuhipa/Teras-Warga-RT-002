import logging
from typing import Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import messaging
from app.services.firebase import cleanup_defunct_tokens, get_all_fcm_tokens, is_fcm_configured

logger = logging.getLogger("push")
router = APIRouter(prefix="/api/push", tags=["push"])

class PushSendRequest(BaseModel):
    tokens: list[str]
    notification: Optional[dict[str, Any]] = None
    data: Optional[dict[str, str]] = None

class PushBroadcastRequest(BaseModel):
    notification: Optional[dict[str, Any]] = None
    data: Optional[dict[str, str]] = None

async def _send_multicast(tokens: list[str], notification_dict: Optional[dict[str, Any]], data_dict: Optional[dict[str, str]]):
    fcm_notification = None
    if notification_dict:
        fcm_notification = messaging.Notification(
            title=notification_dict.get("title"),
            body=notification_dict.get("body"),
            image=notification_dict.get("image")
        )
    safe_data = {str(k): str(v) for k, v in (data_dict or {}).items()}

    total_success = 0
    total_failure = 0
    tokens_to_cleanup = []

    # Batch in chunks of 500 (FCM multicast maximum)
    chunk_size = 500
    for i in range(0, len(tokens), chunk_size):
        chunk = tokens[i:i + chunk_size]
        message = messaging.MulticastMessage(
            tokens=chunk,
            notification=fcm_notification,
            data=safe_data
        )
        try:
            response = messaging.send_each_for_multicast(message)
            total_success += response.success_count
            total_failure += response.failure_count

            if response.failure_count > 0:
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
                            tokens_to_cleanup.append(chunk[idx])
        except Exception as e:
            err_str = str(e)
            logger.error(f"Error in multicast batch: {e}")
            if "credentials" in err_str.lower() or "auth" in err_str.lower() or "defaultcredential" in err_str.lower():
                return {
                    "success": False,
                    "warning": f"FCM credential error: {err_str}",
                    "reason": "credentials_missing",
                    "response": {"successCount": total_success, "failureCount": len(chunk)}
                }
            raise HTTPException(status_code=500, detail=str(e))

    if tokens_to_cleanup:
        logger.info(f"Attempting to auto-clean up {len(tokens_to_cleanup)} defunct FCM tokens...")
        await cleanup_defunct_tokens(tokens_to_cleanup)

    return {
        "success": True,
        "response": {
            "successCount": total_success,
            "failureCount": total_failure,
        }
    }

@router.get("/status")
async def get_push_status():
    configured = is_fcm_configured()
    token_count = len(get_all_fcm_tokens()) if configured else 0
    return {
        "configured": configured,
        "tokenCount": token_count,
        "mode": "service_account" if configured else "unconfigured_dev"
    }

@router.post("/broadcast")
async def handle_push_broadcast(payload: PushBroadcastRequest):
    if not is_fcm_configured():
        logger.warning("FCM broadcast skipped: Service Account credentials not configured.")
        return {
            "success": False,
            "warning": "FCM credentials not configured on server. Push notification dispatch skipped.",
            "reason": "credentials_missing",
            "response": {"successCount": 0, "failureCount": 0}
        }

    tokens = get_all_fcm_tokens()
    if not tokens:
        logger.info("No registered FCM tokens found to broadcast to.")
        return {
            "success": True,
            "message": "No registered devices found.",
            "response": {"successCount": 0, "failureCount": 0}
        }

    return await _send_multicast(tokens, payload.notification, payload.data)

@router.post("/send")
async def handle_push_send(payload: PushSendRequest):
    if not payload.tokens:
        raise HTTPException(status_code=400, detail="No tokens provided")

    if not is_fcm_configured():
        logger.warning("FCM send skipped: Service Account credentials not configured.")
        return {
            "success": False,
            "warning": "FCM credentials not configured on server. Push notification dispatch skipped.",
            "reason": "credentials_missing",
            "response": {"successCount": 0, "failureCount": 0}
        }

    return await _send_multicast(payload.tokens, payload.notification, payload.data)
