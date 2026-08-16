import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const aqiRes = await fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10'
    );
    const data = await aqiRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel AQI Function Error:", error);
    return res.status(500).json({ error: "Failed to fetch AQI data" });
  }
}
