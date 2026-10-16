from fastapi import APIRouter
from app.services.weather_service import fetch_weather_data, fetch_aqi_data

router = APIRouter(prefix="/api", tags=["weather"])

@router.get("/weather")
async def get_weather():
    return await fetch_weather_data()

@router.get("/aqi")
async def get_aqi():
    return await fetch_aqi_data()
