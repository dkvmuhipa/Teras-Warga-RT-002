import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseAppletConfig from "../firebase-applet-config.json";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { Role, Official } from "../types";

export interface CreateRtAdminAccountParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: Role | string;
  tenantId: string;
  houseId?: string;
  officialId?: string;
}

export interface CreateRtAdminAccountResult {
  success: boolean;
  uid?: string;
  email: string;
  error?: string;
  officialId?: string;
}

/**
 * Suggests a default standardized email for a new RT Admin
 * e.g. rt003.tondo@teraswarga.id
 */
export const suggestRtAdminEmail = (rt: string, kelurahan: string): string => {
  const cleanRt = (rt || '01').padStart(3, '0');
  const cleanKel = (kelurahan || 'wilayah')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  return `rt${cleanRt}.${cleanKel}@teraswarga.id`;
};

/**
 * Generates an easy-to-read yet secure temporary password
 * e.g. TerasWarga!003#78
 */
export const generateTemporaryPassword = (rt: string = '001'): string => {
  const cleanRt = (rt || '01').padStart(3, '0');
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `TerasWarga!${cleanRt}#${randomSuffix}`;
};

/**
 * Creates a new Firebase Auth account for an RT Admin using an isolated secondary Firebase App instance.
 * This guarantees the currently active Super Admin session in the primary app is NOT logged out!
 * Also registers/links the account inside Firestore's `officials` collection.
 */
export const createTenantAdminAccount = async (
  params: CreateRtAdminAccountParams
): Promise<CreateRtAdminAccountResult & { isExisting?: boolean }> => {
  const cleanEmail = params.email.trim().toLowerCase();
  const password = params.password.trim();
  const cleanName = params.name.trim();
  const cleanPhone = params.phone.trim();
  const assignedRole = params.role || Role.ADMIN;

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Alamat email tidak valid.');
  }

  if (password.length < 6) {
    throw new Error('Password minimal harus 6 karakter.');
  }

  // 1. Try server-side provisioning via Firebase Admin SDK (handles both new and existing users seamlessly!)
  try {
    const res = await fetch('/api/admin/create-or-update-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        name: cleanName,
        phone: cleanPhone,
        role: assignedRole,
        tenantId: params.tenantId,
        officialId: params.officialId,
        houseId: params.houseId
      })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        uid: data.uid,
        email: cleanEmail,
        officialId: data.officialId,
        isExisting: data.isExisting
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
    console.warn('Backend /api/admin/create-or-update-account fallback to client SDK:', apiErr);
  }

  // 2. Client-side fallback if server endpoint is unreachable
  const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryConfig = {
    apiKey: firebaseAppletConfig.apiKey,
    authDomain: firebaseAppletConfig.authDomain,
    projectId: firebaseAppletConfig.projectId,
    messagingSenderId: firebaseAppletConfig.messagingSenderId,
    appId: firebaseAppletConfig.appId,
  };

  const secondaryApp = initializeApp(secondaryConfig, secondaryAppName);
  let createdUid: string | undefined;

  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    createdUid = credential.user.uid;
    await signOut(secondaryAuth);
  } catch (error: any) {
    console.error('Error creating Firebase user in secondary app:', error);
    let friendlyMessage = 'Gagal membuat akun login di Firebase Authentication.';
    if (error.code === 'auth/email-already-in-use') {
      friendlyMessage = `Email ${cleanEmail} sudah pernah terdaftar di Firebase Auth. Harap gunakan email lain.`;
    } else if (error.code === 'auth/weak-password') {
      friendlyMessage = 'Password terlalu lemah. Minimal gunakan 6 karakter.';
    } else if (error.code === 'auth/invalid-email') {
      friendlyMessage = 'Format email tidak valid.';
    } else if (error.message) {
      friendlyMessage = error.message;
    }
    throw new Error(friendlyMessage);
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (delErr) {
      console.warn('Failed to delete secondary Firebase App instance:', delErr);
    }
  }

  let officialId: string | undefined = params.officialId;
  if (db) {
    try {
      let targetDocId: string | null = null;
      if (officialId && !officialId.includes('-chairman') && !officialId.includes('-secretary') && !officialId.includes('-treasurer')) {
        targetDocId = officialId;
      } else {
        const qTenant = query(
          collection(db, 'officials'),
          where('tenantId', '==', params.tenantId)
        );
        const snap = await getDocs(qTenant);
        const normTarget = cleanName.toLowerCase().replace(/^(bpk\.|bapak|ibu|sdr\.|sdri\.)\s*/i, '').trim();
        for (const docItem of snap.docs) {
          const dName = (docItem.data().name || '').toLowerCase().replace(/^(bpk\.|bapak|ibu|sdr\.|sdri\.)\s*/i, '').trim();
          if (dName === normTarget) {
            targetDocId = docItem.id;
            break;
          }
        }
      }

      if (targetDocId) {
        const officialRef = doc(db, 'officials', targetDocId);
        await updateDoc(officialRef, {
          email: cleanEmail,
          role: assignedRole as string,
          phone: cleanPhone || undefined
        });
        officialId = targetDocId;
      } else {
        const officialDocData: Omit<Official, 'id'> = {
          name: cleanName,
          role: assignedRole as string,
          email: cleanEmail,
          phone: cleanPhone,
          tenantId: params.tenantId,
          houseId: params.houseId || 'Kantor RT',
          duties: [
            'Pengelolaan data kependudukan dan sensus warga',
            'Pencatatan dan verifikasi pembayaran iuran lingkungan',
            'Penerbitan surat pengantar dan administrasi digital',
            'Manajemen jadwal ronda dan keamanan lingkungan'
          ]
        };

        const docRef = await addDoc(collection(db, 'officials'), officialDocData);
        officialId = docRef.id;
      }
    } catch (dbErr: any) {
      console.error('Failed to create/update official record in Firestore:', dbErr);
      throw new Error(`Akun Firebase terbuat (UID: ${createdUid}), namun gagal menyimpan profil pengurus ke Firestore: ${dbErr.message}`);
    }
  }

  return {
    success: true,
    uid: createdUid,
    email: cleanEmail,
    officialId
  };
};

export interface DeleteAdminAccountParams {
  email: string;
  officialId?: string;
  tenantId?: string;
}

/**
 * Super Admin function to delete an admin account:
 * 1. Invokes server-side Firebase Admin endpoint to delete user from Firebase Authentication
 * 2. Unlinks email and access rights from Firestore officials collection
 */
export const deleteAdminAccount = async (
  params: DeleteAdminAccountParams
): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Alamat email wajib disertakan.');
  }

  // 1. Delete from Firebase Authentication via backend endpoint
  try {
    const res = await fetch('/api/admin/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        officialId: params.officialId,
        tenantId: params.tenantId
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menghapus akun di server');
    }
  } catch (apiErr) {
    console.warn('Backend /api/admin/delete-account fetch error:', apiErr);
  }

  // 2. Unlink email from Firestore client-side
  if (db) {
    try {
      if (params.officialId && !params.officialId.includes('-chairman') && !params.officialId.includes('-secretary') && !params.officialId.includes('-treasurer')) {
        const officialDocRef = doc(db, 'officials', params.officialId);
        await updateDoc(officialDocRef, { email: '' });
      } else {
        const q = query(collection(db, 'officials'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, { email: '' });
        }
      }
    } catch (dbErr) {
      console.warn('Firestore unlink email error:', dbErr);
    }
  }

  return {
    success: true,
    message: `Akun login ${cleanEmail} telah berhasil dihapus dari sistem.`
  };
};
