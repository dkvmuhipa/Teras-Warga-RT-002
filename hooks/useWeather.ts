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

    const fetchWeather = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const [weatherRes, aqiRes] = await Promise.all([
                fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m', { signal: controller.signal }),
                fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10', { signal: controller.signal })
            ]);

            if (!weatherRes.ok || !aqiRes.ok) throw new Error("Failed to fetch weather or AQI");

            const weatherData = await weatherRes.json();
            const aqiData = await aqiRes.json();
            
            clearTimeout(timeoutId);

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
        } catch (err) {
            clearTimeout(timeoutId);
            console.error("Error fetching weather/AQI:", err);
            // Fallback
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        const timer = setInterval(fetchWeather, 1800000); // 30 mins
        return () => clearInterval(timer);
    }, []);

    return { weather, loading, refresh: fetchWeather };
};
