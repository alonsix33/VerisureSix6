import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    device_type: Mapped[str] = mapped_column(String)
    zone: Mapped[str] = mapped_column(String, nullable=True)
    protocol: Mapped[str] = mapped_column(String, default="verisure")
    battery_level: Mapped[int] = mapped_column(Integer, nullable=True)
    signal_strength: Mapped[int] = mapped_column(Integer, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    extra_data: Mapped[str] = mapped_column(String, nullable=True)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    events: Mapped[list["Event"]] = relationship(back_populates="device")
