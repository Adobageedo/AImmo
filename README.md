# AImmo - Plateforme de Gestion Immobilière

Plateforme de gestion immobilière avec RAG, dashboard analytique et chat IA.

## Architecture

### Stack Technique

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python 3.11+)
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Storage**: Supabase Storage
- **Vector DB**: Qdrant
- **Déploiement**: 
  - Frontend: Vercel
  - Backend: Railway
  - BDD: Supabase Cloud

### Schéma de Base de Données v1

```
users (gérés par Supabase Auth)
├── organizations
│   └── organization_users
│       └── roles
├── documents
├── properties
├── tenants
├── leases
├── conversations
│   └── messages
```

## Installation Locale

### Prérequis

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Compte Supabase

### 1. Cloner et installer les dépendances

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer les clés API (Settings > API)
3. Exécuter les migrations SQL (voir `backend/migrations/`)

### 3. Variables d'environnement

```bash
# Frontend - Créer frontend/.env.local
cp frontend/.env.example frontend/.env.local

# Backend - Créer backend/.env
cp backend/.env.example backend/.env
```

Remplir les valeurs avec vos credentials Supabase et Qdrant.

### 4. Démarrer les services

```bash
# Démarrer Qdrant
docker-compose up -d

# Démarrer le backend (dans un terminal)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Démarrer le frontend (dans un autre terminal)
cd frontend
npm run dev
```

L'application sera accessible sur:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Qdrant: http://localhost:6333

## Structure du Projet

```
aimmo/
├── frontend/              # Next.js App Router
│   ├── app/              # Routes et pages
│   ├── components/       # Composants réutilisables
│   ├── lib/              # Utilitaires et clients
│   └── public/           # Assets statiques
├── backend/              # FastAPI
│   ├── app/
│   │   ├── api/         # Endpoints API
│   │   ├── models/      # Modèles SQLAlchemy
│   │   ├── schemas/     # Schémas Pydantic
│   │   ├── services/    # Logique métier
│   │   └── core/        # Configuration
│   └── migrations/      # Migrations SQL
├── docker-compose.yml    # Services locaux
└── README.md
```

## Développement

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Documentation API disponible sur: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev
```

### Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Déploiement

### Frontend (Vercel)

```bash
cd frontend
vercel
```

### Backend (Railway)

1. Connecter le repo GitHub à Railway
2. Configurer les variables d'environnement
3. Railway détectera automatiquement FastAPI

### Base de Données

Les migrations sont gérées via Supabase. Exécuter les scripts SQL dans l'ordre:
1. `001_initial_schema.sql`
2. `002_seed_data.sql` (optionnel)

## License

Proprietary
