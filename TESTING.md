# Guide de Test - AImmo

## 🧪 Scripts de Test Créés

### 1. Test Complet (Recommandé)

Exécute tous les tests de validation :

```bash
./test_all.sh
```

**Ce script vérifie** :
- ✅ Migrations Supabase (6 fichiers SQL)
- ✅ Structure du backend (fichiers Python)
- ✅ Structure du frontend (fichiers TypeScript)
- ✅ Imports Python (constants, schemas, services)
- ✅ Dépendances Node.js (package.json)
- ✅ Fichiers de configuration (.env.example)

### 2. Tests Backend (Pytest)

Tests unitaires Python avec pytest :

```bash
cd backend
chmod +x test_runner.sh
./test_runner.sh
```

**Tests inclus** :
- `test_health.py` - Endpoints health check
- `test_constants.py` - Constantes et enums
- `test_schemas.py` - Schémas Pydantic

### 3. Résultat du Test Complet

```
🚀 AImmo - Test Suite Complète
================================

✅ Migrations Supabase - PASSED (6 fichiers)
✅ Structure Backend - PASSED (7 fichiers)
✅ Structure Frontend - PASSED (5 fichiers)
✅ Imports Python - PASSED
✅ Dépendances Node.js - PASSED (5 packages)
✅ Fichiers de configuration - PASSED

📊 RÉSUMÉ: 6/6 tests réussis ✅
```

## 🔧 Corriger la Migration SQL

**Problème résolu** : Erreur `operator does not exist: uuid = text` dans la migration 005.

**Solution appliquée** : Retrait des casts `::uuid` inutiles dans les policies RLS de Storage.

```sql
-- ❌ AVANT (erreur)
AND (storage.foldername(name))[1]::uuid IN (...)

-- ✅ APRÈS (corrigé)
AND (storage.foldername(name))[1] IN (...)
```

## 🚀 Appliquer les Migrations

Maintenant que la migration est corrigée :

```bash
# Push vers Supabase (remote)
supabase db push

# OU exécuter manuellement dans Supabase > SQL Editor
# Ordre: 001 → 002 → 003 → 004 → 005 → 006
```

## 📝 Tests Disponibles

### Backend

| Test | Description | Commande |
|------|-------------|----------|
| Health Check | Vérifie que l'API démarre | `pytest tests/test_health.py` |
| Constants | Valide les enums et constantes | `pytest tests/test_constants.py` |
| Schemas | Vérifie les modèles Pydantic | `pytest tests/test_schemas.py` |
| Tous | Exécute tous les tests | `./test_runner.sh` |

### Frontend

**Tests TypeScript** (configuration de base créée) :
```bash
cd frontend
npm run test:types  # Vérification TypeScript
npm run test:lint   # Linting
```

### Base de données

**Vérifier les migrations** :
```bash
supabase migration list
supabase db diff
```

## 🐛 Troubleshooting

### Erreur "Virtual environment not found"

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Tests Python échouent

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt
pytest tests/ -v
```

### Migration SQL échoue

- Vérifier que toutes les migrations précédentes sont appliquées
- Vérifier que le bucket "documents" existe dans Supabase Storage
- Créer le bucket manuellement si nécessaire : Dashboard > Storage > New Bucket

## ✅ Checklist de Validation

Avant de déployer en production :

- [ ] Toutes les migrations SQL appliquées
- [ ] Bucket "documents" créé dans Storage
- [ ] Policies RLS actives
- [ ] Tests backend passent (pytest)
- [ ] Tests de structure passent (test_all.sh)
- [ ] Variables d'environnement configurées
- [ ] Backend démarre sans erreur
- [ ] Frontend compile sans erreur

## 🎯 Prochaines Étapes

Après validation des tests :

1. **Configurer Supabase** :
   ```bash
   # Créer le bucket documents
   # Appliquer les migrations
   supabase db push
   ```

2. **Démarrer les services** :
   ```bash
   # Terminal 1: Qdrant
   docker-compose up -d
   
   # Terminal 2: Backend
   cd backend && uvicorn app.main:app --reload
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

3. **Tester l'application** :
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/api/v1/docs
   - Health: http://localhost:8000/api/v1/health

## 📚 Documentation Complète

- `README.md` - Vue d'ensemble du projet
- `INSTALL.md` - Installation complète
- `DOCUMENTS_SETUP.md` - Système de gestion documentaire
- `OCR_PARSING_SETUP.md` - Pipeline OCR et parsing
- `TESTING.md` - Ce guide de test
