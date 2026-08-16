import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

let aiAdmin: GoogleGenAI | null = null;
const getAiAdmin = () => {
  if (!aiAdmin) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiAdmin = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiAdmin;
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

  const { question, systemInstruction } = req.body || {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_api_key")) {
      return res.status(200).json({ 
        success: true, 
        text: getFallbackAnswer(question) 
      });
    }

    const ai = getAiAdmin();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question || 'Halo',
      config: {
        systemInstruction: systemInstruction || 'Anda adalah Rit, Asisten RT 02.',
      }
    });

    return res.status(200).json({ 
      success: true, 
      text: response.text || "Halo! Ada yang bisa saya bantu terkait RT 02? 😊" 
    });

  } catch (error: any) {
    console.error("Vercel Serverless Gemini Error:", error);
    return res.status(200).json({ 
      success: true, 
      text: getFallbackAnswer(question) 
    });
  }
}

function getFallbackAnswer(question?: string): string {
  const q = (question || '').toLowerCase().trim();

  if (q === 'hai' || q === 'halo' || q === 'hi' || q === 'p' || q === 'tes' || q.includes('kamu bisa') || q.includes('bisa apa')) {
    return "Halo! Bisa banget dong, mau ngobrol santai atau cari info apa nih hari ini? 😊";
  }

  if (q.includes('ronda') || q.includes('siskamling')) {
    return "👮 **Jadwal Ronda Malam RT 02:**\nUntuk jadwal dan anggota regu ronda malam lengkap, Bapak/Ibu dapat mengecek langsung di menu **Informasi Publik** atau hubungi Koordinator Keamanan RT ya!";
  }

  if (q.includes('bersih') || q.includes('juara') || q.includes('blok')) {
    return "🏆 **Papan Kebersihan Blok RT 02:**\nPenilaian kebersihan got, pekarangan, dan tanaman blok dievaluasi rutin setiap bulan oleh pengurus RT. Detail juaranya ada di Beranda Utama!";
  }

  if (q.includes('iuran') || q.includes('bayar') || q.includes('kas')) {
    return "💰 **Iuran Bulanan Warga RT 02:**\nIuran rutin sebesar **Rp 25.000/bulan** (Keamanan + Kebersihan Sampah). Pembayaran dapat diserahkan ke Bendahara RT atau via portal Kas Digital.";
  }

  if (q.includes('sampah') || q.includes('angkut')) {
    return "🗑️ **Jadwal Angkut Sampah RT 02:**\n- **Sampah Organik:** Senin, Rabu & Sabtu Pagi (07.00 WITA)\n- **Anorganik / Plastik:** Selasa & Jumat Sore (15.30 WITA)";
  }

  if (q.includes('surat') || q.includes('syarat')) {
    return "📋 **Syarat Surat Pengantar RT:**\n1. KTP Asli Warga\n2. Kartu Keluarga (KK) Asli\n3. Lunas Iuran Bulanan Berjalan\n\nBapak/Ibu juga bisa mengajukan **Surat Mandiri secara Digital** lewat menu *Layanan Warga*!";
  }

  return "Halo! Ada yang bisa saya bantu terkait jadwal ronda, kas RT, iuran warga, surat pengantar, atau informasi lingkungan RT 02? Silakan tanyakan langsung ya! 😊";
}
