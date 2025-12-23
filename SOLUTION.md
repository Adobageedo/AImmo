# Solution - Problème de Virtual Environment

## 🔍 Problème Identifié

Vous utilisiez **deux environnements Python différents** :
- `python` du venv → `/Users/edoardo/Documents/AImmo/backend/venv/bin/python`
- `pytest` du système → `/Library/Frameworks/Python.framework/Versions/3.13/bin/pytest`

**Résultat** : `pytest` ne trouvait pas `fastapi` car il utilisait Python 3.13 global au lieu du venv Python 3.12.

## ✅ Solution Appliquée

**1. Recréation complète du venv**
```bash
cd backend
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
```

**2. Installation des dépendances**
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install email-validator  # Dépendance manquante pour pydantic EmailStr
```

**3. Vérification**
```bash
# Vérifier que tout utilise le venv
which python    # Doit afficher: .../backend/venv/bin/python
which pytest    # Doit afficher: .../backend/venv/bin/pytest
which uvicorn   # Doit afficher: .../backend/venv/bin/uvicorn

# Tester l'import
python -c "from app.main import app; print('✅ OK')"
```

## 🚀 Commandes pour Démarrer

**IMPORTANT** : Toujours activer le venv d'abord !

```bash
cd backend
source venv/bin/activate  # ⚠️ OBLIGATOIRE

# Démarrer le backend
uvicorn app.main:app --reload

# OU avec host/port spécifiques
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Tests**
```bash
cd backend
source venv/bin/activate  # ⚠️ OBLIGATOIRE

# Tests pytest
pytest tests/ -v

# Tests API
./test_api_endpoints.sh
```

## 📋 Checklist Avant de Démarrer

- [ ] Venv activé : `source venv/bin/activate`
- [ ] Vérifier Python : `which python` → doit montrer `venv/bin/python`
- [ ] Vérifier pytest : `which pytest` → doit montrer `venv/bin/pytest`
- [ ] `.env` configuré avec les variables Supabase
- [ ] Migrations appliquées : `supabase db push`
- [ ] Bucket `documents` créé dans Supabase Storage

## 🔧 Dépendances Installées

**requirements.txt** :
- fastapi==0.109.0
- uvicorn==0.27.0
- supabase==2.9.0
- httpx==0.26.0
- pydantic==2.5.3
- email-validator (ajouté)
- + toutes les autres

**requirements-dev.txt** :
- pytest==7.4.3
- pytest-asyncio==0.21.1
- pytest-cov==4.1.0
- faker==22.0.0

## ⚠️ Erreurs Résolues

1. ✅ `ModuleNotFoundError: No module named 'fastapi'` → venv recrée
2. ✅ `TypeError: Client.__init__() got an unexpected keyword argument 'proxy'` → httpx==0.26.0
3. ✅ `NameError: name 'get_current_user' is not defined` → remplacé par get_current_user_id
4. ✅ `ImportError: email-validator is not installed` → pip install email-validator

## 📝 Notes Importantes

**Toujours utiliser le venv** :
```bash
# ❌ MAUVAIS
pytest tests/

# ✅ BON
source venv/bin/activate
pytest tests/
```

**Vérifier l'environnement** :
```bash
# Afficher les packages installés
pip list

# Vérifier une dépendance spécifique
pip show fastapi
```

**Si problème persiste** :
```bash
# Nettoyer et réinstaller
cd backend
deactivate
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
pip install email-validator
```

## 🎯 Prochaines Étapes

1. **Configurer .env** (si pas fait)
2. **Appliquer migrations** : `supabase db push`
3. **Créer bucket Storage** : Dashboard Supabase
4. **Démarrer backend** : `uvicorn app.main:app --reload`
5. **Démarrer frontend** : `cd frontend && npm run dev`
6. **Tester** : http://localhost:8000/docs

Tout devrait maintenant fonctionner correctement ! 🚀
