import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.config import settings
from app.services.firebase import init_firebase
from app.routers import weather, earthquakes, media, whatsapp, push, gemini

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teras-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing services...")
    init_firebase()
    yield
    logger.info("Shutting down services...")

fastapi_app = FastAPI(
    title="Teras Warga RT 02 API",
    description="Python FastAPI backend for Teras Warga RT 02",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
fastapi_app.include_router(weather.router)
fastapi_app.include_router(earthquakes.router)
fastapi_app.include_router(media.router)
fastapi_app.include_router(whatsapp.router)
fastapi_app.include_router(push.router)
fastapi_app.include_router(gemini.router)

@fastapi_app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "Teras Warga RT 02 Python API",
        "version": "1.0.0"
    }

# Socket.IO setup for Emergency Realtime Alert
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket user connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket user disconnected: {sid}")

@sio.on("emergency:triggered")
async def handle_emergency_triggered(sid, data):
    logger.info(f"🚨 Emergency triggered from {sid}: {data}")
    # Broadcast to all connected clients
    await sio.emit("emergency:alert", data)

# Wrap FastAPI inside Socket.IO ASGI application so both HTTP & WebSockets run on same port
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
