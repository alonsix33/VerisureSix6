import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.event import Event
from backend.models.config import SheriffConfig

logger = logging.getLogger(__name__)


class RAGService:
    async def build_context(self, event: dict, db: AsyncSession) -> str:
        device_id = event.get("device_id", "")
        zone = event.get("zone", "")
        try:
            event_time = datetime.fromisoformat(event["timestamp"]) if event.get("timestamp") else datetime.now(timezone.utc)
        except (ValueError, KeyError):
            event_time = datetime.now(timezone.utc)

        recent_count = await self._count_events_last_hours(db, 2, device_id)
        zone_recent = await self._count_events_last_hours(db, 2, zone=zone) if zone else 0
        same_device = await self._last_events_by_device(db, device_id, limit=10)
        today_count = await self._count_events_today(db, device_id)
        normal_pattern = await self._normal_pattern(db, device_id, event_time)

        config = await self._get_sheriff_config(db)

        context = {
            "event": {
                "device_id": device_id,
                "zone": zone,
                "type": event.get("event_type", ""),
                "timestamp": event.get("timestamp", ""),
            },
            "recent_activity": {
                "last_2h_total": recent_count,
                "last_2h_zone": zone_recent,
                "today_total": today_count,
            },
            "same_device_recent_events": [
                {
                    "timestamp": e.timestamp.isoformat() if e.timestamp else "",
                    "event_type": e.event_type,
                    "zone": e.zone,
                    "alert_level": e.alert_level,
                }
                for e in same_device
            ],
            "normal_pattern": {
                "avg_events_this_hour": normal_pattern.get("avg_hour", 0),
                "avg_events_today_week": normal_pattern.get("avg_today", 0),
                "is_typical_time": normal_pattern.get("is_typical", True),
            },
            "sheriff_mode": config.mode if config else "monitor",
            "sheriff_schedule": config.schedule if config else None,
            "current_time": event_time.isoformat(),
        }

        import json
        return json.dumps(context, indent=2, ensure_ascii=False)

    async def get_trend_analysis(self, device_id: str, days: int, db: AsyncSession) -> str:
        now = datetime.now(timezone.utc)
        period_start = now - timedelta(days=days)
        prev_start = period_start - timedelta(days=days)

        current = await self._count_events_since(db, device_id, period_start)
        previous = await self._count_events_since(db, device_id, prev_start, period_start)

        import json
        return json.dumps({
            "device_id": device_id,
            "period_days": days,
            "current_period_events": current,
            "previous_period_events": previous,
            "change": "up" if current > previous else ("down" if current < previous else "stable"),
            "change_pct": round(((current - previous) / max(previous, 1)) * 100, 1),
        }, indent=2, ensure_ascii=False)

    async def _count_events_last_hours(self, db: AsyncSession, hours: int, device_id: str = "", zone: str = "") -> int:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        stmt = select(func.count(Event.id)).where(Event.timestamp >= since)
        if device_id:
            stmt = stmt.where(Event.device_id == device_id)
        if zone:
            stmt = stmt.where(Event.zone == zone)
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _count_events_since(self, db: AsyncSession, device_id: str, since: datetime, until: datetime | None = None) -> int:
        stmt = select(func.count(Event.id)).where(
            and_(Event.device_id == device_id, Event.timestamp >= since)
        )
        if until:
            stmt = stmt.where(Event.timestamp < until)
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _count_events_today(self, db: AsyncSession, device_id: str) -> int:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.count(Event.id)).where(
            and_(Event.device_id == device_id, Event.timestamp >= today_start)
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _last_events_by_device(self, db: AsyncSession, device_id: str, limit: int = 10) -> list[Event]:
        stmt = (
            select(Event)
            .where(Event.device_id == device_id)
            .order_by(desc(Event.timestamp))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def _normal_pattern(self, db: AsyncSession, device_id: str, event_time: datetime) -> dict:
        hour = event_time.hour
        weekday = event_time.weekday()
        two_weeks_ago = event_time - timedelta(days=14)

        count_in_window = await self._count_events_since(
            db, device_id, two_weeks_ago, event_time
        )
        avg_daily = round(count_in_window / max(14, 1), 1) if event_time > two_weeks_ago else 0

        events_same_hour = await self._count_events_in_hour_window(
            db, device_id, hour, two_weeks_ago, event_time
        )
        avg_this_hour = round(events_same_hour / max(14, 1), 1) if event_time > two_weeks_ago else 0

        today_count = await self._count_events_today(db, device_id)

        return {
            "avg_daily_last_14d": avg_daily,
            "avg_this_hour_last_14d": avg_this_hour,
            "events_today": today_count,
            "is_typical": avg_this_hour <= 2,
        }

    async def _count_events_in_hour_window(
        self, db: AsyncSession, device_id: str, hour: int, since: datetime, until: datetime | None = None
    ) -> int:
        hour_str = f"{hour:02d}"
        stmt = select(func.count(Event.id)).where(
            and_(
                Event.device_id == device_id,
                Event.timestamp >= since,
                func.strftime("%H", Event.timestamp) == hour_str,
            )
        )
        if until:
            stmt = stmt.where(Event.timestamp < until)
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def _get_sheriff_config(self, db: AsyncSession) -> SheriffConfig | None:
        result = await db.execute(
            select(SheriffConfig).order_by(desc(SheriffConfig.updated_at)).limit(1)
        )
        return result.scalar_one_or_none()


rag_service = RAGService()
