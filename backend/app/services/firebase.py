import json
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from app.config import settings

logger = logging.getLogger("firebase")

def init_firebase():
    if not firebase_admin._apps:
        try:
            # 1. Try env variable JSON string
            if settings.FIREBASE_SERVICE_ACCOUNT:
                try:
                    cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
                    logger.info("Firebase Admin initialized with Service Account (Env Var)")
                    return
                except Exception as e:
                    logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: {e}")

            # 2. Try local service account file in root or backend
            root_dir = Path(__file__).resolve().parent.parent.parent.parent
            local_paths = [
                root_dir / "firebase-service-account.json",
                Path(__file__).resolve().parent.parent.parent / "firebase-service-account.json"
            ]
            for lp in local_paths:
                if lp.exists():
                    try:
                        cred = credentials.Certificate(str(lp))
                        firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
                        logger.info("Firebase Admin initialized with Service Account (Local File)")
                        return
                    except Exception as e:
                        logger.error(f"Failed to read/parse {lp}: {e}")

            # 3. Fallback to default
            logger.warning("No Service Account found. Using default project credentials.")
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
        except Exception as e:
            logger.error(f"Firebase Admin initialization error: {e}")

async def cleanup_defunct_tokens(tokens: list[str]):
    """Clean up invalid/unregistered FCM tokens from Firestore."""
    if not tokens:
        return
    try:
        db = firestore.client()
        fcm_ref = db.collection("fcmTokens")
        for token in tokens:
            query = fcm_ref.where("token", "==", token).stream()
            for doc in query:
                doc.reference.delete()
                logger.info(f"Deleted defunct FCM token document ending with ...{token[-15:] if len(token) > 15 else token}")
    except Exception as e:
        logger.warning(f"Defunct token cleanup non-blocking error: {e}")
