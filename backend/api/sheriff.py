from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.db.database import get_db
from backend.models.config import SheriffConfig
from backend.models.conversation import Conversation
from backend.services.sheriff_service import sheriff_service
from backend.settings import settings

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


class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    model_used: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SheriffConfig).limit(1))
    config = result.scalar_one_or_none()
    mode = config.mode if config else settings.sheriff_mode
    return {
        "mode": mode,
        "mock_sensors": settings.mock_sensors,
        "claude_available": bool(settings.anthropic_api_key.get_secret_value()),
        "openai_available": bool(settings.openai_api_key.get_secret_value()),
        "push_configured": bool(settings.vapid_public_key),
    }


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


@router.post("/chat")
async def chat(data: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Load recent history for context (last 20 turns)
    result = await db.execute(
        select(Conversation).order_by(desc(Conversation.timestamp)).limit(20)
    )
    recent = list(reversed(result.scalars().all()))
    history = [{"role": msg.role if msg.role == "user" else "assistant", "content": msg.content} for msg in recent]

    response_text, model_used, tokens = await sheriff_service.chat_with_meta(data.message, history)

    # Persist both turns
    user_msg = Conversation(role="user", content=data.message)
    sheriff_msg = Conversation(role="sheriff", content=response_text, model_used=model_used, tokens_used=tokens)
    db.add(user_msg)
    db.add(sheriff_msg)
    await db.commit()

    return {"response": response_text, "model_used": model_used}


@router.get("/chat/history", response_model=list[ChatMessage])
async def get_chat_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).order_by(desc(Conversation.timestamp)).limit(limit)
    )
    return list(reversed(result.scalars().all()))


@router.delete("/chat/history", status_code=204)
async def clear_chat_history(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    await db.execute(delete(Conversation))
    await db.commit()
