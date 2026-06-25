import json
import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.settings import settings

logger = logging.getLogger(__name__)


class PushService:
    def __init__(self):
        self._vapid_configured = bool(
            settings.vapid_public_key
            and settings.vapid_private_key.get_secret_value()
            and settings.vapid_email
        )

    def _get_vapid_claims(self) -> dict:
        return {"sub": f"mailto:{settings.vapid_email}"}

    async def send_to_all(self, title: str, body: str, data: dict[str, Any] | None = None, db: AsyncSession | None = None):
        if not self._vapid_configured:
            logger.debug("PushService: VAPID no configurado, omitiendo push")
            return

        if db is None:
            return

        try:
            from pywebpush import webpush, WebPushException
        except ImportError:
            logger.warning("PushService: pywebpush no instalado — pip install pywebpush")
            return

        from backend.models.conversation import PushSubscription
        result = await db.execute(select(PushSubscription))
        subscriptions = result.scalars().all()

        if not subscriptions:
            return

        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/icon-192.png",
            "badge": "/icon-72.png",
            "data": data or {},
        })

        private_key = settings.vapid_private_key.get_secret_value()
        failed = []

        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                    },
                    data=payload,
                    vapid_private_key=private_key,
                    vapid_claims=self._get_vapid_claims(),
                )
            except Exception as e:
                logger.warning(f"PushService: falló push a {sub.endpoint[:40]}…: {e}")
                failed.append(sub.id)

        if failed:
            for sub_id in failed:
                sub = await db.get(PushSubscription, sub_id)
                if sub:
                    await db.delete(sub)
            await db.commit()
            logger.info(f"PushService: {len(failed)} suscripción(es) inválida(s) eliminada(s)")


push_service = PushService()
