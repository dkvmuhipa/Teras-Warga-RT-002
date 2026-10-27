import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdmin } from '../_firebaseAdmin';

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

  const { tokens, notification, data } = req.body || {};

  if (!tokens || !Array.isArray(tokens) || !tokens.length) {
    return res.status(400).json({ error: 'No tokens provided' });
  }

  try {
    const admin = getFirebaseAdmin();
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: notification || {},
      data: data || {},
    });

    return res.status(200).json({ success: true, response });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
