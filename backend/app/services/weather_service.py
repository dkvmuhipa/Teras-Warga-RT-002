import logging
import httpx

logger = logging.getLogger("weather")

FALLBACK_WEATHER = {
    "current": {
        "temperature_2m": 30,
        "relative_humidity_2m": 75,
        "weather_code": 1,
        "wind_speed_10m": 5
    }
}

FALLBACK_AQI = {
    "current": {
        "us_aqi": 25,
        "pm2_5": 5,
        "pm10": 10
    }
}

async def fetch_weather_data():
    url = "https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"Weather API non-200 status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Weather proxy error or timeout: {e}")
    return FALLBACK_WEATHER

async def fetch_aqi_data():
    url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"AQI API non-200 status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"AQI proxy error or timeout: {e}")
    return FALLBACK_AQI
