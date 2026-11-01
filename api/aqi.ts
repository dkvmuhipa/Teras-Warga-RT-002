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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const aqiRes = await fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!aqiRes.ok) throw new Error('AQI API returned error status');
    const data = await aqiRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.warn("Vercel AQI Function Error (Serving fallback):", error);
    return res.status(200).json({
      current: {
        us_aqi: 25,
        pm2_5: 5,
        pm10: 10
      }
    });
  }
}
