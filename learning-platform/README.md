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
└───────────────┘ └──────────┘ └────────────────────────┘
┌───────────────────────────────────────────────────────┐
│  MinIO :9000/:9001   │   n8n Automation :5678         │
└───────────────────────────────────────────────────────┘
```

---

## Prérequis

- **Docker Desktop** pour Windows — [Télécharger](https://www.docker.com/products/docker-desktop/)
- RAM minimum : **8 Go** recommandé
- Ports disponibles : 80, 3000, 3001, 5432, 5678, 6379, 8001, 8002, 8003, 9000, 9001, 27017

---

## ⚡ Premier démarrage (installation propre)

```bash
cd learning-platform
docker compose up --build
```

Attendre ~2 minutes que tous les services démarrent. Accéder ensuite à **http://localhost**.

---

## 🔄 Si vous avez déjà lancé et eu des erreurs

Si PostgreSQL a crashé lors d'une tentative précédente, ses volumes sont corrompus. Il faut les supprimer avant de relancer :

```bash
# Stopper tout et supprimer les volumes (RESET COMPLET)
docker compose down -v

# Relancer proprement
docker compose up --build
```

> ⚠️ `docker compose down -v` supprime les données. Ne l'utilisez qu'en cas de problème au premier démarrage.

---

## URLs d'accès

| Service             | URL                              | Description                        |
|---------------------|----------------------------------|------------------------------------|
| **Frontend**        | http://localhost                 | Application principale             |
| **Catalogue cours** | http://localhost/courses         | Parcourir les cours                |
| **AI Tutor**        | http://localhost/ai-tutor        | Assistant IA                       |
| **Tableau de bord** | http://localhost/dashboard       | Dashboard apprenant                |
| **n8n Automation**  | http://localhost:5678            | Interface n8n                      |
| **MinIO Console**   | http://localhost:9001            | Stockage objets                    |
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
  -d "{\"email\": \"nouveau@test.fr\", \"password\": \"MonMotDePasse123\", \"firstName\": \"Marie\", \"lastName\": \"Curie\", \"role\": \"student\"}"
```

#### Connexion
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"student@learncloud.fr\", \"password\": \"Admin@1234\"}"
```

#### Profil utilisateur (authentifié)
```bash
# Remplacer TOKEN par le JWT obtenu à la connexion
curl http://localhost/api/auth/me -H "Authorization: Bearer TOKEN"
```

### Course Service (FastAPI — :8001)

#### Lister tous les cours
```bash
curl http://localhost/api/courses
```

#### Rechercher des cours
```bash
curl "http://localhost/api/courses?search=docker&category=DevOps&level=beginner"
```

#### S'inscrire à un cours
```bash
curl -X POST http://localhost/api/courses/1/enroll -H "Authorization: Bearer TOKEN"
```

### Analytics Service (FastAPI — :8002)

#### Tableau de bord analytics
```bash
curl http://localhost/api/analytics/dashboard
```

#### Tracker un événement
```bash
curl -X POST http://localhost/api/analytics/events \
  -H "Content-Type: application/json" \
  -d "{\"event_type\": \"course_view\", \"user_id\": \"user-123\", \"course_id\": 1}"
```

### AI Tutor Service (FastAPI — :8003)

#### Poser une question
```bash
curl -X POST http://localhost/api/ai-tutor/ask \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Comment fonctionne Docker Compose ?\", \"course_id\": 1}"
```

#### Générer un quiz
```bash
curl -X POST http://localhost/api/ai-tutor/quiz \
  -H "Content-Type: application/json" \
  -d "{\"course_id\": 1, \"num_questions\": 5, \"difficulty\": \"medium\"}"
```

### n8n — Workflow Feedback

#### Déclencher le webhook
```bash
curl -X POST http://localhost:5678/webhook/feedback \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"user-123\", \"course_id\": 1, \"rating\": 5, \"feedback\": \"Excellent cours !\"}"
```

---

## Commandes Docker utiles

```bash
# Voir l'état de tous les services
docker compose ps

# Logs d'un service spécifique
docker compose logs course-service --tail=50
docker compose logs postgres --tail=50

# Logs en temps réel
docker compose logs -f

# Redémarrer un service
docker compose restart course-service

# Arrêter sans supprimer les données
docker compose down

# RESET COMPLET (supprime les volumes)
docker compose down -v

# Accéder à PostgreSQL
docker compose exec postgres psql -U admin -d learning_platform

# Accéder à MongoDB
docker compose exec mongodb mongosh -u admin -p admin_secure_password --authenticationDatabase admin

# Accéder à Redis
docker compose exec redis redis-cli -a redis_secure_password
```

---

## Structure du projet

```
learning-platform/
├── docker-compose.yml          # Orchestration (valeurs hardcodées, fonctionne sans .env)
├── .env                        # Référence des variables (documentation)
├── README.md
├── nginx-gateway/              # API Gateway Nginx
│   ├── Dockerfile
│   └── nginx.conf
├── learning-frontend/          # Frontend Next.js
│   ├── Dockerfile
│   ├── package.json
│   └── src/app/
│       ├── page.tsx            # Homepage
│       ├── courses/page.tsx    # Catalogue
│       ├── dashboard/page.tsx  # Tableau de bord
│       ├── ai-tutor/page.tsx   # AI Tutor (Chat, Quiz, Reco)
│       └── auth/               # Login / Register
├── course-service/             # FastAPI - Cours, leçons, inscriptions
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── user-service/               # Node.js/Express - Auth JWT, profils
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── analytics-service/          # FastAPI - Stats, tendances, dashboard
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── ai-tutor-service/           # FastAPI - Q&A, Quiz, Recommandations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
├── n8n-automation/             # Workflows n8n
│   └── workflows/
│       └── feedback-workflow.json
├── postgres/
│   └── init.sql                # Schéma + données de test
├── mongodb/
│   └── init.js                 # Collections + utilisateurs de test
├── redis/
│   └── redis.conf
└── minio/
```

---

## Ports exposés

| Conteneur          | Port exposé | Description                    |
|--------------------|-------------|--------------------------------|
| nginx-gateway      | **80**      | Point d'entrée principal       |
| learning-frontend  | 3000        | Application Next.js            |
| course-service     | 8001        | API Course (FastAPI + Swagger) |
| user-service       | 3001        | API User (Express)             |
| analytics-service  | 8002        | API Analytics (FastAPI)        |
| ai-tutor-service   | 8003        | API AI Tutor (FastAPI)         |
| n8n-automation     | 5678        | Interface n8n                  |
| postgres           | 5432        | PostgreSQL                     |
| mongodb            | 27017       | MongoDB                        |
| redis              | 6379        | Redis                          |
| minio              | 9000/9001   | MinIO S3 / Console             |

---

## Technologies

| Couche           | Technologie         | Version  |
|------------------|---------------------|----------|
| API Gateway      | Nginx               | 1.25     |
| Frontend         | Next.js + React     | 14 / 18  |
| Course API       | FastAPI + SQLAlchemy| 0.115    |
| User API         | Express.js          | 4.x      |
| Analytics API    | FastAPI             | 0.115    |
| AI Tutor API     | FastAPI (LLM Mock)  | 0.115    |
| Automation       | n8n                 | Latest   |
| DB Relationnelle | PostgreSQL          | 16       |
| DB Documents     | MongoDB             | 7.0      |
| Cache            | Redis               | 7.2      |
| Stockage médias  | MinIO               | Latest   |
| Conteneurisation | Docker Compose      | v2       |

---

## Dépannage

### PostgreSQL refuse de démarrer
```bash
# Reset des volumes et redémarrage propre
docker compose down -v
docker compose up --build
```

### Un service reste "unhealthy"
```bash
# Voir les logs du service concerné
docker compose logs <nom-service> --tail=100
# Ex: docker compose logs course-service --tail=100
```

### Port déjà utilisé
```bash
# Windows - vérifier les ports occupés
netstat -ano | findstr ":80"
netstat -ano | findstr ":5432"
```

---

*Master DevOps & Cloud — M1 — Projet d'intégration de compétences — Février 2026*
