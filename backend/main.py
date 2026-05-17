import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.database import init_db
from backend.api import events, devices, sheriff, ws
from backend.settings import settings
from backend.services.rf_service import RFService
from backend.services.tapo_service import TapoService
from backend.services.alert_service import alert_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


rf_service = RFService()
tapo_service = TapoService(email=settings.tapo_email, password=settings.tapo_password)
alert_service.bot_token = settings.telegram_bot_token.get_secret_value()
alert_service.chat_id = settings.telegram_chat_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando base de datos...")
    await init_db()
    logger.info("Iniciando servicios...")
    await rf_service.start()
    await tapo_service.start()
    logger.info("Todos los servicios iniciados")
    yield
    logger.info("Deteniendo servicios...")
    await rf_service.stop()
    await tapo_service.stop()
    logger.info("Servicios detenidos")


app = FastAPI(
    title="VerisureSix6 - Sheriff API",
    description="Plataforma de seguridad hogareña con IA",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(sheriff.router, prefix="/api/v1")
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.1.0",
        "sheriff_mode": settings.sheriff_mode,
        "services": {
            "rf": await rf_service.get_status(),
            "tapo": await tapo_service.get_status(),
        },
    }
