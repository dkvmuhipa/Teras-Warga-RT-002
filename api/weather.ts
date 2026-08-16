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
    const weatherRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
    );
    const data = await weatherRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Vercel Weather Function Error:", error);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
