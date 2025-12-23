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
Vector DB (qdrant)
Environnements : local / prod
Créer le monorepo (Turborepo) avec packages frontend/ et backend/.  
Frontend : Next.js App Router + TailwindCSS. Backend : FastAPI ou NestJS.  
Dossier structure :

- hooks/ -> hooks globaux (useAuth, useRAG, useChat, useDocuments)
- lib/ -> utilitaires (vectorisation, embeddings, parsing LLM)
- services/ -> appels API supabase, backend, LLM
- components/ -> composants UI réutilisables (ChatBox, TableGenerator, Canvas, DocumentExplorer)
- types/ -> types TS (User, Organization, Document, Chunk, Lease, Tenant, Conversation, Message)
- context/ -> React context pour Auth, RAG, Chat
- constants/ -> constantes globales (chunk size, model embeddings, sources RAG)
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
conversations
messages
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

3️⃣ Phase 2 – Documents & Storage (sans RAG) (Semaine 2–3)
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
🚫 PAS de RAG encore
 🚫 PAS d’OCR encore
📌 À la fin :
Les utilisateurs peuvent stocker & organiser leurs fichiers
Créer services/documents.ts -> upload, overwrite, suppression, quotas Supabase.  
Hooks : useDocuments.ts -> fetch documents, filtre, arborescence.  
Composants : DocumentExplorer.tsx -> affichage dossier / fichiers en BEM :

<div class="document-explorer">
  <div class="document-explorer__folder">Nom dossier</div>
  <div class="document-explorer__file document-explorer__file--pdf">Fichier.pdf</div>
</div>

Créer types : Document, DocumentChunk.  
Créer styles/documents.css pour BEM + Tailwind.  
Mettre source_type générique pour RAG (document, lease, property, KPI).


4️⃣ Phase 3 – OCR + parsing baux (Semaine 3–5)
🎯 Objectif : transformer fichiers → données métier
4.1 OCR pipeline
Détection PDF scanné
OCR (Tesseract / ou GPT Vision) donner un troisieme milieu
Extraction texte brut
Détection langue
Important : design générique → propriétés spécifiques peuvent être remplacées par d’autres entités métiers.

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

<div class="parsing-validation">
  <div class="parsing-validation__field">Partie bail: ...</div>
  <button class="parsing-validation__button parsing-validation__button--confirm">Valider</button>
</div>

Les outputs doivent être génériques pour RAG (chunking par type, pas hardcodé à bail).  
Créer types ParsingResult, FieldExtraction.  
Styles : parsing.css

5️⃣ Phase 4 – RAG fondation (Semaine 5–6)
🎯 Objectif : rendre l’IA utile sur TES données
5.1 Indexation
Chunking par type
Vectorisation automatique
possibilité exclure fichier du rag/vectorisation
Index par source :
documents
baux
propriétés
KPI
Liens chunk → document / bail
5.2 Contrôles RAG
Toggle visibilité par source
Inclusion / exclusion document
Tags sémantiques automatiques


📌 À la fin :
Tu peux récupérer des chunks pertinents par org
Créer lib/rag.ts -> fonctions chunking, vectorisation, indexation, recherche.  
Hooks : useRAG.ts -> récupérer chunks pertinents selon org et source.  
Context : RAGContext.tsx -> toggles visibilité, inclusion/exclusion.  
Types : Chunk, SourceType, RAGConfig.  
Composants UI pour toggles BEM :

<div class="rag-toggle">
  <label class="rag-toggle__label">Documents</label>
  <input type="checkbox" class="rag-toggle__input" />
</div>

Styles : rag.css

6️⃣ Phase 5 – Chat MVP (Semaine 6–8)
🎯 Objectif : cœur produit fonctionnel
6.1 UI Chat
Interface type ChatGPT
Streaming
Historique conversations
Rename / delete
Suggestions de prompts
6.2 Backend Chat
Pre-call API métier
Sélection du RAG par user
Mode RAG only
Citations cliquables
6.3 Capacités clés
Résumé de bail
Comparaison de biens
Génération tableaux
Export Excel / PDF
Canvas simple (markdown + tables)
📌 À la fin :
Ton produit est déjà vendable
Composants : ChatBox.tsx :

<div class="chat">
  <div class="chat__messages"></div>
  <div class="chat__input">
    <textarea class="chat__textarea"></textarea>
    <button class="chat__button chat__button--send">Envoyer</button>
  </div>
</div>

Services : chatService.ts -> pre-call API métier, sélection RAG, mode RAG only.  
Hooks : useChat.ts -> interaction Chat + RAG.  
Context : ChatContext.tsx -> conversation courante, sources RAG actives.  
Types : Conversation, Message.  
Styles : chat.css

7️⃣ Phase 6 – Propriétés / Locataires / Baux UI (Semaine 8–9)
🎯 Objectif : donner une vraie UI métier
À faire
Listes + fiches détaillées
Liens documents ↔ baux ↔ propriétés
Calcul rendement par bien
Statut paiement
📌 À la fin :
Le produit fonctionne même sans le chat
Composants génériques réutilisables pour toutes entités :  
EntityList.tsx, EntityDetail.tsx

<div class="entity-list">
  <div class="entity-list__item entity-list__item--highlight">Nom Entité</div>
</div>

Hooks : useProperties.ts, useTenants.ts, useLeases.ts → génériques pour tout type d’entité.  
Styles : entity.css

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
Le produit devient “direction / invest”
Composants : KpiCard.tsx, Chart.tsx
Hooks : useDashboard.ts -> fetch et calcul KPI
Lib : dashboardCalculations.ts -> fonctions calcul performances, taux
HTML BEM exemple :
<div class="dashboard">
  <div class="dashboard__kpi-card dashboard__kpi-card--highlight"></div>
  <div class="dashboard__chart"></div>
</div>
Styles : dashboard.css

9️⃣ Phase 8 – Alertes & newsletter MVP (Semaine 10–11)
🎯 Objectif : rétention utilisateur
Alertes
Impayés
Renouvellements
Indexation
Centre d’alertes
Newsletter
Opt-in / opt-out
Liste newsletters
Preview dernière édition
Historique
Hooks : useAlerts.ts, useNewsletter.ts  
Services : alertsService.ts, newsletterService.ts  
Composants : AlertCenter.tsx, NewsletterPreview.tsx

<div class="alert-center">
  <div class="alert-center__item alert-center__item--unpaid">Loyer impayé</div>
</div>

Types : Alert, Newsletter  
Styles : alerts.css, newsletter.css

🔟 Phase 9 – Stabilisation MVP (Semaine 11–12)
🎯 Objectif : pouvoir ouvrir à des clients
Performance
Sécurité
Bug fixing
UX polish
Seed data / démo
Documentation interne



Tests unitaires et intégration : hooks, lib, services  
Optimisation RAG et Chat générique pour tout type de données  
Documentation interne dans docs/ pour setup RAG, Chat, parsing, dashboard  
Polish UX et performance  
Seed data pour démo
