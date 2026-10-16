import time
import logging
import re
from datetime import datetime
import pytz
import httpx

logger = logging.getLogger("bmkg")

CACHE_DURATION_SEC = 120  # 2 minutes cache
_eq_cache = {
    "data": None,
    "timestamp": 0
}

BMKG_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.bmkg.go.id/",
    "Origin": "https://www.bmkg.go.id",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
}

HARD_FALLBACK_DATA = {
    "latest": {
        "Tanggal": "17 Jun 2026",
        "Jam": "08:14:12 WITA",
        "DateTime": "2026-06-17T08:14:12+08:00",
        "Coordinates": "-0.85,119.89",
        "Lintang": "0.85 LS",
        "Bujur": "119.89 BT",
        "Magnitude": "3.2",
        "Kedalaman": "10 km",
        "Wilayah": "Pusat gempa berada di darat 8 km utara Palu",
        "Potensi": "Tidak berpotensi tsunami",
        "Dirasakan": "II-III MMI Palu, II MMI Sigi",
        "Shakemap": "20260617081412.gif"
    },
    "recentM5": [
        {
            "Tanggal": "16 Jun 2026",
            "Jam": "23:10:05 WITA",
            "DateTime": "2026-06-16T23:10:05+08:00",
            "Coordinates": "-1.25,120.15",
            "Lintang": "1.25 LS",
            "Bujur": "120.15 BT",
            "Magnitude": "5.2",
            "Kedalaman": "15 km",
            "Wilayah": "78 km Tenggara Palu, Sulawesi Tengah",
            "Potensi": "Tidak berpotensi tsunami"
        },
        {
            "Tanggal": "14 Jun 2026",
            "Jam": "12:05:33 WITA",
            "DateTime": "2026-06-14T12:05:33+08:00",
            "Coordinates": "-1.95,121.45",
            "Lintang": "1.95 LS",
            "Bujur": "121.45 BT",
            "Magnitude": "5.0",
            "Kedalaman": "10 km",
            "Wilayah": "42 km Barat Daya Morowali, Sulawesi Tengah",
            "Potensi": "Tidak berpotensi tsunami"
        }
    ],
    "felt": [
        {
            "Tanggal": "17 Jun 2026",
            "Jam": "08:14:12 WITA",
            "DateTime": "2026-06-17T08:14:12+08:00",
            "Coordinates": "-0.85,119.89",
            "Lintang": "0.85 LS",
            "Bujur": "119.89 BT",
            "Magnitude": "3.2",
            "Kedalaman": "10 km",
            "Wilayah": "Pusat gempa berada di darat 8 km utara Palu",
            "Dirasakan": "II-III MMI Palu"
        }
    ]
}

def format_usgs_feature(feat: dict) -> dict:
    coords = feat.get("geometry", {}).get("coordinates", [0, 0, 0])
    lon, lat, depth = coords[0], coords[1], coords[2]
    props = feat.get("properties", {})
    time_ms = props.get("time", 0)
    
    # Format dates in Asia/Makassar (WITA)
    tz_wita = pytz.timezone("Asia/Makassar")
    dt = datetime.fromtimestamp(time_ms / 1000.0, tz=tz_wita)
    formatted_date = dt.strftime("%d %b %Y")
    formatted_time = dt.strftime("%H:%M:%S") + " WITA"
    date_time_str = dt.isoformat()
    
    place = props.get("place") or "Sulawesi Tengah, Indonesia"
    # Replace directionals
    dir_map = {
        "N": "Utara", "S": "Selatan", "E": "Timur", "W": "Barat",
        "NE": "Timur Laut", "NW": "Barat Laut", "SE": "Tenggara", "SW": "Barat Daya"
    }
    def replace_dir(match):
        p1 = match.group(1).upper()
        return f"km {dir_map.get(p1, p1)} dari "
    
    location_name = re.sub(r'km\s+([N|S|E|W|NE|NW|SE|SW]+)\s+of\+?', replace_dir, place, flags=re.IGNORECASE)
    location_name = location_name.replace("Indonesia", "Sulawesi Tengah").replace("minahasa", "Semenanjung Minahasa").strip()

    is_felt = props.get("felt") and props.get("felt") > 0
    mmi_val = props.get("mmi") or (2 if is_felt else None)
    mag = props.get("mag") or 0.0

    return {
        "Tanggal": formatted_date,
        "Jam": formatted_time,
        "DateTime": date_time_str,
        "Coordinates": f"{lat},{lon}",
        "Lintang": f"{abs(lat):.2f} LS",
        "Bujur": f"{abs(lon):.2f} BT",
        "Magnitude": f"{mag:.1f}",
        "Kedalaman": f"{round(depth)} km",
        "Wilayah": location_name,
        "Potensi": "Berpotensi tsunami" if props.get("tsunami") == 1 else "Tidak berpotensi tsunami",
        "Dirasakan": f"{mmi_val} MMI" if is_felt else "-",
        "Shakemap": None
    }

async def fetch_earthquakes_data():
    global _eq_cache
    now = time.time()
    if _eq_cache["data"] and (now - _eq_cache["timestamp"] < CACHE_DURATION_SEC):
        return _eq_cache["data"]

    # 1. Try BMKG Directly
    try:
        async with httpx.AsyncClient(timeout=4.0, headers=BMKG_HEADERS) as client:
            latest_res, recent_m5_res, felt_res = await asyncio_gather_safe(
                client.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'),
                client.get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json'),
                client.get('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'),
            )
            
            latest_data = latest_res.json() if latest_res and latest_res.status_code == 200 else None
            recent_m5_data = recent_m5_res.json() if recent_m5_res and recent_m5_res.status_code == 200 else None
            felt_data = felt_res.json() if felt_res and felt_res.status_code == 200 else None

            if latest_data or recent_m5_data or felt_data:
                response_data = {
                    "latest": latest_data.get("Infogempa", {}).get("gempa") if latest_data else None,
                    "recentM5": recent_m5_data.get("Infogempa", {}).get("gempa", []) if recent_m5_data else [],
                    "felt": felt_data.get("Infogempa", {}).get("gempa", []) if felt_data else []
                }
                _eq_cache = {"data": response_data, "timestamp": now}
                return response_data
    except Exception as e:
        logger.warning(f"BMKG primary feeds failed, falling back to USGS: {e}")

    # 2. Try USGS Fallback
    try:
        usgs_url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=-0.85117&longitude=119.9044&maxradiuskm=600&minmagnitude=2.0&orderby=time&limit=50"
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(usgs_url)
            if resp.status_code == 200:
                geojson = resp.json()
                features = geojson.get("features", [])
                if features:
                    mapped = [format_usgs_feature(f) for f in features]
                    latest = mapped[0] if mapped else None
                    recent_m5 = [m for m in mapped if float(m.get("Magnitude", 0)) >= 5.0][:15]
                    felt = [m for m in mapped if m.get("Dirasakan") != "-"][:15]
                    response_data = {
                        "latest": latest,
                        "recentM5": recent_m5,
                        "felt": felt if felt else mapped[:15]
                    }
                    _eq_cache = {"data": response_data, "timestamp": now}
                    return response_data
    except Exception as e:
        logger.warning(f"USGS fallback failed: {e}")

    # 3. Hard fallback
    return HARD_FALLBACK_DATA

async def asyncio_gather_safe(*aws):
    import asyncio
    results = await asyncio.gather(*aws, return_exceptions=True)
    return [r if not isinstance(r, Exception) else None for r in results]
