from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from backend.settings import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from backend.models.event import Event  # noqa: F401
        from backend.models.device import Device  # noqa: F401
        from backend.models.config import SheriffConfig  # noqa: F401
        from backend.models.alert import Alert  # noqa: F401
        from backend.models.schedule import Schedule  # noqa: F401
        from backend.models.travel import TravelPeriod  # noqa: F401
        from backend.models.conversation import Conversation, PushSubscription  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
