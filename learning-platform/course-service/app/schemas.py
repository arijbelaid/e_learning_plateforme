from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration_minutes: int = 0
    order: int = 0
    is_free_preview: bool = False
    lesson_type: str = "video"


class LessonCreate(LessonBase):
    pass


class LessonResponse(LessonBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    level: str = "beginner"
    thumbnail_url: Optional[str] = None
    price: float = 0.0
    is_free: bool = True
    language: str = "fr"
    tags: List[str] = []
    requirements: List[str] = []
    what_you_learn: List[str] = []


class CourseCreate(CourseBase):
    instructor_name: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    thumbnail_url: Optional[str] = None
    price: Optional[float] = None
    is_free: Optional[bool] = None
    is_published: Optional[bool] = None
    language: Optional[str] = None
    tags: Optional[List[str]] = None


class CourseResponse(CourseBase):
    id: int
    instructor_id: str
    instructor_name: Optional[str] = None
    is_published: bool
    rating: float
    rating_count: int
    enrollment_count: int
    created_at: datetime
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentResponse(BaseModel):
    id: int
    user_id: str
    course_id: int
    enrolled_at: datetime
    progress_percent: float
    completed_lessons: List[int] = []
    certificate_issued: bool

    class Config:
        from_attributes = True
