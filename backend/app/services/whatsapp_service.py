import logging
import httpx
from app.config import settings

logger = logging.getLogger("whatsapp")

async def send_whatsapp_message(target: str, message: str):
    api_key = settings.WHATSAPP_GATEWAY_TOKEN
    if not api_key:
        raise ValueError("WhatsApp Gateway Token not configured")

    targets = [t.strip() for t in target.split(",") if t.strip()]
    results = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for phone in targets:
            try:
                resp = await client.post(
                    "https://api.sidobe.com/v1/send-message",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "phone": phone,
                        "message": message,
                    }
                )
                try:
                    result_data = resp.json()
                except Exception:
                    result_data = {"text": resp.text, "status_code": resp.status_code}
                results.append({"target": phone, "result": result_data})
            except Exception as e:
                logger.error(f"Error sending WhatsApp to {phone}: {e}")
                results.append({"target": phone, "error": str(e)})

    return {"success": True, "results": results}

async def get_whatsapp_groups():
    api_key = settings.WHATSAPP_GATEWAY_TOKEN
    if not api_key:
        raise ValueError("WhatsApp Gateway Token not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://api.sidobe.com/v1/groups",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
        )
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 404:
            return {
                "error": "Endpoint API tidak ditemukan (404). Silakan hubungi pengembang.",
                "success": False
            }
        else:
            return {
                "error": f"Gateway mengembalikan status {resp.status_code}",
                "success": False
            }
