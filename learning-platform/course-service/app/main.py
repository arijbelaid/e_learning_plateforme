from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.database import get_db, init_db
from app.models.course import Course, Lesson, Enrollment
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    LessonCreate, LessonResponse,
    EnrollmentCreate, EnrollmentResponse,
    HealthResponse
)
from app.auth import verify_token
from app.redis_client import get_redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Course Service",
    description="Microservice for managing courses, lessons and enrollments",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
    logger.info("Course Service started")

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "course-service", "version": "1.0.0"}

# ============================================================
# COURSES
# ============================================================

@app.get("/api/courses", response_model=List[CourseResponse], tags=["Courses"])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    is_free: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all courses with optional filters and search."""
    from sqlalchemy import select, or_
    query = select(Course).where(Course.is_published == True)

    if search:
        query = query.where(
            or_(
                Course.title.ilike(f"%{search}%"),
                Course.description.ilike(f"%{search}%")
            )
        )
    if category:
        query = query.where(Course.category == category)
    if level:
        query = query.where(Course.level == level)
    if is_free is not None:
        query = query.where(Course.is_free == is_free)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    courses = result.scalars().all()
    return courses

@app.get("/api/courses/{course_id}", response_model=CourseResponse, tags=["Courses"])
async def get_course(course_id: int, db: AsyncSession = Depends(get_db)):
    """Get a course by ID with its lessons."""
    from sqlalchemy import select
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.post("/api/courses", response_model=CourseResponse, status_code=201, tags=["Courses"])
async def create_course(
    course: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Create a new course (instructor only)."""
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_course = Course(
        **course.model_dump(),
        instructor_id=current_user["sub"]
    )
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return db_course

@app.put("/api/courses/{course_id}", response_model=CourseResponse, tags=["Courses"])
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Update a course (instructor/admin only)."""
    from sqlalchemy import select
    result = await db.execute(select(Course).where(Course.id == course_id))
    db_course = result.scalar_one_or_none()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")

    for field, value in course_update.model_dump(exclude_unset=True).items():
        setattr(db_course, field, value)
    await db.commit()
    await db.refresh(db_course)
    return db_course

@app.delete("/api/courses/{course_id}", status_code=204, tags=["Courses"])
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Delete a course (admin only)."""
    from sqlalchemy import select, delete
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.execute(delete(Course).where(Course.id == course_id))
    await db.commit()

# ============================================================
# LESSONS
# ============================================================

@app.get("/api/courses/{course_id}/lessons", response_model=List[LessonResponse], tags=["Lessons"])
async def list_lessons(course_id: int, db: AsyncSession = Depends(get_db)):
    """List all lessons for a course."""
    from sqlalchemy import select
    result = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    )
    return result.scalars().all()

@app.post("/api/courses/{course_id}/lessons", response_model=LessonResponse, status_code=201, tags=["Lessons"])
async def create_lesson(
    course_id: int,
    lesson: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Add a lesson to a course."""
    if current_user.get("role") not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_lesson = Lesson(**lesson.model_dump(), course_id=course_id)
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson

# ============================================================
# ENROLLMENTS
# ============================================================

@app.post("/api/courses/{course_id}/enroll", response_model=EnrollmentResponse, status_code=201, tags=["Enrollments"])
async def enroll_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Enroll the current user in a course."""
    from sqlalchemy import select
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.user_id == current_user["sub"]
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(course_id=course_id, user_id=current_user["sub"])
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

@app.get("/api/enrollments/me", response_model=List[EnrollmentResponse], tags=["Enrollments"])
async def my_enrollments(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Get all enrollments for the current user."""
    from sqlalchemy import select
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user["sub"])
    )
    return result.scalars().all()

@app.put("/api/courses/{course_id}/progress", tags=["Enrollments"])
async def update_progress(
    course_id: int,
    lesson_id: int,
    completed: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Update lesson progress for a user."""
    from sqlalchemy import select
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.user_id == current_user["sub"]
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    if completed and lesson_id not in (enrollment.completed_lessons or []):
        enrollment.completed_lessons = (enrollment.completed_lessons or []) + [lesson_id]
    await db.commit()
    return {"message": "Progress updated", "lesson_id": lesson_id, "completed": completed}
