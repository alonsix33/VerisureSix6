import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.event import Event
from backend.api.ws import broadcast_event
from backend.services.sheriff_service import sheriff_service
from backend.services.alert_service import alert_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])


class EventCreate(BaseModel):
    device_id: str
    device_name: str | None = None
    zone: str | None = None
    event_type: str
    alert_level: str = "none"
    snapshot_path: str | None = None
    raw_payload: str | None = None


class EventResponse(BaseModel):
    id: str
    device_id: str
    device_name: str | None
    zone: str | None
    event_type: str
    alert_level: str
    snapshot_path: str | None
    sheriff_evaluated: bool
    sheriff_decision: dict | None
    notified: bool
    timestamp: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[EventResponse])
async def list_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    device_id: str | None = None,
    alert_level: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Event).order_by(desc(Event.timestamp))
    if device_id:
        stmt = stmt.where(Event.device_id == device_id)
    if alert_level:
        stmt = stmt.where(Event.alert_level == alert_level)
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(data: EventCreate, db: AsyncSession = Depends(get_db)):
    event = Event(**data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)

    decision = await sheriff_service.evaluate_event(
        event={
            "id": event.id,
            "device_id": event.device_id,
            "device_name": event.device_name,
            "event_type": event.event_type,
            "zone": event.zone,
            "alert_level": event.alert_level,
            "timestamp": event.timestamp.isoformat() if event.timestamp else None,
        },
        db=db,
    )

    event.sheriff_evaluated = True
    event.sheriff_decision = decision
    alert_level = decision.get("alert_level", "none")
    if alert_level != "none":
        event.alert_level = alert_level
    await db.commit()
    await db.refresh(event)

    if alert_level != "none":
        await alert_service.send_alert(
            message=decision.get("message", "Evento detectado"),
            level=alert_level,
        )

    await broadcast_event({
        "id": event.id,
        "device_id": event.device_id,
        "event_type": event.event_type,
        "zone": event.zone,
        "alert_level": event.alert_level,
        "sheriff_decision": decision,
        "timestamp": event.timestamp.isoformat() if event.timestamp else None,
    })

    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
