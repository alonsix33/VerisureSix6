import asyncio
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_URL = "http://127.0.0.1:8000"
POLL_INTERVAL = 0.1


async def process_frame(frame: bytes):
    logger.info(f"Frame recibido: {frame.hex()}")


async def main():
    logger.info("RF Listener iniciado (placeholder)")
    while True:
        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
