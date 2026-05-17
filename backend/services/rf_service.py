import asyncio
import logging

logger = logging.getLogger(__name__)


class RFService:
    def __init__(self):
        self.running = False

    async def start(self):
        self.running = True
        logger.info("RFService iniciado (placeholder — esperando RTL-SDR)")

    async def stop(self):
        self.running = False
        logger.info("RFService detenido")

    async def get_status(self) -> dict:
        return {
            "running": self.running,
            "device": "RTL-SDR Blog V3 (pendiente)",
            "frequency": "869.036 MHz",
            "status": "waiting_for_hardware" if not self.running else "active",
        }
