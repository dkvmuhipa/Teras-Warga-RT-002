import { useState, useEffect } from 'react';

export interface EarthquakeInfo {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

export interface EarthquakeData {
  latest: EarthquakeInfo | null;
  recentM5: EarthquakeInfo[];
  felt: EarthquakeInfo[];
}

export const useEarthquake = () => {
  const [data, setData] = useState<EarthquakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarthquakes = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch('/api/earthquakes', { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch earthquake data: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching earthquake data:", err);
        setError(err.message || "Gagal memuat data gempa");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEarthquakes(controller.signal);

    const interval = setInterval(() => {
      fetchEarthquakes();
    }, 120000); // 2 minutes

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error, refetch: fetchEarthquakes };
};
