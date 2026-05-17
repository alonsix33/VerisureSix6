from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.device import Device
from pydantic import BaseModel

router = APIRouter(prefix="/devices", tags=["devices"])


class DeviceCreate(BaseModel):
    device_id: str
    name: str
    device_type: str
    zone: str | None = None
    protocol: str = "verisure"


class DeviceUpdate(BaseModel):
    name: str | None = None
    zone: str | None = None
    enabled: bool | None = None


class DeviceResponse(BaseModel):
    id: str
    device_id: str
    name: str
    device_type: str
    zone: str | None
    protocol: str
    battery_level: int | None
    signal_strength: int | None
    enabled: bool
    last_seen: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[DeviceResponse])
async def list_devices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device))
    return result.scalars().all()


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("", response_model=DeviceResponse, status_code=201)
async def create_device(data: DeviceCreate, db: AsyncSession = Depends(get_db)):
    device = Device(**data.model_dump())
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: str, data: DeviceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(device, key, val)
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
async def delete_device(device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await db.commit()
