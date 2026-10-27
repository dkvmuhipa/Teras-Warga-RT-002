import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

export function getFirebaseAdmin(): typeof admin {
  if (admin.apps.length > 0) {
    return admin;
  }

  // 1. Try FIREBASE_SERVICE_ACCOUNT environment variable (JSON string or base64)
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
      console.log('✅ [Firebase Admin] Initialized via FIREBASE_SERVICE_ACCOUNT');
      return admin;
    } catch (e: any) {
      console.warn('⚠️ [Firebase Admin] Failed parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  // 2. Try individual environment variables
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
      console.log('✅ [Firebase Admin] Initialized via individual credentials');
      return admin;
    } catch (e: any) {
      console.warn('⚠️ [Firebase Admin] Failed initializing with individual credentials:', e.message);
    }
  }

  // 3. Try local file if running locally
  try {
    const localPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(localPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'teras-warga'
      });
      console.log('✅ [Firebase Admin] Initialized via local service account file');
      return admin;
    }
  } catch (e: any) {
    console.warn('⚠️ [Firebase Admin] Failed reading local service account:', e.message);
  }

  // 4. Fallback to basic initialization with project ID
  try {
    admin.initializeApp({ projectId });
    console.log(`ℹ️ [Firebase Admin] Initialized with default projectId: ${projectId}`);
  } catch (e: any) {
    console.warn('⚠️ [Firebase Admin] Default initializeApp warning:', e.message);
  }

  return admin;
}
