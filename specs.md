1️⃣ Socle transverse (plateforme)
1.1 Authentification & gestion des accès
Authentification
Email / mot de passe (supabase) [MVP]
Reset password (supabase) [MVP]
Vérification email (supabase) [MVP]
OAuth Google / Microsoft [NON-MVP]
MFA / 2FA [NON-MVP]
Organisations / Workspaces
Un utilisateur appartient à 1 ou plusieurs organisations [MVP]
Chaque organisation possède :
ses propriétés
ses documents
son RAG
ses dashboards
Switch d’organisation dans l’UI [MVP]
Rôles & permissions
Admin (tout) [MVP]
User (lecture / écriture limitée) [MVP]
Company User (permissions fines par module) [NON-MVP]
Permissions par :
module (Documents, Chat, Dashboard…)
type de donnée (baux, KPI, propriétés) [NON-MVP]
Sécurité & conformité
Isolation stricte des données par organisation [MVP]
Logs de connexions [MVP]
Audit trail actions sensibles (upload, suppression, parsing, export) [NON-MVP]
RGPD : export & suppression des données [NON-MVP]

2️⃣ Dashboard Portefeuille (Power BI-like)
2.1 Filtres globaux
Année / période personnalisée [MVP]
Organisation / société des baux [MVP]
Propriétés (multi-select) [MVP]
Ville / région / pays [MVP]
Type de bien (civil / commercial / industriel) [MVP]
Bouton export dataset brut [NON-MVP]

2.2 KPI globaux
KPI financiers
Valeur du portefeuille [MVP]
Loyers encaissés (YTD) [MVP]
Rendement moyen brut / net [MVP]
Cashflow [NON-MVP]
TRI estimé [NON-MVP]
KPI opérationnels
Taux d’occupation global [MVP]
Taux de vacance [MVP]
Nombre de biens / baux actifs [MVP]
Loyers impayés (> 1 mois) [MVP]
Comparaisons
Variation vs N-1 [NON-MVP]
Benchmark marché (par zone) [NON-MVP]

2.3 Graphiques
Performance portefeuille vs benchmark [NON-MVP]
Encaissement loyers :
encaissé
en attente (< 30j)
impayé (> 30j) [MVP]
Évolution du taux de vacance avec seuil configurable [MVP]
Répartition géographique :
carte + bar chart [MVP]
Répartition par type de bien [MVP]
Charges opérationnelles (assurance, gestion, maintenance…) [NON-MVP]

2.4 UX avancée
Widgets modulaires (drag & drop) [NON-MVP]
Sauvegarde de vues personnalisées [NON-MVP]
Export PDF / Excel / PNG [NON-MVP]
Mode présentation (lecture seule) [NON-MVP]

3️⃣ Documents (RAG-first)
3.1 Stockage & sources
Sources disponibles
Personal storage (supabase) [MVP]
Baux (source dédiée sur supabase) [MVP]
Google Drive [NON-MVP]
OneDrive / SharePoint [NON-MVP]
Types de fichiers supportés
PDF, DOCX, XLSX, PPTX
Images (OCR)
TXT, CSV
Limite taille & quota par organisation par defaut [MVP]

3.2 Gestion documentaire
Explorateur de fichiers (arborescence) [MVP]
Upload multiple & drag-and-drop [MVP]
Version simple (overwrite) [MVP]
Suppression / archivage [MVP]
Métadonnées via parsing llm (5 premieres pages)
Titre
Description
Type de document [MVP]
Tags manuels [MVP]
Lien propriété / bail / locataire [MVP]

3.3 OCR & parsing
OCR automatique (PDF scannés / images) [MVP]
Extraction texte brut [MVP]
Détection langue [MVP]
Catégorisation automatique (clarifiée) [non-MVP]
Bail
Facture
Avis d’échéance
Diagnostic
Rapport financier
Autre [MVP]

3.4 RAG (fondation clé)
Chunking configurable par type de doc [MVP]
Vectorisation automatique à l’upload [MVP]
Index séparé par :
documents Drive
documents OneDrive
documents Personnal Storage
baux
propriétés
KPI [MVP]
Toggle visibilité Chat par source, sauvegardé le choix par defaut à l’avenir [MVP]
Inclusion / exclusion document par document [MVP]
Tags sémantiques automatiques [MVP]
Priorité de contexte (poids) [NON-MVP]
Recherche sémantique standalone [NON-MVP]

4️⃣ Propriétés / Locataires / Baux
4.1 Propriétés
Liste + fiche détaillée [MVP]
Adresse, type, surface, valeur estimée [MVP]
Création manuelle [MVP]
Création automatique via parsing bail (valider donc proprietes/locataire et bail) [MVP]
Documents liés [MVP]
Calcul rendement par bien [MVP]
Historique de valorisation [NON-MVP]

4.2 Locataires
Particulier / société [MVP]
Coordonnées complètes [MVP]
Historique des baux [MVP]
Statut paiement (OK / retard / impayé) [MVP]
Scoring risque [NON-MVP]

4.3 Baux
Création
Manuelle [MVP]
Upload + parsing automatique [MVP]
Extraction automatique
Parties (bailleur / locataire) [MVP]
Dates clés (début, fin, renouvellement) [MVP]
Montants (loyer, charges, indexation) [MVP]
Clauses clés (résiliation, indexation) [MVP]
Gestion
Alertes échéances [MVP]
Indexation prévue [MVP]
Versioning [NON-MVP]
Historique des modifications [NON-MVP]
Baux & RAG
Visibilité Chat paramétrable [MVP]
Priorité élevée par défaut [MVP]

5️⃣ Alertes & actions
Loyers impayés [MVP]
Baux à renouveler (< X jours) [MVP]
Indexation prévue [MVP]
Diagnostics expirés [NON-MVP]
Notifications email [NON-MVP]
Notifications in-app [NON-MVP]
Centre d’alertes [MVP]

6️⃣ Newsletter
6.1 Abonnement
Liste des newsletters disponibles [MVP]
Détail (thème, fréquence) [MVP]
Preview dernière édition [MVP]
Opt-in / opt-out [MVP]
Filtres (clarifiés) [NON-MVP]
Immobilier résidentiel
Immobilier commercial
Fiscalité
Réglementation
Marché & tendances

6.2 Historique & stats
Historique newsletters envoyées [MVP]
Stats d’ouverture [NON-MVP]
Temps moyen de lecture [NON-MVP]

7️⃣ Chat (ChatGPT-like + RAG avancé)
7.1 UI
Interface conversationnelle [MVP]
Streaming réponses [MVP]
Historique conversations [MVP]
Renommage / suppression conversations [MVP]
Citations sources rag cliquables [MVP]
Suggestion 3 à 5 prochain user prompt

7.2 Connexion RAG (clé produit)
Toggles utilisateur
Documents personnels
Drive / OneDrive
Baux
Propriétés
KPI [MVP]
Comportement
Affichage sources utilisées [MVP]
Score de pertinence [NON-MVP]
Mode strict possible (RAG only) [MVP]

7.3 Capacités avancées
Génération de tableaux [MVP]
Résumé de bail [MVP]
Comparaison de biens [MVP]
Génération d’exports (Excel / PDF) [MVP]
Mode Canvas (documents, tableaux, KPI live) [MVP]

7.4 Intégration backend
Pre-call API métier avant LLM [MVP]
Enrichissement contextuel [MVP]
Choix du RAG par user [MVP]

8️⃣ Non-fonctionnel
Performance (latence < X ms) [MVP]
Scalabilité (multi-org) [MVP]
Observabilité (logs, metrics) [NON-MVP]
Feature flags [NON-MVP]

Frontend surement Vercel sans utilisation serverless, backend railway et db et authentification supabase.