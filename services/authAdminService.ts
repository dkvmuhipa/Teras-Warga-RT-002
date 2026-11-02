import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import firebaseAppletConfig from "../firebase-applet-config.json";
import { db, auth } from "./firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Role, Official } from "../types";

export interface CreateRtAdminAccountParams {
  email: string;
  password?: string;
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
 * Creates or links a Firebase Auth account for an RT Admin.
 * Handles both brand new accounts AND existing accounts seamlessly.
 * Also registers/links the account inside Firestore's `officials` and `admins` collections.
 */
export const createTenantAdminAccount = async (
  params: CreateRtAdminAccountParams
): Promise<CreateRtAdminAccountResult & { isExisting?: boolean }> => {
  const cleanEmail = params.email.trim().toLowerCase();
  const password = params.password?.trim() || '';
  const cleanName = params.name.trim();
  const cleanPhone = params.phone.trim();
  const assignedRole = params.role || Role.ADMIN;

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Alamat email tidak valid.');
  }

  if (password && password.length < 6) {
    throw new Error('Password minimal harus 6 karakter.');
  }

  // 1. Try server-side provisioning via Firebase Admin SDK
  try {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/create-or-update-account', {
      method: 'POST',
      headers: reqHeaders,
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
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        return {
          success: true,
          uid: data.uid,
          email: cleanEmail,
          officialId: data.officialId,
          isExisting: data.isExisting
        };
      }
      if (data.fallbackToClient) {
        console.log('ℹ️ Server delegated provisioning to client SDK:', data.message);
      }
    } else {
      console.warn('⚠️ Server endpoint returned status', res.status);
    }
  } catch (apiErr: any) {
    console.warn('Backend /api/admin/create-or-update-account unreachable, using client SDK fallback:', apiErr?.message);
  }

  // 2. Client-side creation/linking fallback
  let createdUid: string | undefined;
  let isExistingAccount = false;

  if (password && password.length >= 6) {
    const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secondaryConfig = {
      apiKey: firebaseAppletConfig.apiKey,
      authDomain: firebaseAppletConfig.authDomain,
      projectId: firebaseAppletConfig.projectId,
      messagingSenderId: firebaseAppletConfig.messagingSenderId,
      appId: firebaseAppletConfig.appId,
    };

    const secondaryApp = initializeApp(secondaryConfig, secondaryAppName);

    try {
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
      createdUid = credential.user.uid;
      await signOut(secondaryAuth);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ Email ${cleanEmail} sudah ada di Firebase Auth. Melanjutkan penautan profil pengurus di Firestore.`);
        isExistingAccount = true;
      } else {
        console.error('Error creating Firebase user in secondary app:', error);
        let friendlyMessage = 'Gagal membuat akun login di Firebase Authentication.';
        if (error.code === 'auth/weak-password') {
          friendlyMessage = 'Password terlalu lemah. Minimal gunakan 6 karakter.';
        } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = 'Format email tidak valid.';
        } else if (error.message) {
          friendlyMessage = error.message;
        }
        throw new Error(friendlyMessage);
      }
    } finally {
      try {
        await deleteApp(secondaryApp);
      } catch (delErr) {
        console.warn('Failed to delete secondary Firebase App instance:', delErr);
      }
    }
  } else {
    // If no password provided, this is an existing account update/link
    isExistingAccount = true;
  }

  // 3. Register or update official in Firestore
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

      // 4. Ensure admin document exists in Firestore 'admins' collection for RBAC
      try {
        const adminRef = doc(db, 'admins', cleanEmail);
        await setDoc(adminRef, {
          email: cleanEmail,
          name: cleanName,
          role: assignedRole as string,
          tenantId: params.tenantId,
          officialId: officialId || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (adminDocErr) {
        console.warn('Firestore admins collection set warning:', adminDocErr);
      }

    } catch (dbErr: any) {
      console.error('Failed to create/update official record in Firestore:', dbErr);
      throw new Error(`Gagal menyimpan profil pengurus ke Firestore: ${dbErr.message}`);
    }
  }

  return {
    success: true,
    uid: createdUid,
    email: cleanEmail,
    officialId,
    isExisting: isExistingAccount
  };
};

export interface DeleteAdminAccountParams {
  email: string;
  officialId?: string;
  tenantId?: string;
}

/**
 * Super Admin function to delete an admin account:
 * 1. Invokes server-side Firebase Admin endpoint if available
 * 2. Unlinks email and access rights from Firestore officials and admins collection
 */
export const deleteAdminAccount = async (
  params: DeleteAdminAccountParams
): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Alamat email wajib disertakan.');
  }

  // 1. Attempt server-side deletion from Firebase Authentication
  try {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/delete-account', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        email: cleanEmail,
        officialId: params.officialId,
        tenantId: params.tenantId
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('Backend /api/admin/delete-account status:', res.status, data);
    }
  } catch (apiErr) {
    console.warn('Backend /api/admin/delete-account fetch error (proceeding with client cleanup):', apiErr);
  }

  // 2. Unlink email from Firestore officials and admins collection
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

      // Remove from admins collection
      try {
        const adminDocRef = doc(db, 'admins', cleanEmail);
        await deleteDoc(adminDocRef);
      } catch (delAdminErr) {
        console.warn('Remove from admins doc warning:', delAdminErr);
      }
    } catch (dbErr) {
      console.warn('Firestore unlink email error:', dbErr);
    }
  }

  return {
    success: true,
    message: `Akses login untuk ${cleanEmail} telah berhasil dicabut dari sistem RT.`
  };
};
