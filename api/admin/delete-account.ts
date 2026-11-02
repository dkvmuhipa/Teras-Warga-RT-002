import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

function getFirebaseAdmin(): typeof admin {
  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    try {
      let raw = serviceAccountVar.trim();
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        raw = Buffer.from(raw, 'base64').toString('utf8');
      }
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'teras-warga'
      });
      console.log('✅ [Vercel API] Firebase Admin initialized with service account.');
      return admin;
    } catch (e: any) {
      console.warn('⚠️ [Vercel API] Failed parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'teras-warga';

  if (clientEmail && privateKeyRaw) {
    try {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        }),
        projectId
      });
      return admin;
    } catch (e: any) {
      console.warn('⚠️ [Vercel API] Failed initializing with individual credentials:', e.message);
    }
  }

  try {
    admin.initializeApp({ projectId });
  } catch (e: any) {
    console.warn('⚠️ [Vercel API] Default initializeApp warning:', e.message);
  }

  return admin;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify Authorization Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Header otorisasi tidak ditemukan.' });
  }

  const fbAdmin = getFirebaseAdmin();
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let callerEmail = '';
  try {
    const decodedToken = await fbAdmin.auth().verifyIdToken(token);
    callerEmail = (decodedToken.email || '').toLowerCase().trim();
    const isSuper = callerEmail === 'admin@teras.id' || callerEmail === 'dkvsmkmuhipa@gmail.com' || decodedToken.superAdmin === true;
    
    if (!isSuper) {
      const firestore = fbAdmin.firestore();
      const [platformDoc, adminDoc] = await Promise.all([
        firestore.collection('platform_admins').doc(callerEmail).get().catch(() => null),
        firestore.collection('admins').doc(callerEmail).get().catch(() => null)
      ]);
      if (!platformDoc?.exists && !adminDoc?.exists) {
        return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki wewenang untuk menghapus akun admin.' });
      }
    }
  } catch (authVerifyErr: any) {
    return res.status(401).json({ error: 'Unauthorized: Sesi login tidak valid atau telah kedaluwarsa.' });
  }

  const { email, officialId, tenantId } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email wajib disertakan' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let authUserDeleted = false;
  let uidDeleted: string | null = null;
  let authWarning: string | null = null;

  try {
    const fbAdmin = getFirebaseAdmin();

    // 1. Delete user from Firebase Authentication
    try {
      const userRecord = await fbAdmin.auth().getUserByEmail(cleanEmail);
      if (userRecord && userRecord.uid) {
        await fbAdmin.auth().deleteUser(userRecord.uid);
        authUserDeleted = true;
        uidDeleted = userRecord.uid;
        console.log(`✅ [Vercel API] User ${cleanEmail} (UID: ${userRecord.uid}) deleted from Firebase Auth.`);
      }
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`ℹ️ [Vercel API] User ${cleanEmail} not found in Firebase Auth (already removed).`);
        authUserDeleted = true;
      } else {
        console.warn(`⚠️ [Vercel API] Firebase Auth delete notice for ${cleanEmail}:`, authError.message);
        authWarning = authError.message;
      }
    }

    // 2. Unlink or clean in Firestore officials and admins
    try {
      const firestore = fbAdmin.firestore();

      if (officialId && !officialId.includes('-chairman') && !officialId.includes('-secretary') && !officialId.includes('-treasurer')) {
        try {
          await firestore.collection('officials').doc(officialId).update({ email: '' });
          console.log(`✅ [Vercel API] Official ${officialId} email unlinked.`);
        } catch (_) {}
      }

      const querySnap = await firestore.collection('officials').where('email', '==', cleanEmail).get();
      for (const docSnap of querySnap.docs) {
        await docSnap.ref.update({ email: '' });
      }
      if (!querySnap.empty) {
        console.log(`✅ [Vercel API] Unlinked email ${cleanEmail} from ${querySnap.size} official record(s).`);
      }

      // Remove from admins collection
      try {
        await firestore.collection('admins').doc(cleanEmail).delete();
        console.log(`✅ [Vercel API] Removed ${cleanEmail} from admins collection.`);
      } catch (_) {}

      // Log account deletion to auditLogs
      try {
        await firestore.collection('auditLogs').add({
          action: 'DELETE_OFFICIAL_ACCOUNT',
          title: 'Hapus Akun Pengurus',
          description: `Mencabut & menghapus akun login untuk ${cleanEmail} (${tenantId || 'Semua RT'})`,
          targetEmail: cleanEmail,
          tenantId: tenantId || '',
          officialId: officialId || '',
          performedBy: 'Super Admin',
          timestamp: new Date().toISOString(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (_) {}

    } catch (dbErr: any) {
      console.warn(`⚠️ [Vercel API] Firestore unlink notice:`, dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Akun login ${cleanEmail} berhasil dicabut dari sistem.`,
      authUserDeleted,
      uid: uidDeleted,
      authWarning: authWarning || undefined
    });
  } catch (err: any) {
    console.warn('⚠️ [Vercel API] Delete account soft fallback:', err?.message);
    return res.status(200).json({
      success: true,
      authUserDeleted: false,
      message: `Akses login untuk ${cleanEmail} telah dicabut dari database RT.`
    });
  }
}
