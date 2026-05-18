from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Tutor Service",
    description="AI-powered tutor service with Q&A, recommendations and quiz generation (LLM mock)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Mock LLM Knowledge Base
# ============================================================
COURSE_CONTEXTS: Dict[int, str] = {
    1: "Docker is a platform for containerizing applications. Containers package code and dependencies together.",
    2: "Kubernetes orchestrates containerized apps. It handles scaling, load balancing, and self-healing.",
    3: "Python is a versatile language used for web dev, data science, automation, and AI.",
    4: "Machine learning algorithms learn patterns from data to make predictions.",
    5: "DevOps combines development and operations to shorten the SDLC and deliver high-quality software.",
}

GENERIC_ANSWERS = [
    "Great question! This concept is fundamental to understanding {topic}. The key idea is that {explanation}.",
    "Let me explain {topic} clearly. {explanation}. Does that help clarify things?",
    "That's an important topic! {topic} works by {explanation}. Feel free to ask follow-up questions.",
]

QUIZ_TEMPLATES = [
    {"type": "mcq", "difficulty": "easy"},
    {"type": "mcq", "difficulty": "medium"},
    {"type": "true_false", "difficulty": "easy"},
    {"type": "short_answer", "difficulty": "hard"},
]

# ============================================================
# Schemas
# ============================================================
class QuestionRequest(BaseModel):
    question: str
    course_id: Optional[int] = None
    lesson_id: Optional[int] = None
    context: Optional[str] = None
    user_id: Optional[str] = None


class AnswerResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[str]
    follow_up_questions: List[str]
    course_id: Optional[int]


class RecommendationRequest(BaseModel):
    user_id: str
    enrolled_courses: List[int] = []
    completed_courses: List[int] = []
    interests: List[str] = []


class RecommendationResponse(BaseModel):
    recommended_course_ids: List[int]
    reason: str
    personalization_score: float


class QuizRequest(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    num_questions: int = 5
    difficulty: str = "medium"


class QuizQuestion(BaseModel):
    id: int
    question: str
    type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str


class QuizResponse(BaseModel):
    course_id: int
    total_questions: int
    difficulty: str
    questions: List[QuizQuestion]


class SummaryRequest(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    content: Optional[str] = None


# ============================================================
# Mock LLM Engine
# ============================================================
def mock_llm_answer(question: str, context: str = "") -> Dict[str, Any]:
    """Simulate LLM response for Q&A."""
    topics = {
        "docker": "Docker uses containers to isolate applications. Each container includes the app and its dependencies, making it portable across environments.",
        "kubernetes": "Kubernetes manages container orchestration, ensuring your apps are always running, scaled properly, and can recover from failures automatically.",
        "python": "Python's simplicity and rich ecosystem make it ideal for beginners and experts. It supports multiple paradigms including OOP and functional programming.",
        "api": "APIs (Application Programming Interfaces) define how software components communicate. REST APIs use HTTP methods like GET, POST, PUT, DELETE.",
        "microservices": "Microservices split an application into small, independent services that communicate via APIs. Each service is independently deployable and scalable.",
        "ci/cd": "CI/CD automates building, testing, and deploying code. Continuous Integration merges code frequently; Continuous Deployment delivers it to production automatically.",
        "devops": "DevOps is a culture and practice that combines software development and IT operations to shorten delivery cycles and improve reliability.",
    }

    question_lower = question.lower()
    answer = "This is an excellent question! Based on the course material, I can explain this concept clearly. "

    for keyword, explanation in topics.items():
        if keyword in question_lower:
            answer = explanation
            break
    else:
        answer += context if context else "The concept you're asking about is covered in the course lessons. I recommend reviewing the lesson materials for a detailed explanation."

    follow_ups = [
        f"Can you give me a practical example of this?",
        f"How does this relate to real-world applications?",
        f"What are the best practices to follow here?",
    ]

    return {
        "answer": answer,
        "confidence": round(random.uniform(0.75, 0.98), 2),
        "follow_up_questions": random.sample(follow_ups, 2),
        "sources": ["Course Lesson 1", "Official Documentation", "Best Practices Guide"],
    }


def generate_mock_quiz(course_id: int, num_questions: int, difficulty: str) -> List[QuizQuestion]:
    """Generate mock quiz questions for a course."""
    question_bank = [
        {
            "question": "What is the primary purpose of Docker?",
            "type": "mcq",
            "options": ["Application containerization", "Database management", "Network security", "Code compilation"],
            "correct_answer": "Application containerization",
            "explanation": "Docker packages applications and their dependencies into containers for consistent deployment.",
            "difficulty": "easy",
        },
        {
            "question": "Which command starts all services defined in docker-compose.yml?",
            "type": "mcq",
            "options": ["docker compose up", "docker start all", "docker run compose", "docker compose start"],
            "correct_answer": "docker compose up",
            "explanation": "docker compose up builds and starts all containers defined in the docker-compose.yml file.",
            "difficulty": "easy",
        },
        {
            "question": "Kubernetes can automatically scale applications based on CPU usage.",
            "type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": "Kubernetes Horizontal Pod Autoscaler (HPA) can scale pods based on CPU, memory, or custom metrics.",
            "difficulty": "medium",
        },
        {
            "question": "What does CI/CD stand for in DevOps?",
            "type": "mcq",
            "options": [
                "Continuous Integration / Continuous Deployment",
                "Code Integration / Code Deployment",
                "Central Infrastructure / Central Delivery",
                "Container Integration / Container Delivery"
            ],
            "correct_answer": "Continuous Integration / Continuous Deployment",
            "explanation": "CI/CD automates code integration and deployment pipelines to deliver software faster.",
            "difficulty": "easy",
        },
        {
            "question": "In a microservices architecture, each service should have its own database.",
            "type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": "Database-per-service is a microservices pattern that ensures loose coupling and independent deployability.",
            "difficulty": "medium",
        },
        {
            "question": "What is the role of an API Gateway in a microservices architecture?",
            "type": "short_answer",
            "options": None,
            "correct_answer": "Single entry point that handles routing, authentication, rate limiting and load balancing",
            "explanation": "An API Gateway acts as the front door for all clients, routing requests to the appropriate microservice.",
            "difficulty": "hard",
        },
    ]

    filtered = [q for q in question_bank if q["difficulty"] == difficulty] or question_bank
    selected = random.sample(filtered, min(num_questions, len(filtered)))
    if len(selected) < num_questions:
        selected += random.choices(question_bank, k=num_questions - len(selected))

    return [QuizQuestion(id=i + 1, **q) for i, q in enumerate(selected[:num_questions])]


# ============================================================
# Routes
# ============================================================
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ai-tutor-service", "version": "1.0.0", "llm": "mock"}


@app.post("/api/ai-tutor/ask", response_model=AnswerResponse, tags=["Q&A"])
async def ask_question(request: QuestionRequest):
    """Ask the AI tutor a question about course content."""
    context = COURSE_CONTEXTS.get(request.course_id, "") if request.course_id else ""
    if request.context:
        context = f"{context}\n{request.context}"

    result = mock_llm_answer(request.question, context)

    return AnswerResponse(
        answer=result["answer"],
        confidence=result["confidence"],
        sources=result["sources"],
        follow_up_questions=result["follow_up_questions"],
        course_id=request.course_id,
    )


@app.post("/api/ai-tutor/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """Get personalized course recommendations for a user."""
    all_course_ids = list(range(1, 20))
    available = [c for c in all_course_ids if c not in request.enrolled_courses and c not in request.completed_courses]
    recommended = random.sample(available, min(5, len(available)))

    interest_reasons = {
        "python": "Based on your Python interests, these courses will advance your skills.",
        "devops": "Your DevOps journey continues with these recommended courses.",
        "cloud": "Expand your cloud knowledge with these carefully selected courses.",
    }

    reason = "Based on your learning history and interests, we recommend these courses to help you grow."
    for interest in request.interests:
        if interest.lower() in interest_reasons:
            reason = interest_reasons[interest.lower()]
            break

    return RecommendationResponse(
        recommended_course_ids=recommended,
        reason=reason,
        personalization_score=round(random.uniform(0.70, 0.95), 2),
    )


@app.post("/api/ai-tutor/quiz", response_model=QuizResponse, tags=["Quiz"])
async def generate_quiz(request: QuizRequest):
    """Generate a quiz for a specific course and difficulty level."""
    questions = generate_mock_quiz(request.course_id, request.num_questions, request.difficulty)
    return QuizResponse(
        course_id=request.course_id,
        total_questions=len(questions),
        difficulty=request.difficulty,
        questions=questions,
    )


@app.post("/api/ai-tutor/summarize", tags=["Summary"])
async def summarize_content(request: SummaryRequest):
    """Summarize course/lesson content."""
    context = COURSE_CONTEXTS.get(request.course_id, "")
    summary = f"Key Takeaways for Course {request.course_id}:\n\n"
    summary += "1. Understanding the core concepts is essential for practical application.\n"
    summary += "2. The main topics covered include containerization, orchestration, and DevOps practices.\n"
    summary += "3. Hands-on practice with the provided exercises reinforces theoretical knowledge.\n"
    summary += f"\nContext: {context}" if context else ""

    return {
        "course_id": request.course_id,
        "lesson_id": request.lesson_id,
        "summary": summary,
        "key_points": [
            "Core concept understanding",
            "Practical application",
            "Industry best practices",
            "Hands-on exercises",
        ],
        "estimated_read_time_minutes": 5,
    }
