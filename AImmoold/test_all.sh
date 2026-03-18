#!/bin/bash

echo "🚀 AImmo - Test Suite Complète"
echo "================================"
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS_COUNT=0
FAIL_COUNT=0

# Fonction pour afficher le résultat
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 - PASSED${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ $2 - FAILED${NC}"
        ((FAIL_COUNT++))
    fi
    echo ""
}

# Test 1: Vérifier les migrations Supabase
echo "📊 Test 1: Vérification des migrations Supabase"
echo "------------------------------------------------"
if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo "Nombre de migrations trouvées: $MIGRATION_COUNT"
    if [ $MIGRATION_COUNT -ge 6 ]; then
        print_result 0 "Migrations Supabase"
    else
        echo "⚠️  Attendu: au moins 6 migrations, trouvé: $MIGRATION_COUNT"
        print_result 1 "Migrations Supabase"
    fi
else
    echo "❌ Dossier supabase/migrations introuvable"
    print_result 1 "Migrations Supabase"
fi

# Test 2: Vérifier la structure du backend
echo "🔧 Test 2: Structure du backend"
echo "--------------------------------"
REQUIRED_BACKEND_FILES=(
    "backend/app/main.py"
    "backend/app/core/config.py"
    "backend/app/core/supabase.py"
    "backend/app/services/document_service.py"
    "backend/app/services/ocr_service.py"
    "backend/app/services/processing_service.py"
    "backend/requirements.txt"
)

BACKEND_OK=0
for file in "${REQUIRED_BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (manquant)"
        BACKEND_OK=1
    fi
done
print_result $BACKEND_OK "Structure Backend"

# Test 3: Vérifier la structure du frontend
echo "⚛️  Test 3: Structure du frontend"
echo "--------------------------------"
REQUIRED_FRONTEND_FILES=(
    "frontend/package.json"
    "frontend/app/layout.tsx"
    "frontend/app/dashboard/documents/page.tsx"
    "frontend/lib/services/document-service.ts"
    "frontend/lib/services/processing-service.ts"
)

FRONTEND_OK=0
for file in "${REQUIRED_FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (manquant)"
        FRONTEND_OK=1
    fi
done
print_result $FRONTEND_OK "Structure Frontend"

# Test 4: Tester les imports Python basiques (sans .env)
echo "🐍 Test 4: Imports Python du backend"
echo "-------------------------------------"
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    # Tester uniquement les imports qui ne nécessitent pas de config
    python -c "
try:
    from app.core.constants import DocumentType, OCRProvider
    from app.schemas.document import DocumentCreate
    from app.schemas.ocr import ParsedLease, OCRResult
    print('✓ Tous les imports Python basiques fonctionnent')
    exit(0)
except Exception as e:
    print(f'✗ Erreur import: {e}')
    exit(1)
" 2>&1
    PYTHON_IMPORTS=$?
    print_result $PYTHON_IMPORTS "Imports Python"
    deactivate
else
    echo "⚠️  Virtual environment non trouvé, skip"
    print_result 1 "Imports Python"
fi
cd ..

# Test 5: Vérifier les dépendances Node.js
echo "📦 Test 5: Dépendances Node.js"
echo "-------------------------------"
cd frontend
if [ -f "package.json" ]; then
    # Vérifier que les dépendances importantes sont présentes
    DEPS_OK=0
    REQUIRED_DEPS=("next" "react" "@supabase/supabase-js" "zustand" "lucide-react")
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo "✓ $dep trouvé"
        else
            echo "✗ $dep manquant"
            DEPS_OK=1
        fi
    done
    print_result $DEPS_OK "Dépendances Node.js"
else
    print_result 1 "Dépendances Node.js"
fi
cd ..

# Test 6: Vérifier les variables d'environnement
echo "🔐 Test 6: Fichiers de configuration"
echo "------------------------------------"
ENV_OK=0
if [ -f "backend/.env.example" ]; then
    echo "✓ backend/.env.example"
else
    echo "✗ backend/.env.example manquant"
    ENV_OK=1
fi

if [ -f "frontend/.env.example" ]; then
    echo "✓ frontend/.env.example"
else
    echo "✗ frontend/.env.example manquant"
    ENV_OK=1
fi
print_result $ENV_OK "Fichiers de configuration"

# Test 7: Tester le serveur backend (optionnel)
echo "🌐 Test 7: Backend API (optionnel)"
echo "-----------------------------------"
echo "⚠️  Pour tester l'API, démarrez le serveur avec:"
echo "   cd backend && uvicorn app.main:app --reload"
echo "   puis testez: curl http://localhost:8000/api/v1/health"
echo ""

# Résumé final
echo "======================================"
echo "📊 RÉSUMÉ DES TESTS"
echo "======================================"
echo -e "${GREEN}✅ Tests réussis: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Tests échoués: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Démarrer Qdrant: docker-compose up -d"
    echo "2. Lancer le backend: cd backend && uvicorn app.main:app --reload"
    echo "3. Lancer le frontend: cd frontend && npm run dev"
    echo "4. Tester sur: http://localhost:3000"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.${NC}"
    exit 1
fi
