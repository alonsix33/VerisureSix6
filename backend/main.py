import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.database import init_db
from backend.api import events, devices, ws
from backend.api import sheriff, schedules, travel, stats, push
from backend.settings import settings
from backend.services.rf_service import RFService
from backend.services.tapo_service import TapoService
from backend.services.alert_service import alert_service
from backend.services.mock_sensor_service import mock_sensor_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

rf_service = RFService()
tapo_service = TapoService(
    email=settings.tapo_email,
    password=settings.tapo_password.get_secret_value(),
)
alert_service.bot_token = settings.telegram_bot_token.get_secret_value()
alert_service.chat_id = settings.telegram_chat_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Inicializando base de datos...")
    await init_db()

    logger.info("Iniciando servicios...")
    await rf_service.start()
    await tapo_service.start()

    if settings.mock_sensors:
        logger.info("MOCK_SENSORS=true — iniciando simulación de sensores")
        await mock_sensor_service.start()

    logger.info("Sheriff Home listo")
    yield

    logger.info("Deteniendo servicios...")
    if settings.mock_sensors:
        await mock_sensor_service.stop()
    await rf_service.stop()
    await tapo_service.stop()
    logger.info("Servicios detenidos")


app = FastAPI(
    title="Sheriff Home API",
    description="Plataforma de seguridad hogareña con IA",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Routers
app.include_router(events.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(sheriff.router, prefix="/api/v1")
app.include_router(schedules.router, prefix="/api/v1")
app.include_router(travel.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(push.router, prefix="/api/v1")
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.2.0",
        "sheriff_mode": settings.sheriff_mode,
        "mock_sensors": settings.mock_sensors,
        "services": {
            "rf": await rf_service.get_status(),
            "tapo": await tapo_service.get_status(),
        },
    }
