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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { notification, data } = req.body || {};

  try {
    const fbAdmin = getFirebaseAdmin();
    const tokensSnapshot = await fbAdmin.firestore().collection('fcmTokens').get();
    const tokens: string[] = [];

    tokensSnapshot.forEach((doc) => {
      const d = doc.data();
      if (d.token && typeof d.token === 'string') {
        tokens.push(d.token);
      }
    });

    if (!tokens.length) {
      return res.status(200).json({ success: true, message: 'No registered FCM tokens found' });
    }

    const response = await fbAdmin.messaging().sendEachForMulticast({
      tokens,
      notification: notification || {},
      data: data || {},
    });

    return res.status(200).json({ success: true, response });
  } catch (error: any) {
    console.warn('Push broadcast warning:', error?.message);
    return res.status(200).json({
      success: false,
      warning: error.message || 'Gagal menyiarkan push notification di server.'
    });
  }
}
