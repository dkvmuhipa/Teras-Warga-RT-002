from fastapi import APIRouter
from app.services.bmkg_service import fetch_earthquakes_data

router = APIRouter(prefix="/api", tags=["earthquakes"])

@router.get("/earthquakes")
async def get_earthquakes():
    return await fetch_earthquakes_data()
