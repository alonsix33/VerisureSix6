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
        self.children: list = []
        self.running = False
        self._poll_task: asyncio.Task | None = None

    async def start(self):
        if not self.email or not self.password:
            logger.warning("TapoService: credenciales no configuradas")
            return
        self.running = True
        await self._discover_hub()
        if self.hub:
            self._poll_task = asyncio.create_task(self._poll_loop())
        logger.info(f"TapoService iniciado — hub: {'conectado' if self.hub else 'no encontrado'}")

    async def stop(self):
        self.running = False
        if self._poll_task:
            self._poll_task.cancel()
            self._poll_task = None
        logger.info("TapoService detenido")

    async def _discover_hub(self):
        try:
            from kasa import Discover

            devices = await Discover.discover(
                username=self.email,
                password=self.password,
                timeout=5,
            )
            for addr, dev in devices.items():
                if dev.model and "H200" in dev.model:
                    self.hub_host = addr
                    self.hub = dev
                    await dev.update()
                    self.children = list(dev.children) if hasattr(dev, "children") else []
                    logger.info(
                        f"Tapo H200 encontrado en {addr} "
                        f"con {len(self.children)} dispositivos conectados"
                    )
                    return dev
            logger.warning("Tapo H200 no encontrado en la red")
            return None
        except Exception as e:
            logger.error(f"Error descubriendo hub Tapo: {e}")
            return None

    async def _poll_loop(self):
        while self.running:
            try:
                if self.hub:
                    await self.hub.update()
            except Exception as e:
                logger.warning(f"Tapo poll error: {e}")
            await asyncio.sleep(5)

    async def get_snapshot(self, device_id: str = "") -> str | None:
        if not self.hub:
            logger.warning("Tapo snapshot: hub no conectado")
            return None

        camera = None
        for child in self.children:
            if child.model and "C420" in child.model:
                camera = child
                break

        if not camera:
            logger.info("Tapo snapshot: C420 no encontrada entre los hijos del hub")
            return None

        try:
            await camera.update()
            logger.info(f"Snapshot solicitado desde {camera.alias}")
            return None
        except Exception as e:
            logger.error(f"Tapo snapshot error: {e}")
            return None

    async def get_events(self) -> list[dict]:
        if not self.hub:
            return []
        try:
            await self.hub.update()
            events = []
            for child in self.children:
                events.append({
                    "device_id": child.device_id,
                    "name": child.alias or child.device_id,
                    "model": child.model or "unknown",
                    "type": "tapo",
                })
            return events
        except Exception as e:
            logger.error(f"Tapo get_events error: {e}")
            return []

    async def get_status(self) -> dict:
        return {
            "running": self.running,
            "hub": self.hub_host if self.hub else "disconnected",
            "children": len(self.children),
            "camera": "C420",
        }
