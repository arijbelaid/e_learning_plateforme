from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    short_description = Column(String(500))
    instructor_id = Column(String(100), nullable=False, index=True)
    instructor_name = Column(String(200))
    category = Column(String(100), index=True)
    level = Column(String(50), default="beginner")  # beginner, intermediate, advanced
    thumbnail_url = Column(String(500))
    preview_video_url = Column(String(500))
    price = Column(Float, default=0.0)
    is_free = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    duration_hours = Column(Float, default=0.0)
    language = Column(String(50), default="fr")
    tags = Column(JSON, default=list)
    requirements = Column(JSON, default=list)
    what_you_learn = Column(JSON, default=list)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    enrollment_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    video_url = Column(String(500))
    duration_minutes = Column(Integer, default=0)
    order = Column(Integer, default=0)
    is_free_preview = Column(Boolean, default=False)
    lesson_type = Column(String(50), default="video")  # video, text, quiz
    resources = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="lessons")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    progress_percent = Column(Float, default=0.0)
    completed_lessons = Column(JSON, default=list)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    certificate_issued = Column(Boolean, default=False)

    course = relationship("Course", back_populates="enrollments")
