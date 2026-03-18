#!/bin/bash

echo "🧪 AImmo Backend Tests"
echo "====================="
echo ""

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "❌ Virtual environment not found. Please run: python -m venv venv"
    exit 1
fi

# Installer les dépendances de test
echo ""
echo "📦 Installing test dependencies..."
pip install -q -r requirements-dev.txt

# Lancer les tests
echo ""
echo "🏃 Running tests..."
echo ""

pytest tests/ -v --cov=app --cov-report=term-missing

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All backend tests passed!"
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi
