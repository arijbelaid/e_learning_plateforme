from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, select, func
from sqlalchemy.sql import func as sqlfunc
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# Database
# ============================================================
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "learning_platform")
POSTGRES_USER = os.getenv("POSTGRES_USER", "admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin_secure_password")

DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"


class Base(DeclarativeBase):
    pass


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), index=True)
    course_id = Column(Integer, index=True)
    lesson_id = Column(Integer)
    data = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), server_default=sqlfunc.now(), index=True)


class CourseStats(Base):
    __tablename__ = "course_stats"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, unique=True, index=True)
    view_count = Column(Integer, default=0)
    enrollment_count = Column(Integer, default=0)
    completion_count = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=sqlfunc.now())


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db(max_retries: int = 15, retry_delay: float = 5.0):
    """Initialise la DB avec retry automatique."""
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"[DB] Connection attempt {attempt}/{max_retries}...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("[DB] Connected and tables created.")
            return
        except Exception as e:
            logger.error(f"[DB] Failed (attempt {attempt}): {e}")
            if attempt >= max_retries:
                logger.critical("[DB] Max retries reached. Starting degraded.")
                return
            await asyncio.sleep(retry_delay)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ============================================================
# App
# ============================================================
app = FastAPI(
    title="Analytics Service",
    description="Microservice for tracking and analyzing user behavior and course metrics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()
    logger.info("Analytics Service started")


# ============================================================
# Schemas
# ============================================================
class EventCreate(BaseModel):
    event_type: str
    user_id: Optional[str] = None
    course_id: Optional[int] = None
    lesson_id: Optional[int] = None
    data: Dict[str, Any] = {}


class EventResponse(BaseModel):
    id: int
    event_type: str
    user_id: Optional[str]
    course_id: Optional[int]
    lesson_id: Optional[int]
    data: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_users: int
    total_enrollments: int
    total_completions: int
    total_views: int
    active_courses: int
    completion_rate: float
    top_courses: List[Dict[str, Any]]
    enrollments_by_day: List[Dict[str, Any]]
    events_by_type: List[Dict[str, Any]]


# ============================================================
# Routes
# ============================================================
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "analytics-service", "version": "1.0.0"}


@app.post("/api/analytics/events", response_model=EventResponse, status_code=201, tags=["Events"])
async def track_event(event: EventCreate, db: AsyncSession = Depends(get_db)):
    """Track an analytics event."""
    db_event = AnalyticsEvent(**event.model_dump())
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    return db_event


@app.get("/api/analytics/events", response_model=List[EventResponse], tags=["Events"])
async def list_events(
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    course_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """List analytics events with optional filters."""
    query = select(AnalyticsEvent).order_by(AnalyticsEvent.timestamp.desc()).limit(limit)
    if event_type:
        query = query.where(AnalyticsEvent.event_type == event_type)
    if user_id:
        query = query.where(AnalyticsEvent.user_id == user_id)
    if course_id:
        query = query.where(AnalyticsEvent.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()


@app.get("/api/analytics/dashboard", response_model=DashboardStats, tags=["Dashboard"])
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get comprehensive dashboard statistics."""
    enrollments_result = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "enrollment")
    )
    total_enrollments = enrollments_result.scalar() or 0

    completions_result = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "completion")
    )
    total_completions = completions_result.scalar() or 0

    views_result = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "course_view")
    )
    total_views = views_result.scalar() or 0

    users_result = await db.execute(
        select(func.count(func.distinct(AnalyticsEvent.user_id))).where(AnalyticsEvent.user_id != None)
    )
    total_users = users_result.scalar() or 0

    completion_rate = (total_completions / total_enrollments * 100) if total_enrollments > 0 else 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    enrollments_by_day_result = await db.execute(
        select(
            func.date(AnalyticsEvent.timestamp).label("date"),
            func.count().label("count")
        ).where(
            AnalyticsEvent.event_type == "enrollment",
            AnalyticsEvent.timestamp >= thirty_days_ago
        ).group_by(func.date(AnalyticsEvent.timestamp)).order_by("date")
    )
    enrollments_by_day = [{"date": str(row.date), "count": row.count} for row in enrollments_by_day_result]

    events_by_type_result = await db.execute(
        select(AnalyticsEvent.event_type, func.count().label("count"))
        .group_by(AnalyticsEvent.event_type)
        .order_by(func.count().desc())
        .limit(10)
    )
    events_by_type = [{"type": row.event_type, "count": row.count} for row in events_by_type_result]

    top_courses_result = await db.execute(
        select(AnalyticsEvent.course_id, func.count().label("enrollments"))
        .where(AnalyticsEvent.event_type == "enrollment", AnalyticsEvent.course_id != None)
        .group_by(AnalyticsEvent.course_id)
        .order_by(func.count().desc())
        .limit(5)
    )
    top_courses = [{"course_id": row.course_id, "enrollments": row.enrollments} for row in top_courses_result]

    return DashboardStats(
        total_users=total_users,
        total_enrollments=total_enrollments,
        total_completions=total_completions,
        total_views=total_views,
        active_courses=len(top_courses),
        completion_rate=round(completion_rate, 2),
        top_courses=top_courses,
        enrollments_by_day=enrollments_by_day,
        events_by_type=events_by_type,
    )


@app.get("/api/analytics/courses/{course_id}", tags=["Course Analytics"])
async def get_course_analytics(course_id: int, db: AsyncSession = Depends(get_db)):
    """Get analytics for a specific course."""
    views = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "course_view", AnalyticsEvent.course_id == course_id)
    )
    enrollments = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "enrollment", AnalyticsEvent.course_id == course_id)
    )
    completions = await db.execute(
        select(func.count()).where(AnalyticsEvent.event_type == "completion", AnalyticsEvent.course_id == course_id)
    )
    enroll_count = enrollments.scalar() or 0
    complete_count = completions.scalar() or 0
    return {
        "course_id": course_id,
        "views": views.scalar() or 0,
        "enrollments": enroll_count,
        "completions": complete_count,
        "completion_rate": round(complete_count / max(enroll_count, 1) * 100, 2),
    }


@app.get("/api/analytics/trends", tags=["Trends"])
async def get_trends(days: int = Query(30, ge=7, le=365), db: AsyncSession = Depends(get_db)):
    """Get trend data for the specified period."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date(AnalyticsEvent.timestamp).label("date"),
            AnalyticsEvent.event_type,
            func.count().label("count")
        ).where(AnalyticsEvent.timestamp >= since)
        .group_by(func.date(AnalyticsEvent.timestamp), AnalyticsEvent.event_type)
        .order_by("date")
    )
    trends = [{"date": str(row.date), "event_type": row.event_type, "count": row.count} for row in result]
    return {"period_days": days, "trends": trends}
