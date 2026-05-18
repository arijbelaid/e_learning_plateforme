# LearnCloud Platform — Master DevOps & Cloud 2026

Plateforme d'apprentissage en ligne basée sur une architecture microservices, intégrant une fonctionnalité IA pour assistance pédagogique et un workflow automatisé de collecte de feedback via n8n.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                          │
│           Apprenant / Instructeur / Admin           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP :80
┌──────────────────────▼──────────────────────────────┐
│              API GATEWAY (Nginx :80)                │
│    Reverse Proxy · Rate Limiting · Routing          │
└──┬──────────┬─────────┬──────────┬──────────────────┘
   │          │         │          │
   ▼          ▼         ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Front │ │Course  │ │ User   │ │Analytics │ │AI Tutor  │
│Next.js│ │FastAPI │ │Node.js │ │FastAPI   │ │FastAPI   │
│:3000 │ │:8001   │ │:3001   │ │:8002     │ │:8003     │
└──────┘ └───┬────┘ └───┬────┘ └────┬─────┘ └─────┬────┘
             │           │           │               │
┌────────────▼──┐ ┌──────▼───┐ ┌────▼───────────────▼───┐
│  PostgreSQL   │ │ MongoDB  │ │         Redis           │
│  :5432        │ │ :27017   │ │         :6379           │
│ courses,      │ │ users,   │ │ cache, sessions,        │
│ analytics     │ │ profiles │ │ rate limiting           │
└───────────────┘ └──────────┘ └────────────────────────┘
                                ┌────────────────────────┐
                                │  MinIO Object Storage  │
                                │  :9000 (API)           │
                                │  :9001 (Console)       │
                                └────────────────────────┘
                                ┌────────────────────────┐
                                │   n8n Automation       │
                                │   :5678                │
                                │  Feedback Workflow     │
                                └────────────────────────┘
```

---

## Prérequis

- **Docker Desktop** (Windows) — [Télécharger](https://www.docker.com/products/docker-desktop/)
- **Git** — [Télécharger](https://git-scm.com/)
- RAM minimum : **8 Go** recommandé
- Ports disponibles : 80, 3000, 3001, 5432, 5678, 6379, 8001, 8002, 8003, 9000, 9001, 27017

---

## Installation & Démarrage

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd learning-platform
```

### 2. Configuration des variables d'environnement

```bash
# Copier le fichier .env (déjà fourni avec des valeurs par défaut)
# Modifier si nécessaire pour la production
```

### 3. Démarrer tous les services

```bash
docker compose up --build
```

Pour démarrer en arrière-plan :
```bash
docker compose up --build -d
```

### 4. Vérifier que tout fonctionne

```bash
docker compose ps
```

Tous les services doivent être dans l'état `healthy`.

---

## URLs d'accès

| Service             | URL                              | Description                        |
|---------------------|----------------------------------|------------------------------------|
| **Frontend**        | http://localhost                 | Application principale             |
| **Catalogue cours** | http://localhost/courses         | Parcourir les cours                |
| **AI Tutor**        | http://localhost/ai-tutor        | Assistant IA                       |
| **Tableau de bord** | http://localhost/dashboard       | Dashboard apprenant                |
| **n8n Automation**  | http://localhost:5678            | Interface n8n (admin/admin)        |
| **MinIO Console**   | http://localhost:9001            | Stockage objets (minioadmin)       |
| **Course API Docs** | http://localhost:8001/docs       | Swagger UI Course Service          |
| **Analytics Docs**  | http://localhost:8002/docs       | Swagger UI Analytics Service       |
| **AI Tutor Docs**   | http://localhost:8003/docs       | Swagger UI AI Tutor Service        |

---

## Comptes de test

| Rôle        | Email                        | Mot de passe  |
|-------------|------------------------------|---------------|
| Admin        | admin@learncloud.fr         | Admin@1234    |
| Instructeur  | instructor@learncloud.fr    | Admin@1234    |
| Étudiant     | student@learncloud.fr       | Admin@1234    |

---

## Exemples d'API REST

### User Service (Node.js/Express — :3001)

#### Inscription
```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau@test.fr",
    "password": "MonMotDePasse123",
    "firstName": "Marie",
    "lastName": "Curie",
    "role": "student"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@learncloud.fr", "password": "Admin@1234"}'
```

#### Profil utilisateur (authentifié)
```bash
# Remplacez TOKEN par le token JWT obtenu à la connexion
curl http://localhost/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

### Course Service (FastAPI — :8001)

#### Lister tous les cours
```bash
curl http://localhost/api/courses
```

#### Rechercher des cours
```bash
curl "http://localhost/api/courses?search=docker&category=DevOps&level=beginner"
```

#### Détails d'un cours
```bash
curl http://localhost/api/courses/1
```

#### Lister les leçons d'un cours
```bash
curl http://localhost/api/courses/1/lessons
```

#### Créer un cours (instructor/admin)
```bash
curl -X POST http://localhost/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ansible - Automatisation Infrastructure",
    "description": "Apprenez Ansible pour automatiser vos déploiements",
    "category": "DevOps",
    "level": "intermediate",
    "is_free": true,
    "language": "fr",
    "tags": ["ansible", "automation", "devops"]
  }'
```

#### S'inscrire à un cours
```bash
curl -X POST http://localhost/api/courses/1/enroll \
  -H "Authorization: Bearer TOKEN"
```

#### Mes inscriptions
```bash
curl http://localhost/api/enrollments/me \
  -H "Authorization: Bearer TOKEN"
```

---

### Analytics Service (FastAPI — :8002)

#### Tableau de bord analytics
```bash
curl http://localhost/api/analytics/dashboard
```

#### Tracker un événement
```bash
curl -X POST http://localhost/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "course_view",
    "user_id": "user-123",
    "course_id": 1,
    "data": {"source": "homepage", "device": "desktop"}
  }'
```

#### Analytics d'un cours spécifique
```bash
curl http://localhost/api/analytics/courses/1
```

#### Tendances sur 30 jours
```bash
curl "http://localhost/api/analytics/trends?days=30"
```

---

### AI Tutor Service (FastAPI — :8003)

#### Poser une question au tuteur IA
```bash
curl -X POST http://localhost/api/ai-tutor/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Comment fonctionne Docker Compose ?",
    "course_id": 1
  }'
```

#### Obtenir des recommandations
```bash
curl -X POST http://localhost/api/ai-tutor/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "enrolled_courses": [1, 3],
    "interests": ["devops", "kubernetes"]
  }'
```

#### Générer un quiz
```bash
curl -X POST http://localhost/api/ai-tutor/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "num_questions": 5,
    "difficulty": "medium"
  }'
```

#### Résumer un contenu
```bash
curl -X POST http://localhost/api/ai-tutor/summarize \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1, "lesson_id": 3}'
```

---

### n8n Automation — Workflow Feedback

#### Déclencher le workflow via webhook
```bash
curl -X POST http://localhost:5678/webhook/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "course_id": 1,
    "rating": 5,
    "feedback": "Excellent cours sur Docker ! La partie sur les volumes était très claire."
  }'
```

---

## Commandes Docker utiles

```bash
# Voir l'état de tous les services
docker compose ps

# Voir les logs d'un service spécifique
docker compose logs course-service --tail=50
docker compose logs user-service --tail=50
docker compose logs ai-tutor-service --tail=50

# Suivre les logs en temps réel
docker compose logs -f

# Redémarrer un service sans rebuildez
docker compose restart course-service

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (reset complet)
docker compose down -v

# Reconstruire un service spécifique
docker compose build course-service
docker compose up -d course-service

# Accéder au shell d'un conteneur
docker compose exec course-service bash
docker compose exec postgres psql -U admin -d learning_platform
docker compose exec mongodb mongosh -u admin -p admin_secure_password
docker compose exec redis redis-cli -a redis_secure_password

# Vérifier les healthchecks
docker inspect --format='{{.State.Health.Status}}' postgres
docker inspect --format='{{.State.Health.Status}}' mongodb
```

---

## Structure du projet

```
learning-platform/
├── docker-compose.yml          # Orchestration de tous les services
├── .env                        # Variables d'environnement
├── README.md                   # Ce fichier
│
├── nginx-gateway/              # API Gateway
│   ├── Dockerfile
│   └── nginx.conf              # Reverse proxy, routing, rate limiting
│
├── learning-frontend/          # Frontend Next.js + shadcn/ui
│   ├── Dockerfile              # Multi-stage build (optimisé)
│   ├── package.json
│   ├── next.config.js
│   └── src/app/
│       ├── page.tsx            # Homepage - catalogue
│       ├── courses/page.tsx    # Catalogue avec filtres
│       ├── dashboard/page.tsx  # Tableau de bord apprenant
│       ├── ai-tutor/page.tsx   # Interface AI Tutor (Q&A, Quiz)
│       └── auth/               # Login / Register
│
├── course-service/             # Microservice FastAPI (cours, leçons, inscriptions)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # Routes API
│       ├── models/             # Modèles SQLAlchemy
│       ├── schemas.py          # Schémas Pydantic
│       ├── database.py         # Connexion PostgreSQL
│       ├── auth.py             # Vérification JWT
│       └── redis_client.py     # Cache Redis
│
├── user-service/               # Microservice Node.js/Express (auth, profils)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Point d'entrée Express
│       ├── routes/             # Routes auth et users
│       ├── models/User.js      # Modèle Mongoose
│       └── middleware/auth.js  # Middleware JWT
│
├── analytics-service/          # Microservice FastAPI (statistiques, tendances)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/main.py             # Dashboard, events, trends
│
├── ai-tutor-service/           # Microservice FastAPI (LLM Mock)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/main.py             # Q&A, Quiz, Recommandations, Résumé
│
├── n8n-automation/             # Workflows n8n
│   └── workflows/
│       └── feedback-workflow.json  # Workflow feedback automatisé
│
├── postgres/
│   └── init.sql                # Schéma + données de test
│
├── mongodb/
│   └── init.js                 # Collections + utilisateurs de test
│
├── redis/
│   └── redis.conf              # Configuration Redis sécurisée
│
└── minio/                      # Stockage objets (auto-configuré)
```

---

## Ports exposés

| Conteneur          | Port interne | Port exposé | Description                    |
|--------------------|-------------|-------------|--------------------------------|
| nginx-gateway      | 80          | **80**      | Point d'entrée principal       |
| learning-frontend  | 3000        | 3000        | Application Next.js            |
| course-service     | 8001        | 8001        | API Course (FastAPI)           |
| user-service       | 3001        | 3001        | API User (Express)             |
| analytics-service  | 8002        | 8002        | API Analytics (FastAPI)        |
| ai-tutor-service   | 8003        | 8003        | API AI Tutor (FastAPI)         |
| n8n-automation     | 5678        | 5678        | Interface n8n                  |
| postgres           | 5432        | 5432        | Base de données PostgreSQL     |
| mongodb            | 27017       | 27017       | Base de données MongoDB        |
| redis              | 6379        | 6379        | Cache Redis                    |
| minio              | 9000/9001   | 9000/9001   | Stockage objets                |

---

## Réseau Docker

Tous les services communiquent via le réseau Docker bridge `learning-network`. Les services s'adressent entre eux par leur nom de conteneur (ex: `course-service`, `postgres`, `redis`).

```yaml
networks:
  learning-network:
    driver: bridge
    name: learning-network
```

---

## Volumes Docker (Persistance des données)

```yaml
volumes:
  postgres_data    # Données PostgreSQL
  mongodb_data     # Données MongoDB
  redis_data       # Données Redis
  minio_data       # Fichiers MinIO
  n8n_data         # Workflows n8n
```

---

## Healthchecks

Chaque service dispose d'un healthcheck Docker configuré :

```bash
# Vérifier l'état de santé de tous les services
docker compose ps

# Output attendu: tous les services en "healthy"
NAME                STATUS
nginx-gateway       running (healthy)
learning-frontend   running (healthy)
course-service      running (healthy)
user-service        running (healthy)
analytics-service   running (healthy)
ai-tutor-service    running (healthy)
n8n-automation      running (healthy)
postgres            running (healthy)
mongodb             running (healthy)
redis               running (healthy)
minio               running (healthy)
```

---

## Diagramme de séquence — Inscription et suivi d'un cours

```
Apprenant     Frontend     API Gateway    User Service    Course Service    Analytics
    │              │              │               │               │               │
    │──register──▶│              │               │               │               │
    │              │──POST /auth/register──▶│               │               │
    │              │              │──────────────▶│               │               │
    │              │              │◀── JWT token ─│               │               │
    │◀─ token ─────│              │               │               │               │
    │              │              │               │               │               │
    │──browse──────▶│              │               │               │               │
    │              │──GET /courses────────────────────────────────▶│               │
    │              │◀───────────── courses list ──────────────────│               │
    │◀─ courses ───│              │               │               │               │
    │              │              │               │               │               │
    │──enroll──────▶│              │               │               │               │
    │              │──POST /courses/1/enroll──────────────────────▶│               │
    │              │              │               │               │──enrollment──▶│
    │              │              │               │               │◀── saved ─────│
    │◀─ enrolled ──│              │               │               │               │
    │              │              │               │               │               │
    │──ask AI──────▶│              │               │               │               │
    │              │──POST /ai-tutor/ask──────────────────────────────────────────▶
    │              │◀──────────────────────────────────────────── AI response ────│
    │◀─ answer ────│
```

---

## Modèle C4 — Niveau 2 (Container Diagram)

```
[Apprenant]──▶[Learning Portal Next.js]──▶[API Gateway Nginx]
                                                │
                        ┌───────────────────────┼──────────────────────┐
                        ▼                       ▼                      ▼
               [Course Service]          [User Service]      [Analytics Service]
               [FastAPI + PostgreSQL]    [Node.js + MongoDB] [FastAPI + PostgreSQL]
                        │
                        ▼
               [AI Tutor Service]
               [FastAPI + LLM Mock]
                        │
                        ▼
               [n8n Automation]──▶[Analytics Service]
               [Feedback Workflow]

Datastores:
  PostgreSQL ◀─── Course Service, Analytics Service
  MongoDB    ◀─── User Service
  Redis      ◀─── Tous les services (cache)
  MinIO      ◀─── Course Service (médias)
```

---

## Dépannage

### Les conteneurs ne démarrent pas
```bash
# Vérifier les logs
docker compose logs --tail=50

# Vérifier que les ports ne sont pas déjà utilisés
netstat -an | findstr "80 5432 27017 6379"  # Windows
```

### PostgreSQL ne démarre pas
```bash
docker compose logs postgres
# Souvent dû à une permission sur le volume
docker compose down -v && docker compose up --build
```

### Erreur de connexion MongoDB
```bash
# Vérifier les credentials dans .env
docker compose exec mongodb mongosh -u admin -p admin_secure_password --authenticationDatabase admin
```

### Frontend ne charge pas
```bash
# Vérifier que nginx est healthy
docker compose logs nginx-gateway
# Attendre que tous les services soient ready (peut prendre 1-2 min au premier démarrage)
```

### Reconstruire entièrement (reset propre)
```bash
docker compose down -v --remove-orphans
docker compose up --build
```

---

## Technologies utilisées

| Couche         | Technologie         | Version  |
|----------------|---------------------|----------|
| API Gateway    | Nginx               | 1.25     |
| Frontend       | Next.js + React     | 14 / 18  |
| Course API     | FastAPI + SQLAlchemy| 0.115    |
| User API       | Express.js          | 4.x      |
| Analytics API  | FastAPI             | 0.115    |
| AI Tutor API   | FastAPI (LLM Mock)  | 0.115    |
| Automation     | n8n                 | Latest   |
| DB Relationnelle | PostgreSQL        | 16       |
| DB Documents   | MongoDB             | 7.0      |
| Cache          | Redis               | 7.2      |
| Stockage médias| MinIO               | Latest   |
| Conteneurisation | Docker Compose   | 3.9      |

---

*Master DevOps & Cloud — M1 — Projet d'intégration de compétences — Février 2026*
