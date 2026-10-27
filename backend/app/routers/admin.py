import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth, firestore
import firebase_admin

logger = logging.getLogger("admin")
router = APIRouter(prefix="/api/admin", tags=["admin"])

class DeleteAccountRequest(BaseModel):
    email: str
    officialId: Optional[str] = None
    tenantId: Optional[str] = None

class CreateOrUpdateAccountRequest(BaseModel):
    email: str
    password: Optional[str] = ""
    name: Optional[str] = ""
    phone: Optional[str] = ""
    role: Optional[str] = "Admin"
    tenantId: Optional[str] = None
    officialId: Optional[str] = None
    houseId: Optional[str] = None

@router.post("/delete-account")
async def delete_account(req: DeleteAccountRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Alamat email tidak valid")

    clean_email = req.email.strip().lower()
    auth_user_deleted = False
    uid_deleted = None

    try:
        # 1. Delete from Firebase Authentication
        try:
            user = auth.get_user_by_email(clean_email)
            if user and user.uid:
                auth.delete_user(user.uid)
                auth_user_deleted = True
                uid_deleted = user.uid
                logger.info(f"✅ User {clean_email} (UID: {user.uid}) deleted from Firebase Auth.")
        except auth.UserNotFoundError:
            logger.info(f"ℹ️ User {clean_email} already removed from Firebase Auth.")
            auth_user_deleted = True
        except Exception as auth_err:
            logger.warning(f"⚠️ Firebase Auth delete warning for {clean_email}: {auth_err}")

        # 2. Unlink from Firestore
        try:
            db = firestore.client()
            if req.officialId and not any(k in req.officialId for k in ["-chairman", "-secretary", "-treasurer"]):
                try:
                    db.collection("officials").document(req.officialId).update({"email": ""})
                except Exception:
                    pass

            officials_query = db.collection("officials").where("email", "==", clean_email).stream()
            for doc in officials_query:
                doc.reference.update({"email": ""})

            # Remove from admins collection
            try:
                db.collection("admins").document(clean_email).delete()
            except Exception:
                pass

            # Audit log
            try:
                db.collection("auditLogs").add({
                    "action": "DELETE_OFFICIAL_ACCOUNT",
                    "title": "Hapus Akun Pengurus",
                    "description": f"Mencabut & menghapus akun login untuk {clean_email} ({req.tenantId or 'Semua RT'})",
                    "targetEmail": clean_email,
                    "tenantId": req.tenantId or "",
                    "officialId": req.officialId or "",
                    "performedBy": "Super Admin",
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
            except Exception:
                pass

        except Exception as db_err:
            logger.warning(f"⚠️ Firestore unlink warning: {db_err}")

        return {
            "success": True,
            "message": f"Akun login {clean_email} berhasil dihapus dari sistem.",
            "authUserDeleted": auth_user_deleted,
            "uid": uid_deleted
        }
    except Exception as e:
        logger.error(f"Error deleting account {clean_email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-or-update-account")
async def create_or_update_account(req: CreateOrUpdateAccountRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Alamat email tidak valid")

    clean_email = req.email.strip().lower()
    clean_password = (req.password or "").strip()
    clean_name = (req.name or "").strip()
    clean_phone = (req.phone or "").strip()
    assigned_role = req.role or "Admin"

    try:
        uid = None
        is_existing = False

        try:
            user = auth.get_user_by_email(clean_email)
            uid = user.uid
            is_existing = True
        except auth.UserNotFoundError:
            pass
        except Exception as e:
            logger.warning(f"getUserByEmail warning: {e}")

        if not is_existing:
            if not clean_password or len(clean_password) < 6:
                raise HTTPException(status_code=400, detail="Password sementara minimal 6 karakter untuk akun baru.")
        else:
            if clean_password and len(clean_password) < 6:
                raise HTTPException(status_code=400, detail="Password baru minimal 6 karakter.")

        try:
            if is_existing and uid:
                update_args = {}
                if clean_name:
                    update_args["display_name"] = clean_name
                if clean_password:
                    update_args["password"] = clean_password
                if update_args:
                    auth.update_user(uid, **update_args)
            else:
                user = auth.create_user(
                    email=clean_email,
                    password=clean_password,
                    display_name=clean_name or None
                )
                uid = user.uid
        except Exception as auth_err:
            logger.warning(f"Auth create/update warning: {auth_err}")

        # Firestore sync
        try:
            db = firestore.client()
            resolved_official_id = req.officialId

            if resolved_official_id and not any(k in resolved_official_id for k in ["-chairman", "-secretary", "-treasurer"]):
                db.collection("officials").document(resolved_official_id).set({
                    "email": clean_email,
                    "role": assigned_role,
                    "phone": clean_phone or None,
                    "name": clean_name or None,
                    "tenantId": req.tenantId
                }, merge=True)
            else:
                docs = list(db.collection("officials").where("tenantId", "==", req.tenantId).stream())
                norm_target = clean_name.lower().replace("bpk.", "").replace("bapak", "").replace("ibu", "").strip()
                target_doc_id = None
                for d in docs:
                    d_name = (d.to_dict().get("name") or "").lower().replace("bpk.", "").replace("bapak", "").replace("ibu", "").strip()
                    if d_name == norm_target:
                        target_doc_id = d.id
                        break
                if target_doc_id:
                    db.collection("officials").document(target_doc_id).update({
                        "email": clean_email,
                        "role": assigned_role,
                        "phone": clean_phone or None
                    })
                    resolved_official_id = target_doc_id
                else:
                    new_ref = db.collection("officials").add({
                        "name": clean_name,
                        "role": assigned_role,
                        "email": clean_email,
                        "phone": clean_phone,
                        "tenantId": req.tenantId,
                        "houseId": req.houseId or "Kantor RT",
                        "duties": [
                            "Pengelolaan data kependudukan dan sensus warga",
                            "Pencatatan dan verifikasi pembayaran iuran lingkungan",
                            "Penerbitan surat pengantar dan administrasi digital",
                            "Manajemen jadwal ronda dan keamanan lingkungan"
                        ]
                    })
                    resolved_official_id = new_ref[1].id

            if uid:
                try:
                    auth.set_custom_user_claims(uid, {
                        "admin": True,
                        "role": assigned_role,
                        "tenantId": req.tenantId
                    })
                except Exception:
                    pass

            db.collection("admins").document(clean_email).set({
                "email": clean_email,
                "uid": uid or "",
                "name": clean_name,
                "role": assigned_role,
                "tenantId": req.tenantId,
                "officialId": resolved_official_id,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }, merge=True)

        except Exception as db_err:
            logger.warning(f"Firestore provisioning warning: {db_err}")

        return {
            "success": True,
            "uid": uid,
            "email": clean_email,
            "officialId": resolved_official_id,
            "isExisting": is_existing,
            "message": f"Akun {clean_email} berhasil {'diperbarui' if is_existing else 'dibuat'}."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error provisioning account: {e}")
        raise HTTPException(status_code=500, detail=str(e))
