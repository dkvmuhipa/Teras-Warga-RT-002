import type { VercelRequest, VercelResponse } from '@vercel/node';

let eqCache: {
  data: any;
  timestamp: number;
} | null = null;
const CACHE_DURATION_MS = 2 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = Date.now();
  if (eqCache && (now - eqCache.timestamp < CACHE_DURATION_MS)) {
    return res.status(200).json(eqCache.data);
  }

  const BMKG_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.bmkg.go.id/',
    'Origin': 'https://www.bmkg.go.id',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const [latestRes, recentM5Res, feltRes] = await Promise.allSettled([
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { headers: BMKG_HEADERS, signal: controller.signal }),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { headers: BMKG_HEADERS, signal: controller.signal }),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json', { headers: BMKG_HEADERS, signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    let latestData: any = null;
    let recentM5Data: any = null;
    let feltData: any = null;

    if (latestRes.status === 'fulfilled' && latestRes.value.ok) {
      try { latestData = await latestRes.value.json(); } catch (_) {}
    }
    if (recentM5Res.status === 'fulfilled' && recentM5Res.value.ok) {
      try { recentM5Data = await recentM5Res.value.json(); } catch (_) {}
    }
    if (feltRes.status === 'fulfilled' && feltRes.value.ok) {
      try { feltData = await feltRes.value.json(); } catch (_) {}
    }

    if (latestData || recentM5Data || feltData) {
      const responseData = {
        latest: latestData?.Infogempa?.gempa || null,
        recentM5: recentM5Data?.Infogempa?.gempa || [],
        felt: feltData?.Infogempa?.gempa || []
      };
      eqCache = { data: responseData, timestamp: Date.now() };
      return res.status(200).json(responseData);
    }

    throw new Error('BMKG primary feeds empty');
  } catch (bmkgError: any) {
    try {
      const usgsController = new AbortController();
      const usgsTimeout = setTimeout(() => usgsController.abort(), 4000);

      const usgsResponse = await fetch(
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=-0.85117&longitude=119.9044&maxradiuskm=600&minmagnitude=2.0&orderby=time&limit=50',
        { signal: usgsController.signal }
      );
      clearTimeout(usgsTimeout);

      if (!usgsResponse.ok) {
        throw new Error(`USGS API responded with HTTP ${usgsResponse.status}`);
      }

      const geojson: any = await usgsResponse.json();
      const features = geojson?.features || [];

      const mappedList = features.map((feat: any) => {
        const lon = feat.geometry.coordinates[0];
        const lat = feat.geometry.coordinates[1];
        const depth = feat.geometry.coordinates[2];
        const dateObj = new Date(feat.properties.time);

        const formattedDate = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).replace(/\./g, '');

        const formattedTime = dateObj.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Makassar'
        }) + ' WITA';

        let locationName = feat.properties.place || 'Sulawesi Tengah, Indonesia';
        locationName = locationName
          .replace(/km\s+([N|S|E|W|NE|NW|SE|SW]+)\s+of\+?/i, (_: string, p1: string) => {
            const dirMap: Record<string, string> = {
              N: 'Utara', S: 'Selatan', E: 'Timur', W: 'Barat',
              NE: 'Timur Laut', NW: 'Barat Laut', SE: 'Tenggara', SW: 'Barat Daya'
            };
            return `km ${dirMap[p1.toUpperCase()] || p1} dari `;
          })
          .replace(/Indonesia/gi, 'Sulawesi Tengah')
          .trim();

        const isFelt = feat.properties.felt && feat.properties.felt > 0;
        const mmiVal = feat.properties.mmi || (isFelt ? 2 : null);

        return {
          Tanggal: formattedDate,
          Jam: formattedTime,
          DateTime: dateObj.toISOString(),
          Coordinates: `${lat},${lon}`,
          Lintang: `${Math.abs(lat).toFixed(2)} LS`,
          Bujur: `${Math.abs(lon).toFixed(2)} BT`,
          Magnitude: feat.properties.mag.toFixed(1),
          Kedalaman: `${Math.round(depth)} km`,
          Wilayah: locationName,
          Potensi: feat.properties.tsunami === 1 ? 'Berpotensi tsunami' : 'Tidak berpotensi tsunami',
          Dirasakan: isFelt ? `${mmiVal} MMI` : '-',
          Shakemap: null
        };
      });

      const responseData = {
        latest: mappedList[0] || null,
        recentM5: mappedList.filter((item: any) => parseFloat(item.Magnitude) >= 5.0).slice(0, 15),
        felt: mappedList.filter((item: any) => item.Dirasakan !== '-').slice(0, 15)
      };

      eqCache = { data: responseData, timestamp: Date.now() };
      return res.status(200).json(responseData);
    } catch (fallbackError: any) {
      console.error('USGS Fallback failed:', fallbackError);
      return res.status(500).json({ error: 'Failed to fetch earthquake data' });
    }
  }
}
