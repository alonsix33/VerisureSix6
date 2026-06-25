import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Boolean, JSON, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.database import Base


class SheriffConfig(Base):
    __tablename__ = "sheriff_config"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mode: Mapped[str] = mapped_column(String, default="casa")
    vision_threshold: Mapped[float] = mapped_column(Float, default=0.85)
    alert_zones: Mapped[list] = mapped_column(JSON, default=lambda: [])
    ignored_zones: Mapped[list] = mapped_column(JSON, default=lambda: [])
    schedule: Mapped[dict] = mapped_column(JSON, nullable=True)
    travel_periods: Mapped[list] = mapped_column(JSON, nullable=True)
    cooldown_minutes: Mapped[int] = mapped_column(Integer, default=5)
    escalation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
