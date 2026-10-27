import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdmin } from '../_firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Setup CORS
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

  const { email, password, name, phone, role, tenantId, officialId, houseId } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Alamat email tidak valid' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const assignedRole = role || 'Admin';

  try {
    const admin = getFirebaseAdmin();

    let uid: string | undefined;
    let isExisting = false;

    // 1. Check if user already exists in Firebase Auth
    try {
      const existingUser = await admin.auth().getUserByEmail(cleanEmail);
      uid = existingUser.uid;
      isExisting = true;
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        console.warn('⚠️ [Vercel API] getUserByEmail warning:', err.message);
      }
    }

    // Password validation: required for new accounts, optional for existing
    if (!isExisting) {
      if (!cleanPassword || cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password sementara minimal 6 karakter untuk akun baru.' });
      }
    } else {
      if (cleanPassword && cleanPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      }
    }

    // 2. Create or Update user in Firebase Authentication
    try {
      if (isExisting && uid) {
        const updatePayload: any = {};
        if (cleanName) updatePayload.displayName = cleanName;
        if (cleanPassword) updatePayload.password = cleanPassword;

        await admin.auth().updateUser(uid, updatePayload);
        console.log(`✅ [Vercel API] User ${cleanEmail} updated in Auth.`);
      } else {
        const newUser = await admin.auth().createUser({
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanName || undefined
        });
        uid = newUser.uid;
        console.log(`✅ [Vercel API] User ${cleanEmail} created in Auth (UID: ${uid}).`);
      }
    } catch (authErr: any) {
      console.warn('⚠️ [Vercel API] Auth create/update warning:', authErr.message);
    }

    // 3. Link in Firestore officials collection
    let resolvedOfficialId = officialId;
    try {
      const firestore = admin.firestore();

      if (resolvedOfficialId && !resolvedOfficialId.includes('-chairman') && !resolvedOfficialId.includes('-secretary') && !resolvedOfficialId.includes('-treasurer')) {
        try {
          await firestore.collection('officials').doc(resolvedOfficialId).set({
            email: cleanEmail,
            role: assignedRole,
            phone: cleanPhone || undefined,
            name: cleanName || undefined,
            tenantId: tenantId
          }, { merge: true });
        } catch (_) {}
      } else {
        const snap = await firestore.collection('officials').where('tenantId', '==', tenantId).get();
        const normTarget = cleanName.toLowerCase().replace(/^(bpk\.|bapak|ibu|sdr\.|sdri\.)\s*/i, '').trim();
        let targetDocId: string | null = null;
        for (const docItem of snap.docs) {
          const dName = (docItem.data().name || '').toLowerCase().replace(/^(bpk\.|bapak|ibu|sdr\.|sdri\.)\s*/i, '').trim();
          if (dName === normTarget) {
            targetDocId = docItem.id;
            break;
          }
        }

        if (targetDocId) {
          await firestore.collection('officials').doc(targetDocId).update({
            email: cleanEmail,
            role: assignedRole,
            phone: cleanPhone || undefined
          });
          resolvedOfficialId = targetDocId;
        } else {
          const newDoc = await firestore.collection('officials').add({
            name: cleanName,
            role: assignedRole,
            email: cleanEmail,
            phone: cleanPhone,
            tenantId: tenantId,
            houseId: houseId || 'Kantor RT',
            duties: [
              'Pengelolaan data kependudukan dan sensus warga',
              'Pencatatan dan verifikasi pembayaran iuran lingkungan',
              'Penerbitan surat pengantar dan administrasi digital',
              'Manajemen jadwal ronda dan keamanan lingkungan'
            ]
          });
          resolvedOfficialId = newDoc.id;
        }
      }

      // 4. Grant Admin privileges: Auth Custom Claims & Firestore admins collection
      if (uid) {
        try {
          await admin.auth().setCustomUserClaims(uid, {
            admin: true,
            role: assignedRole,
            tenantId: tenantId
          });
        } catch (claimsErr: any) {
          console.warn('⚠️ [Vercel API] Set custom claims warning:', claimsErr.message);
        }
      }

      try {
        await firestore.collection('admins').doc(cleanEmail).set({
          email: cleanEmail,
          uid: uid || '',
          name: cleanName,
          role: assignedRole,
          tenantId: tenantId,
          officialId: resolvedOfficialId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (adminDocErr: any) {
        console.warn('⚠️ [Vercel API] Write to admins doc warning:', adminDocErr.message);
      }

      // 5. Log event to Firestore auditLogs
      try {
        await firestore.collection('auditLogs').add({
          action: isExisting ? 'UPDATE_OFFICIAL_ACCOUNT' : 'CREATE_OFFICIAL_ACCOUNT',
          title: isExisting ? 'Perbarui Akun Pengurus' : 'Buat Akun Pengurus',
          description: `${isExisting ? 'Memperbarui' : 'Membuat'} akun login untuk ${cleanName || cleanEmail} sebagai ${assignedRole} (${tenantId})`,
          targetEmail: cleanEmail,
          targetName: cleanName,
          role: assignedRole,
          tenantId: tenantId,
          officialId: resolvedOfficialId || '',
          performedBy: 'Super Admin',
          timestamp: new Date().toISOString(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (_) {}

    } catch (dbErr: any) {
      console.warn('⚠️ [Vercel API] Firestore provisioning warning:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      uid,
      email: cleanEmail,
      officialId: resolvedOfficialId,
      isExisting,
      message: isExisting
        ? `Akun ${cleanEmail} sudah ada dan berhasil ditautkan sebagai ${assignedRole} dengan kredensial yang diperbarui.`
        : `Akun login baru ${cleanEmail} berhasil dibuat di sistem.`
    });
  } catch (err: any) {
    console.error('❌ [Vercel API] Error provisioning admin account:', err);
    return res.status(500).json({ error: err.message || 'Gagal membuat/menautkan akun di server' });
  }
}
