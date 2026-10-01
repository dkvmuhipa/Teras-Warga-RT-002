import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwybhobnw',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const file = req.body?.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body?.folder || 'teras-warga';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || undefined;

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      upload_preset: uploadPreset,
    });

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
    });
  } catch (error: any) {
    console.error('Cloudinary Vercel Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload to Cloudinary' });
  }
}
