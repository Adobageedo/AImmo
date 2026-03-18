# 📋 Newsletter Jurisprudence - Documentation

## 📖 Vue d'ensemble

Système automatisé de génération de newsletters hebdomadaires sur la jurisprudence immobilière française. Le système :

1. **Récupère** les décisions de jurisprudence depuis l'API Legifrance
2. **Analyse** avec IA (GPT-4) pour identifier les cas immobiliers
3. **Résume** chaque décision en langage accessible
4. **Regroupe** par thèmes dynamiques déterminés par LLM
5. **Génère** une newsletter HTML moderne et responsive
6. **Sauvegarde** dans Supabase pour envoi ultérieur

## 🎯 Fonctionnalités

### ✅ Implémenté

- Fetch automatique depuis Legifrance API
- Détection IA des articles immobiliers
- Résumés optimisés pour mobile avec sections structurées
- **Regroupement thématique dynamique par LLM** (pas de thèmes fixes)
- Template HTML moderne, responsive et marketing-friendly
- Sauvegarde dans Supabase (newsletter_editions)
- API endpoints pour génération manuelle
- Scheduler hebdomadaire (tous les lundis 9h)
- Scripts de test et d'initialisation

### 🔜 À venir (Phase 2)

- Système d'envoi email (Resend/SendGrid)
- Statistiques d'ouverture
- Personnalisation par préférences utilisateur

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Ajouter dans `.env` :

```bash
# Legifrance API (obligatoire)
LEGIFRANCE_CLIENT_ID=your_client_id
LEGIFRANCE_CLIENT_SECRET=your_client_secret

# OpenAI API (obligatoire)
OPENAI_API_KEY=sk-...
```

**Obtenir les credentials Legifrance** :
1. Créer un compte sur [PISTE Gouv](https://piste.gouv.fr)
2. Créer une application
3. Récupérer Client ID et Client Secret

### 2. Installer les dépendances

```bash
cd backend
pip install beautifulsoup4 apscheduler
```

### 3. Appliquer la migration

```bash
cd /Users/edoardo/Documents/AImmo
supabase db push
```

Cela créera la table `jurisprudence_articles`.

### 4. Initialiser la newsletter

```bash
cd backend
python scripts/init_jurisprudence_newsletter.py
```

Cela créera l'entrée "Jurisprudence Immobilière" dans la table `newsletters`.

## 🧪 Test manuel

### Générer une newsletter de test

```bash
# Derniers 7 jours
python scripts/test_jurisprudence_newsletter.py

# Derniers 30 jours (plus de résultats)
python scripts/test_jurisprudence_newsletter.py --days 30

# Période spécifique
python scripts/test_jurisprudence_newsletter.py --start 2024-01-01 --end 2024-01-31
```

**Ce que fait le script** :
1. Cherche les décisions dans la période spécifiée
2. Analyse chaque article (peut prendre plusieurs minutes)
3. Génère les résumés avec IA
4. Regroupe par thèmes dynamiques
5. Crée le HTML
6. Sauvegarde dans `newsletter_editions`

**Temps d'exécution** : 
- ~30 secondes par article (API Legifrance + OpenAI)
- Pour 10 articles : ~5 minutes
- Pour 50 articles : ~25 minutes

## 📡 API Endpoints

### Générer une newsletter (asynchrone)

```bash
POST /api/v1/jurisprudence/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "lookback_days": 7
}
```

Réponse immédiate, génération en arrière-plan.

### Générer une newsletter (synchrone)

```bash
POST /api/v1/jurisprudence/generate/sync
Content-Type: application/json
Authorization: Bearer {token}

{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

Attend la fin de la génération (peut prendre plusieurs minutes).

### Statistiques

```bash
GET /api/v1/jurisprudence/stats
Authorization: Bearer {token}
```

Retourne le nombre d'articles traités, taux de succès, etc.

## ⏰ Scheduler automatique

Le scheduler génère automatiquement une newsletter **tous les lundis à 9h00**.

### Activation

Le scheduler est activé automatiquement au démarrage de l'application FastAPI via `app/core/scheduler.py`.

### Configuration

Modifier dans `app/core/scheduler.py` :

```python
scheduler.add_job(
    generate_weekly_jurisprudence_newsletter,
    trigger=CronTrigger(day_of_week='mon', hour=9, minute=0),  # Modifier ici
    ...
)
```

## 📊 Structure des données

### Table: jurisprudence_articles

```sql
- id: UUID (PK)
- legifrance_id: TEXT (unique)
- title: TEXT
- decision_date: DATE
- is_real_estate: BOOLEAN
- summary: TEXT (HTML)
- created_at: TIMESTAMP
```

### Table: newsletter_editions (existante)

```sql
- id: UUID (PK)
- newsletter_id: UUID (FK → newsletters)
- title: TEXT
- content: TEXT (HTML complet)
- published_at: TIMESTAMP
```

## 🎨 Améliorations apportées

### Par rapport au projet legi original

1. **Thèmes dynamiques** : Plus de thèmes fixes, le LLM analyse et crée des thèmes pertinents
2. **UI moderne** : Template HTML avec gradient, cards, responsive design
3. **Mobile-first** : Optimisé pour lecture sur smartphone
4. **Marketing-friendly** : Langage accessible, sections structurées avec emojis
5. **Intégration Supabase** : Pas de SQLite, tout dans Supabase
6. **API REST** : Déclenchement via API pour automatisation future
7. **Scheduler intégré** : APScheduler au lieu de LaunchD/cron externe

### Format des résumés

Chaque article utilise maintenant 4 sections HTML :

```html
<div class="summary-section">
    <h3>🎯 L'essentiel</h3>
    <p class="highlight">Phrase percutante de la décision</p>
</div>

<div class="summary-section">
    <h3>📋 Les faits</h3>
    <p>Situation expliquée simplement</p>
</div>

<div class="summary-section">
    <h3>⚖️ La décision</h3>
    <p>Raisonnement du tribunal</p>
</div>

<div class="summary-section">
    <h3>💡 Impact pratique</h3>
    <p>Ce que ça change concrètement</p>
</div>
```

## 🔧 Dépannage

### Erreur: "Newsletter not found"

```bash
python scripts/init_jurisprudence_newsletter.py
```

### Erreur: "LEGIFRANCE_CLIENT_ID not set"

Ajouter les credentials dans `.env`

### Aucun article trouvé

- Augmenter la période : `--days 30`
- Vérifier les credentials Legifrance
- Vérifier la connexion internet

### Génération trop lente

C'est normal ! Chaque article prend ~30s (API externe + IA). Options :

- Réduire la période
- Utiliser l'endpoint asynchrone `/generate`
- Laisser le scheduler faire le travail la nuit

## 📈 Prochaines étapes

1. **Phase 2** : Système d'envoi email
2. **Phase 3** : Statistiques d'ouverture
3. **Phase 4** : Préférences utilisateur (thèmes, fréquence)
4. **Phase 5** : Multi-newsletters (fiscalité, urbanisme, etc.)

## 📞 Support

- Logs : `backend/logs/`
- Issues : Vérifier les logs FastAPI
- API docs : `http://localhost:8000/docs` → Section "jurisprudence"
