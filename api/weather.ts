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

    const weatherRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!weatherRes.ok) throw new Error('Weather API returned error status');
    const data = await weatherRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.warn("Vercel Weather Function Error (Serving fallback):", error);
    return res.status(200).json({
      current: {
        temperature_2m: 30,
        relative_humidity_2m: 75,
        weather_code: 1,
        wind_speed_10m: 5
      }
    });
  }
}
