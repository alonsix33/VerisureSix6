import asyncio
import logging
import random
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

MOCK_DEVICES = [
    {"device_id": "PIR-SALA-001", "name": "PIR Sala Principal", "device_type": "verisure_pir", "zone": "sala", "protocol": "verisure"},
    {"device_id": "PIR-COCINA-001", "name": "PIR Cocina", "device_type": "verisure_pir", "zone": "cocina", "protocol": "verisure"},
    {"device_id": "CAM-BALCON-001", "name": "Cámara Balcón", "device_type": "tapo_camera", "zone": "balcon", "protocol": "tapo"},
    {"device_id": "PIR-DORMITORIO-001", "name": "PIR Dormitorio", "device_type": "verisure_pir", "zone": "dormitorio", "protocol": "verisure"},
    {"device_id": "HUB-VERISURE-001", "name": "Hub Verisure ES6502", "device_type": "verisure_hub", "zone": "entrada", "protocol": "verisure"},
]

EVENT_TEMPLATES = [
    {"event_type": "motion_detected", "weight": 50},
    {"event_type": "camera_snapshot", "weight": 20},
    {"event_type": "zone_crossed", "weight": 20},
    {"event_type": "alarm_triggered", "weight": 5},
    {"event_type": "system_heartbeat", "weight": 5},
]


class MockSensorService:
    def __init__(self):
        self.running = False
        self._task: asyncio.Task | None = None
        self._base_url = "http://127.0.0.1:8000"
        self._devices_seeded = False

    async def start(self):
        self.running = True
        logger.info("MockSensorService: iniciando simulación de sensores")
        self._task = asyncio.create_task(self._run())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _seed_devices(self, client: httpx.AsyncClient):
        for device in MOCK_DEVICES:
            try:
                r = await client.get(f"{self._base_url}/api/v1/devices/{device['device_id']}")
                if r.status_code == 404:
                    await client.post(f"{self._base_url}/api/v1/devices", json=device)
                    logger.info(f"MockSensor: dispositivo registrado {device['device_id']}")
            except Exception as e:
                logger.warning(f"MockSensor: error registrando dispositivo: {e}")
        self._devices_seeded = True

    async def _run(self):
        await asyncio.sleep(3)  # esperar que FastAPI arranque
        async with httpx.AsyncClient(timeout=10) as client:
            if not self._devices_seeded:
                await self._seed_devices(client)

            while self.running:
                try:
                    await self._emit_event(client)
                except Exception as e:
                    logger.warning(f"MockSensor: error emitiendo evento: {e}")
                # Intervalo aleatorio entre 8-30 segundos
                await asyncio.sleep(random.uniform(8, 30))

    async def _emit_event(self, client: httpx.AsyncClient):
        device = random.choice(MOCK_DEVICES)
        event_type = random.choices(
            [t["event_type"] for t in EVENT_TEMPLATES],
            weights=[t["weight"] for t in EVENT_TEMPLATES],
        )[0]

        payload = {
            "device_id": device["device_id"],
            "device_name": device["name"],
            "zone": device["zone"],
            "event_type": event_type,
            "alert_level": "none",
            "raw_payload": f"mock:{event_type}:{datetime.now(timezone.utc).isoformat()}",
        }

        r = await client.post(f"{self._base_url}/api/v1/events", json=payload)
        if r.status_code == 201:
            logger.info(f"MockSensor: {event_type} en {device['zone']}")
        else:
            logger.warning(f"MockSensor: respuesta inesperada {r.status_code}")


mock_sensor_service = MockSensorService()
