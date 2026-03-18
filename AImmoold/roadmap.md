1️⃣ Phase 0 – Setup & fondations (Semaine 0–1)
🎯 Objectif : pouvoir développer vite sans dette technique
1.1 Stack & infra
Repo monorepo (ex: Turborepo)
Frontend : Next.js (App Router) + Tailwind
Backend : API (FastAPI ou Nest) séparée
Supabase :
Auth
Postgres
Storage
Environnements : local / prod
Créer le monorepo (Turborepo) avec packages frontend/ et backend/.  
Frontend : Next.js App Router + TailwindCSS. Backend : FastAPI ou NestJS.  
Dossier structure :

- hooks/ -> hooks globaux (useAuth, useDocuments)
- lib/ -> utilitaires (parsing documents)
- services/ -> appels API supabase, backend
- components/ -> composants UI réutilisables (TableGenerator, DocumentExplorer)
- types/ -> types TS (User, Organization, Document, Lease, Tenant)
- context/ -> React context pour Auth
- constants/ -> constantes globales
- styles/ -> fichiers CSS/Tailwind globaux et BEM additionnel

Créer un exemple de composant HTML avec BEM pour le layout global :
<div class="app">
  <header class="app__header"></header>
  <main class="app__content"></main>
  <footer class="app__footer"></footer>
</div>

1.2 Schéma BDD v1
users (supabase)
organizations
organization_users
roles
documents
properties
tenants
leases
👉 Aucune feature, juste le socle propre

2️⃣ Phase 1 – Auth, organisations, permissions (Semaine 1–2)
À implémenter
Auth Supabase :
signup
login
reset password
email verification
Création automatique d’une organisation à l’inscription
Switch d’organisation (frontend + backend)
Rôles :
Admin
User
Middleware backend :
organisation_id obligatoire
user ∈ organisation
📌 À la fin :
Tu peux te connecter, changer d’org, appeler ton API proprement


Créer services/auth.ts -> signup/login/reset password/email verify via Supabase.  
Créer context/AuthContext.tsx -> user, organization actuelle, role.  
Pages frontend : login.tsx, signup.tsx, organisation switch.  
Créer middleware backend pour vérifier organisation_id et user ∈ organisation.  

Composants HTML avec BEM : 
<div class="auth">
  <form class="auth__form">
    <input class="auth__input" />
    <button class="auth__button auth__button--primary">Connexion</button>
  </form>
</div>

Créer types TS : Role, OrganizationUser.  
Créer styles/auth.css ou auth.module.css pour les classes BEM spécifiques à auth.

3️⃣ Phase 2 – Documents & Storage (Semaine 2–3)
🎯 Objectif : ingestion fiable des documents
3.1 Storage
Upload fichier (Supabase Storage)
Arborescence logique (folder_path)
Quotas par organisation
Suppression / overwrite
3.2 Métadonnées
Table documents :
type
tags
linked_property_id
linked_lease_id
UI explorateur simple
📌 À la fin :
Les utilisateurs peuvent stocker & organiser leurs fichiers
Créer services/documents.ts -> upload, overwrite, suppression, quotas Supabase.  
Hooks : useDocuments.ts -> fetch documents, filtre, arborescence.  
Composants : DocumentExplorer.tsx -> affichage dossier / fichiers en BEM :


4️⃣ Phase 3 – OCR + parsing baux (Semaine 3–5)
🎯 Objectif : transformer fichiers → données métier
4.1 OCR pipeline
Détection PDF scanné
OCR (Tesseract / ou GPT Vision) donner un troisieme milieu
Extraction texte brut
Détection langue
Important : design générique → propriétés spécifiques peuvent être remplacées par d'autres entités métiers.

4.2 Parsing bail (LLM)
Prompt d’extraction structuré
Extraction :
parties
dates
montants
clauses clés
UI validation utilisateur
Création automatique :
propriété
locataire
bail
📌 À la fin :
Upload d’un bail = données exploitables
Créer lib/ocr.ts -> OCR PDF/Images via Tesseract / GPT Vision / API externe.  
Créer lib/llmParser.ts -> prompts d’extraction (parties, dates, montants, clauses).  
Hooks : useParsing.ts -> pipeline upload → OCR → parsing → validation.  
Service : parsingService.ts pour appeler backend LLM.  
Composant UI : ParsingValidation.tsx :

5️⃣ Phase 4 – Propriétés / Locataires / Baux UI (Semaine 5–6)
🎯 Objectif : donner une vraie UI métier
5.1 Entités métiers
Listes + fiches détaillées
Liens documents ↔ baux ↔ propriétés
Calcul rendement par bien
Statut paiement
📌 À la fin :
Le produit fonctionne avec une interface complète

6️⃣ Phase 5 – Dashboard Portefeuille MVP (Semaine 6–8)
🎯 Objectif : vue macro PowerBI-like
Backend
Agrégations KPI
Calcul taux occupation, vacance, loyers
Frontend
KPIs cards
Graphiques essentiels
Filtres globaux
Carte géographique simple
📌 À la fin :
Le produit devient "direction / invest"

7️⃣ Phase 6 – Alertes & newsletter MVP (Semaine 8–9)
🎯 Objectif : rétention utilisateur
Alertes
Impayés
Renouvellements
Indexation
Centre d'alertes
Newsletter
Opt-in / opt-out
Liste newsletters
Preview dernière édition
Historique
📌 À la fin :
Système d'notifications fonctionnel

8️⃣ Phase 7 – Dashboard Portefeuille MVP (Semaine 9–10)
🎯 Objectif : vue macro PowerBI-like
Backend
Agrégations KPI
Calcul taux occupation, vacance, loyers
Frontend
KPIs cards
Graphiques essentiels
Filtres globaux
Carte géographique simple
📌 À la fin :
Le produit devient "direction / invest"

9️⃣ Phase 8 – Stabilisation MVP (Semaine 10–11)
🎯 Objectif : pouvoir ouvrir à des clients
Performance
Sécurité
Bug fixing
UX polish
Seed data / démo
Documentation interne
