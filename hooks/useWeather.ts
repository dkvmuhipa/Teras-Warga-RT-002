import { useState, useEffect } from 'react';

export interface WeatherData {
    temp: number;
    apparentTemp: number;
    condition: string;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    windGusts: number;
    surfacePressure: number;
    uvIndex: number;
    aqi: number;
    aqiLabel: string;
    aqiColor: string;
    pm2_5: number;
    pm10: number;
    isExtremeWind: boolean;
    isExtremeHeat: boolean;
    isHighPollution: boolean;
    alertMessage?: string;
    lastUpdated?: string;
}

export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWeather = async (signal?: AbortSignal) => {
        try {
            let weatherData: any;
            let aqiData: any;

            try {
                const [weatherRes, aqiRes] = await Promise.all([
                    fetch('/api/weather', { signal }),
                    fetch('/api/aqi', { signal })
                ]);

                if (weatherRes.ok && aqiRes.ok) {
                    const weatherContentType = weatherRes.headers.get("content-type");
                    const aqiContentType = aqiRes.headers.get("content-type");

                    if (weatherContentType?.includes("application/json") && aqiContentType?.includes("application/json")) {
                        weatherData = await weatherRes.json();
                        aqiData = await aqiRes.json();
                    }
                }
            } catch (proxyErr) {
                console.warn("Proxy fetch failed, trying direct fetch:", proxyErr);
            }

            // Fallback to direct fetch if proxy failed or returned non-JSON
            if (!weatherData || !aqiData) {
                const [directWeatherRes, directAqiRes] = await Promise.all([
                    fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,surface_pressure,uv_index', { signal }),
                    fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10', { signal })
                ]);

                if (!directWeatherRes.ok || !directAqiRes.ok) throw new Error("Failed to fetch weather or AQI from both proxy and direct API");
                
                weatherData = await directWeatherRes.json();
                aqiData = await directAqiRes.json();
            }
            
            const aqi = Math.round(aqiData?.current?.us_aqi ?? 25);
            let aqiLabel = 'Bagus';
            let aqiColor = 'text-emerald-400';
            
            if (aqi > 300) { aqiLabel = 'Berbahaya'; aqiColor = 'text-rose-700'; }
            else if (aqi > 200) { aqiLabel = 'Sangat Buruk'; aqiColor = 'text-purple-500'; }
            else if (aqi > 150) { aqiLabel = 'Tidak Sehat'; aqiColor = 'text-rose-500'; }
            else if (aqi > 100) { aqiLabel = 'Sensitif'; aqiColor = 'text-orange-500'; }
            else if (aqi > 50) { aqiLabel = 'Sedang'; aqiColor = 'text-yellow-400'; }

            const code = weatherData?.current?.weather_code ?? 0;
            let condition = 'Cerah';
            if (code >= 1 && code <= 3) condition = 'Berawan';
            else if (code === 45 || code === 48) condition = 'Berkabut';
            else if (code >= 51 && code <= 55) condition = 'Gerimis';
            else if (code >= 61 && code <= 65) condition = 'Hujan';
            else if (code >= 80 && code <= 82) condition = 'Hujan Deras';
            else if (code >= 95) condition = 'Badai Petir';

            const temp = Math.round(weatherData?.current?.temperature_2m ?? 31);
            const apparentTemp = Math.round(weatherData?.current?.apparent_temperature ?? (temp + 2));
            const windSpeed = Math.round(weatherData?.current?.wind_speed_10m ?? 8);
            const windGusts = Math.round(weatherData?.current?.wind_gusts_10m ?? Math.round(windSpeed * 1.35));
            const humidity = Math.round(weatherData?.current?.relative_humidity_2m ?? 72);
            const surfacePressure = Math.round(weatherData?.current?.surface_pressure ?? 1011);
            const uvIndex = Math.round(weatherData?.current?.uv_index ?? (code <= 3 ? 7 : 3));

            const isExtremeWind = windSpeed >= 20 || windGusts >= 32;
            const isExtremeHeat = temp >= 33 || apparentTemp >= 36;
            const isHighPollution = aqi > 100;

            let alertMessage: string | undefined;
            if (isExtremeWind) {
                alertMessage = `Waspada Hembusan Angin Kencang (${windGusts} km/h) khas lereng bukit Tondo. Amankan atap seng & kanopi.`;
            } else if (isExtremeHeat) {
                alertMessage = `Suhu Terik Ekstrem (${temp}°C, Terasa ${apparentTemp}°C). Pastikan cukup hidrasi & hindari sengatan panas langsung.`;
            } else if (isHighPollution) {
                alertMessage = `Indeks Udara Sensitif (AQI ${aqi}). Gunakan masker jika beraktivitas di luar rumah.`;
            }

            setWeather({
                temp,
                apparentTemp,
                humidity,
                windSpeed,
                windGusts,
                surfacePressure,
                uvIndex,
                condition,
                weatherCode: code,
                aqi,
                aqiLabel,
                aqiColor,
                pm2_5: Math.round(aqiData?.current?.pm2_5 ?? 6),
                pm10: Math.round(aqiData?.current?.pm10 ?? 12),
                isExtremeWind,
                isExtremeHeat,
                isHighPollution,
                alertMessage,
                lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
        } catch (err: any) {
            if (err.name === 'AbortError' || err === 'timeout') {
                console.log("Weather fetch aborted:", err);
            } else {
                console.error("Error fetching weather/AQI:", err);
            }

            if (!weather) {
                setWeather({
                    temp: 31,
                    apparentTemp: 33,
                    condition: 'Cerah Berawan',
                    weatherCode: 1,
                    humidity: 74,
                    windSpeed: 10,
                    windGusts: 14,
                    surfacePressure: 1012,
                    uvIndex: 6,
                    aqi: 32,
                    aqiLabel: 'Bagus',
                    aqiColor: 'text-emerald-400',
                    pm2_5: 7,
                    pm10: 14,
                    isExtremeWind: false,
                    isExtremeHeat: false,
                    isHighPollution: false,
                    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchWeather(controller.signal);
        
        const timer = setInterval(() => fetchWeather(), 1800000); // 30 mins
        
        return () => {
            controller.abort();
            clearInterval(timer);
        };
    }, []);

    return { weather, loading, refresh: fetchWeather };
};
