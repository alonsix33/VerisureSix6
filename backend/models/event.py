import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id: Mapped[str] = mapped_column(ForeignKey("devices.device_id"), index=True)
    device_name: Mapped[str] = mapped_column(String, nullable=True)
    zone: Mapped[str] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String)
    alert_level: Mapped[str] = mapped_column(String, default="none")
    snapshot_path: Mapped[str] = mapped_column(String, nullable=True)
    raw_payload: Mapped[str] = mapped_column(Text, nullable=True)
    decrypted: Mapped[bool] = mapped_column(Boolean, default=False)
    sheriff_evaluated: Mapped[bool] = mapped_column(Boolean, default=False)
    sheriff_decision: Mapped[dict] = mapped_column(JSON, nullable=True)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device: Mapped["Device"] = relationship(back_populates="events")
