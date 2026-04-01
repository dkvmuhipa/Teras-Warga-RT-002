import { useState, useEffect } from 'react';

export interface WeatherData {
    temp: number;
    condition: string;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    aqi: number;
    aqiLabel: string;
    aqiColor: string;
    pm2_5: number;
    pm10: number;
}

export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWeather = async (signal?: AbortSignal) => {
        try {
            const [weatherRes, aqiRes] = await Promise.all([
                fetch('/api/weather', { signal }),
                fetch('/api/aqi', { signal })
            ]);

            if (!weatherRes.ok || !aqiRes.ok) throw new Error("Failed to fetch weather or AQI from proxy");

            const weatherContentType = weatherRes.headers.get("content-type");
            const aqiContentType = aqiRes.headers.get("content-type");

            if (!weatherContentType?.includes("application/json")) {
                const text = await weatherRes.text();
                console.error("Weather API returned non-JSON:", text.substring(0, 200));
                throw new Error("Weather API returned non-JSON response");
            }

            if (!aqiContentType?.includes("application/json")) {
                const text = await aqiRes.text();
                console.error("AQI API returned non-JSON:", text.substring(0, 200));
                throw new Error("AQI API returned non-JSON response");
            }

            const weatherData = await weatherRes.json();
            const aqiData = await aqiRes.json();
            
            const aqi = aqiData.current.us_aqi;
            let aqiLabel = 'Bagus';
            let aqiColor = 'text-emerald-400';
            
            if (aqi > 300) { aqiLabel = 'Berbahaya'; aqiColor = 'text-rose-700'; }
            else if (aqi > 200) { aqiLabel = 'Sangat Buruk'; aqiColor = 'text-purple-500'; }
            else if (aqi > 150) { aqiLabel = 'Tidak Sehat'; aqiColor = 'text-rose-500'; }
            else if (aqi > 100) { aqiLabel = 'Sensitif'; aqiColor = 'text-orange-500'; }
            else if (aqi > 50) { aqiLabel = 'Sedang'; aqiColor = 'text-yellow-400'; }

            const code = weatherData.current.weather_code;
            let condition = 'Cerah';
            if (code >= 1 && code <= 3) condition = 'Berawan';
            else if (code === 45 || code === 48) condition = 'Berkabut';
            else if (code >= 51 && code <= 55) condition = 'Gerimis';
            else if (code >= 61 && code <= 65) condition = 'Hujan';
            else if (code >= 80 && code <= 82) condition = 'Hujan Deras';
            else if (code >= 95) condition = 'Badai Petir';

            setWeather({
                temp: Math.round(weatherData.current.temperature_2m),
                humidity: Math.round(weatherData.current.relative_humidity_2m),
                windSpeed: Math.round(weatherData.current.wind_speed_10m),
                condition,
                weatherCode: code,
                aqi,
                aqiLabel,
                aqiColor,
                pm2_5: aqiData.current.pm2_5,
                pm10: aqiData.current.pm10
            });
        } catch (err: any) {
            // Don't log abort errors as they are expected on unmount or timeout
            if (err.name === 'AbortError' || err === 'timeout') {
                console.log("Weather fetch aborted:", err);
            } else {
                console.error("Error fetching weather/AQI:", err);
            }

            // Fallback only if we don't have weather data yet
            if (!weather) {
                setWeather({
                    temp: 30,
                    condition: 'Cerah',
                    weatherCode: 0,
                    humidity: 75,
                    windSpeed: 5,
                    aqi: 25,
                    aqiLabel: 'Bagus',
                    aqiColor: 'text-emerald-400',
                    pm2_5: 5,
                    pm10: 10
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
