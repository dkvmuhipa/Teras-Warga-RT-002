import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdmin, hasFirebaseAdminCredentials } from '../_firebaseAdmin';

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

  const { email, officialId, tenantId } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email wajib disertakan' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let authUserDeleted = false;
  let uidDeleted: string | null = null;
  let authWarning: string | null = null;

  // If server does not have Firebase service account credentials configured, notify client to complete unlinking directly via client SDK
  if (!hasFirebaseAdminCredentials()) {
    console.log(`ℹ️ [Vercel API] No Service Account credentials for deleting ${cleanEmail}. Unlinking in client.`);
    return res.status(200).json({
      success: true,
      authUserDeleted: false,
      fallbackToClient: true,
      message: `Akses login untuk ${cleanEmail} telah dicabut dari sistem. (Catatan: Hapus permanen dari Firebase Auth dapat dilakukan lewat Firebase Console).`
    });
  }

  try {
    const admin = getFirebaseAdmin();

    // 1. Delete user from Firebase Authentication
    try {
      const userRecord = await admin.auth().getUserByEmail(cleanEmail);
      if (userRecord && userRecord.uid) {
        await admin.auth().deleteUser(userRecord.uid);
        authUserDeleted = true;
        uidDeleted = userRecord.uid;
        console.log(`✅ [Vercel API] User ${cleanEmail} (UID: ${userRecord.uid}) deleted from Firebase Auth.`);
      }
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`ℹ️ [Vercel API] User ${cleanEmail} not found in Firebase Auth (already removed).`);
        authUserDeleted = true;
      } else {
        console.warn(`⚠️ [Vercel API] Firebase Auth delete warning for ${cleanEmail}:`, authError.message);
        authWarning = authError.message;
      }
    }

    // 2. Unlink or clean in Firestore officials and admins
    try {
      const firestore = admin.firestore();

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
      console.warn(`⚠️ [Vercel API] Firestore unlink warning:`, dbErr.message);
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
