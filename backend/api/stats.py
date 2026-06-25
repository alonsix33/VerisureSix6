from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.event import Event
from backend.models.alert import Alert

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    # Counts
    today_total = await db.scalar(
        select(func.count(Event.id)).where(Event.timestamp >= today_start)
    ) or 0

    today_alerts = await db.scalar(
        select(func.count(Event.id)).where(
            and_(Event.timestamp >= today_start, Event.alert_level != "none")
        )
    ) or 0

    week_total = await db.scalar(
        select(func.count(Event.id)).where(Event.timestamp >= week_start)
    ) or 0

    unread_alerts = await db.scalar(
        select(func.count(Alert.id)).where(Alert.was_read == False)
    ) or 0

    # Events by zone (last 24h)
    zone_counts_result = await db.execute(
        select(Event.zone, func.count(Event.id).label("count"))
        .where(Event.timestamp >= now - timedelta(hours=24))
        .group_by(Event.zone)
        .order_by(desc("count"))
    )
    by_zone = [{"zone": row.zone or "unknown", "count": row.count} for row in zone_counts_result]

    # Events by hour (last 24h) for chart
    hourly_result = await db.execute(
        select(
            func.strftime("%H", Event.timestamp).label("hour"),
            func.count(Event.id).label("count"),
        )
        .where(Event.timestamp >= now - timedelta(hours=24))
        .group_by("hour")
        .order_by("hour")
    )
    by_hour = [{"hour": int(row.hour), "count": row.count} for row in hourly_result]

    # Fill missing hours with 0
    hour_map = {row["hour"]: row["count"] for row in by_hour}
    current_hour = now.hour
    hourly_full = []
    for i in range(24):
        h = (current_hour - 23 + i) % 24
        hourly_full.append({"hour": h, "count": hour_map.get(h, 0)})

    # Latest critical events
    critical_result = await db.execute(
        select(Event)
        .where(Event.alert_level.in_(["high", "critical"]))
        .order_by(desc(Event.timestamp))
        .limit(5)
    )
    critical_events = [
        {
            "id": e.id,
            "zone": e.zone,
            "event_type": e.event_type,
            "alert_level": e.alert_level,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in critical_result.scalars()
    ]

    return {
        "today": {
            "total_events": today_total,
            "alerts": today_alerts,
            "unread_alerts": unread_alerts,
        },
        "week": {
            "total_events": week_total,
        },
        "by_zone": by_zone,
        "by_hour": hourly_full,
        "critical_events": critical_events,
        "generated_at": now.isoformat(),
    }


@router.get("/weekly")
async def get_weekly_report(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    days = []
    for i in range(7):
        day_start = (now - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        total = await db.scalar(
            select(func.count(Event.id)).where(
                and_(Event.timestamp >= day_start, Event.timestamp < day_end)
            )
        ) or 0

        alerts = await db.scalar(
            select(func.count(Event.id)).where(
                and_(
                    Event.timestamp >= day_start,
                    Event.timestamp < day_end,
                    Event.alert_level != "none",
                )
            )
        ) or 0

        days.append({
            "date": day_start.date().isoformat(),
            "total": total,
            "alerts": alerts,
        })

    return {"days": days, "generated_at": now.isoformat()}
