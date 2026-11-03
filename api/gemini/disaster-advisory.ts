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

  const { context } = req.body || {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_api_key")) {
      return res.status(200).json({ success: false, fallback: true });
    }

    const ai = getAiAdmin();
    const prompt = `Anda adalah sistem cerdas "SADAR RT 002 Huntap Tondo 2, Kota Palu" (Smart Analysis for Disaster, Climate Adaptation & Resilience).
Lokasi kita: Kawasan Huntap Tondo 2, Palu Timur, Sulawesi Tengah (zona pasca-bencana 2018 dekat perbukitan & koridor Sesar Palu-Koro).

Berikut data sensor & parameter lingkungan terkini:
- Jarak gempa BMKG terdekat: ${context?.nearestEarthquakeDistanceKm != null ? `${context.nearestEarthquakeDistanceKm.toFixed(1)} km` : 'Tidak ada data'}
- Magnitudo gempa terdekat: ${context?.nearestEarthquakeMagnitude || '-'}
- Suhu udara Teluk Palu: ${context?.weatherTemp != null ? `${context.weatherTemp}°C` : '31°C'}
- Kualitas Udara (AQI US): ${context?.weatherAqi != null ? context.weatherAqi : '45'}
- Kondisi Cuaca: ${context?.weatherCondition || 'Cerah Berawan'}
- Demografi Warga Rentan di RT 002: ${context?.vulnerableCounts?.elderly || 0} lansia, ${context?.vulnerableCounts?.infantsAndToddlers || 0} balita/bayi, ${context?.vulnerableCounts?.pregnant || 0} ibu hamil. Total: ${context?.vulnerableCounts?.total || 0} jiwa kelompok prioritas.

TUGAS ANDA:
Analisis risiko bencana dan adaptasi iklim dalam format JSON valid (tanpa markdown blok pembuka, hanya raw JSON).
Skema JSON:
{
  "threatLevel": "Aman" | "Waspada" | "Siaga",
  "headline": "Judul singkat situasi risiko (maks 10 kata)",
  "seismicAssessment": "Ringkasan penilaian gempa & sesar Palu-Koro (1-2 kalimat)",
  "climateAssessment": "Ringkasan penilaian cuaca, suhu, potensi limpasan lereng atau panas ekstrem (1-2 kalimat)",
  "actionTips": [
    "Tip mitigasi taktis 1 untuk warga & lansia/balita",
    "Tip mitigasi taktis 2 untuk pos ronda/siskamling",
    "Tip mitigasi taktis 3 untuk kesiapan jalur evakuasi lapangan"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.status(200).json({
      success: true,
      data: parsed
    });

  } catch (error: any) {
    console.error("Vercel Serverless Disaster Advisory Error:", error);
    return res.status(200).json({ success: false, fallback: true });
  }
}
