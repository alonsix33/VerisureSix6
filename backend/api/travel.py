from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.db.database import get_db
from backend.models.travel import TravelPeriod

router = APIRouter(prefix="/travel", tags=["travel"])


class TravelCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_active: bool = True


class TravelUpdate(BaseModel):
    name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class TravelResponse(BaseModel):
    id: str
    name: str
    start_date: date
    end_date: date
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[TravelResponse])
async def list_travel(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TravelPeriod).order_by(TravelPeriod.start_date.desc()))
    return result.scalars().all()


@router.post("", response_model=TravelResponse, status_code=201)
async def create_travel(data: TravelCreate, db: AsyncSession = Depends(get_db)):
    travel = TravelPeriod(**data.model_dump())
    db.add(travel)
    await db.commit()
    await db.refresh(travel)
    return travel


@router.patch("/{travel_id}", response_model=TravelResponse)
async def update_travel(travel_id: str, data: TravelUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TravelPeriod).where(TravelPeriod.id == travel_id))
    travel = result.scalar_one_or_none()
    if not travel:
        raise HTTPException(status_code=404, detail="Travel period not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(travel, key, val)
    await db.commit()
    await db.refresh(travel)
    return travel


@router.delete("/{travel_id}", status_code=204)
async def delete_travel(travel_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TravelPeriod).where(TravelPeriod.id == travel_id))
    travel = result.scalar_one_or_none()
    if not travel:
        raise HTTPException(status_code=404, detail="Travel period not found")
    await db.delete(travel)
    await db.commit()
