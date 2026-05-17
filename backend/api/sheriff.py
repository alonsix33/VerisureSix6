from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.models.config import SheriffConfig
from backend.services.sheriff_service import sheriff_service
from pydantic import BaseModel

router = APIRouter(prefix="/sheriff", tags=["sheriff"])


class SheriffConfigUpdate(BaseModel):
    mode: str | None = None
    vision_threshold: float | None = None
    alert_zones: list | None = None
    ignored_zones: list | None = None
    schedule: dict | None = None
    travel_periods: list | None = None
    cooldown_minutes: int | None = None
    escalation_enabled: bool | None = None


class SheriffConfigResponse(BaseModel):
    id: str
    mode: str
    vision_threshold: float
    alert_zones: list
    ignored_zones: list
    schedule: dict | None
    travel_periods: list | None
    cooldown_minutes: int
    escalation_enabled: bool
    updated_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.get("/config", response_model=SheriffConfigResponse)
async def get_config(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SheriffConfig).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = SheriffConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


@router.patch("/config", response_model=SheriffConfigResponse)
async def update_config(data: SheriffConfigUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SheriffConfig).limit(1))
    config = result.scalar_one_or_none()
    if not config:
        config = SheriffConfig()
        db.add(config)
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(config, key, val)
    await db.commit()
    await db.refresh(config)
    return config


@router.post("/chat", response_model=ChatResponse)
async def chat(data: ChatRequest):
    response = await sheriff_service.chat(data.message)
    return ChatResponse(response=response)
