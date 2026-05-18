-- ============================================================
-- PostgreSQL Initialization Script
-- Learning Platform
-- ============================================================

-- Create n8n database
CREATE DATABASE n8n_db;

-- Connect to learning_platform database
\c learning_platform;

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    instructor_id VARCHAR(100) NOT NULL,
    instructor_name VARCHAR(200),
    category VARCHAR(100),
    level VARCHAR(50) DEFAULT 'beginner',
    thumbnail_url VARCHAR(500),
    preview_video_url VARCHAR(500),
    price FLOAT DEFAULT 0.0,
    is_free BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    duration_hours FLOAT DEFAULT 0.0,
    language VARCHAR(50) DEFAULT 'fr',
    tags JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    what_you_learn JSONB DEFAULT '[]',
    rating FLOAT DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url VARCHAR(500),
    duration_minutes INTEGER DEFAULT 0,
    "order" INTEGER DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT FALSE,
    lesson_type VARCHAR(50) DEFAULT 'video',
    resources JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percent FLOAT DEFAULT 0.0,
    completed_lessons JSONB DEFAULT '[]',
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    certificate_issued BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, course_id)
);

-- ============================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    course_id INTEGER,
    lesson_id INTEGER,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_stats (
    id SERIAL PRIMARY KEY,
    course_id INTEGER UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    avg_rating FLOAT DEFAULT 0.0,
    revenue FLOAT DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);

-- ============================================================
-- SEED DATA - Sample Courses
-- ============================================================
INSERT INTO courses (title, description, short_description, instructor_id, instructor_name, category, level, is_free, is_published, rating, rating_count, enrollment_count, duration_hours, tags, what_you_learn)
VALUES
(
    'Docker & Containerisation - Master DevOps',
    'Apprenez Docker depuis zéro jusqu''à la maîtrise complète. Créez, déployez et gérez des conteneurs Docker en production.',
    'Maîtrisez Docker pour vos projets DevOps',
    'instructor-001',
    'Jean Dupont',
    'DevOps',
    'beginner',
    true,
    true,
    4.8,
    1250,
    5420,
    12.5,
    '["docker", "containers", "devops", "linux"]',
    '["Comprendre les concepts de conteneurisation", "Créer des Dockerfiles optimisés", "Utiliser Docker Compose", "Déployer en production"]'
),
(
    'Kubernetes - Orchestration de Conteneurs',
    'Maîtrisez Kubernetes pour orchestrer vos applications conteneurisées à grande échelle.',
    'De zéro à héros avec Kubernetes',
    'instructor-001',
    'Jean Dupont',
    'DevOps',
    'intermediate',
    false,
    true,
    4.7,
    890,
    3200,
    18.0,
    '["kubernetes", "k8s", "devops", "orchestration"]',
    '["Déployer des applications sur Kubernetes", "Gérer les namespaces et ressources", "Configurer le scaling automatique", "Mettre en place CI/CD avec Kubernetes"]'
),
(
    'Python pour le DevOps',
    'Automatisez votre infrastructure et vos processus DevOps avec Python. Scripts, APIs, et automation.',
    'Automatisez tout avec Python',
    'instructor-002',
    'Marie Martin',
    'Programming',
    'beginner',
    true,
    true,
    4.6,
    2100,
    8900,
    10.0,
    '["python", "automation", "scripting", "devops"]',
    '["Maîtriser Python pour l''automatisation", "Créer des scripts DevOps", "Interagir avec les APIs", "Gérer des fichiers et processus"]'
),
(
    'Architecture Microservices avec FastAPI',
    'Concevez et implémentez une architecture microservices moderne avec FastAPI, Docker et Kubernetes.',
    'Microservices modernes avec FastAPI',
    'instructor-003',
    'Pierre Bernard',
    'Backend',
    'advanced',
    false,
    true,
    4.9,
    450,
    1800,
    22.0,
    '["fastapi", "microservices", "python", "api", "docker"]',
    '["Concevoir une architecture microservices", "Implémenter des APIs REST avec FastAPI", "Gérer la communication inter-services", "Déployer avec Docker Compose"]'
),
(
    'CI/CD avec GitHub Actions',
    'Mettez en place des pipelines CI/CD robustes avec GitHub Actions pour automatiser vos déploiements.',
    'Automatisez vos déploiements avec GitHub Actions',
    'instructor-002',
    'Marie Martin',
    'DevOps',
    'intermediate',
    true,
    true,
    4.5,
    670,
    2900,
    8.0,
    '["ci-cd", "github-actions", "automation", "devops"]',
    '["Créer des workflows GitHub Actions", "Automatiser les tests", "Déployer automatiquement", "Gérer les secrets et environnements"]'
);

-- Seed lessons for course 1
INSERT INTO lessons (course_id, title, content, duration_minutes, "order", is_free_preview, lesson_type)
VALUES
(1, 'Introduction à Docker', 'Découvrez Docker et les concepts fondamentaux de la conteneurisation.', 15, 1, true, 'video'),
(1, 'Installation de Docker', 'Installez Docker sur Windows, Mac et Linux.', 20, 2, true, 'video'),
(1, 'Vos premiers conteneurs', 'Créez et gérez vos premiers conteneurs Docker.', 30, 3, false, 'video'),
(1, 'Dockerfile - Images personnalisées', 'Apprenez à créer des images Docker personnalisées.', 45, 4, false, 'video'),
(1, 'Docker Compose', 'Orchestrez plusieurs conteneurs avec Docker Compose.', 60, 5, false, 'video'),
(1, 'Volumes et persistance', 'Gérez la persistance des données avec les volumes Docker.', 30, 6, false, 'video'),
(1, 'Réseaux Docker', 'Configurez les réseaux pour la communication entre conteneurs.', 25, 7, false, 'video'),
(1, 'Docker en production', 'Bonnes pratiques pour déployer Docker en production.', 40, 8, false, 'video');

-- Seed analytics events
INSERT INTO analytics_events (event_type, user_id, course_id, data)
VALUES
('course_view', 'user-001', 1, '{"source": "homepage"}'),
('enrollment', 'user-001', 1, '{"price": 0}'),
('lesson_complete', 'user-001', 1, '{"lesson_id": 1}'),
('course_view', 'user-002', 2, '{"source": "search"}'),
('enrollment', 'user-002', 2, '{"price": 49.99}'),
('course_view', 'user-003', 3, '{"source": "recommendation"}'),
('enrollment', 'user-003', 3, '{"price": 0}'),
('completion', 'user-001', 1, '{"certificate": true}');
