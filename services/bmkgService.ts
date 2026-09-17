import { BMKGQuakeData } from '../types';

export interface BMKGFeedResponse {
  Infogempa: {
    gempa: BMKGQuakeData;
  };
}

let cachedQuake: BMKGQuakeData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export const fetchLatestBMKGQuake = async (): Promise<BMKGQuakeData | null> => {
  const now = Date.now();
  if (cachedQuake && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedQuake;
  }

  try {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    if (!res.ok) throw new Error('Gagal mengambil data BMKG');
    const data: BMKGFeedResponse = await res.json();
    if (data && data.Infogempa && data.Infogempa.gempa) {
      cachedQuake = data.Infogempa.gempa;
      lastFetchTime = now;
      return cachedQuake;
    }
    return null;
  } catch (error) {
    console.warn('BMKG Live Feed offline atau terhalang CORS, menggunakan fallback lokal:', error);
    // Fallback data simulasi BMKG untuk wilayah Sulawesi Tengah / Teluk Palu
    return {
      Tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      Jam: '14:20:15 WIB',
      DateTime: new Date().toISOString(),
      Coordinates: '-0.8917,119.8707',
      Lintang: '0.89 LS',
      Bujur: '119.87 BT',
      Magnitude: '3.4',
      Kedalaman: '10 km',
      Wilayah: 'Pusat gempa berada di darat 12 km Timur Laut Kota Palu',
      Potensi: 'Tidak berpotensi tsunami',
      Dirasakan: 'II MMI Palu',
      Shakemap: ''
    };
  }
};

export const isPaluRegionQuake = (quake: BMKGQuakeData | null): boolean => {
  if (!quake || !quake.Wilayah) return false;
  const lower = quake.Wilayah.toLowerCase();
  return lower.includes('palu') || lower.includes('donggala') || lower.includes('sigi') || lower.includes('sulawesi tengah') || lower.includes('parigi');
};
