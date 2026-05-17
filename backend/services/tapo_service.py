import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class TapoService:
    def __init__(self, email: str = "", password: str = ""):
        self.email = email
        self.password = password
        self.hub_host = ""
        self.hub = None
        self.running = False

    async def start(self):
        if not self.email or not self.password:
            logger.warning("TapoService: credenciales no configuradas")
            return
        self.running = True
        logger.info("TapoService iniciado")

    async def stop(self):
        self.running = False
        logger.info("TapoService detenido")

    async def _discover_hub(self):
        try:
            from kasa import Discover

            devices = await Discover.discover(
                username=self.email,
                password=self.password,
            )
            for addr, dev in devices.items():
                if dev.model and "H200" in dev.model:
                    self.hub_host = addr
                    self.hub = dev
                    logger.info(f"Tapo H200 encontrado en {addr}")
                    return dev
            logger.warning("Tapo H200 no encontrado en la red")
            return None
        except Exception as e:
            logger.error(f"Error descubriendo hub Tapo: {e}")
            return None

    async def poll_events(self):
        return []

    async def get_snapshot(self, device_id: str = "") -> str | None:
        logger.info(f"Snapshot solicitado para dispositivo {device_id or 'default'}")
        return None

    async def get_status(self) -> dict:
        return {
            "running": self.running,
            "hub": "H200" if self.hub else "disconnected",
            "camera": "C420",
        }
