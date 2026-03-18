# Architecture AImmo - Plan de Développement

## 📋 Analyse des Besoins

### Entités Métier Principales
- **Users & Organizations** : Gestion multi-organisations avec rôles
- **Properties** : Biens immobiliers avec calculs de rendement
- **Tenants** : Locataires avec historique et statuts
- **Leases** : Baux avec dates, montants, clauses
- **Documents** : Stockage avec OCR et parsing
- **Alerts** : Notifications automatiques
- **Dashboard** : KPIs et graphiques

### Fonctionnalités Clés
- Authentification Supabase
- Upload/Stockage documents
- OCR + Parsing baux
- Dashboard analytique
- Système d'alertes
- Newsletter

## 🏗️ Architecture Technique

### Stack
- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Backend** : FastAPI (Python) ou NestJS (Node.js)
- **BDD** : Supabase (PostgreSQL)
- **Storage** : Supabase Storage
- **Auth** : Supabase Auth
- **UI** : TailwindCSS + Shadcn/ui
- **State** : React Context + Hooks personnalisés

### Pattern Architectural
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│                 │    │                 │    │                 │
│ Pages/Components│◄──►│   API Routes    │◄──►│   Database      │
│ Hooks/Context   │    │   Services      │    │   Storage       │
│ Utils/Types     │    │   Business Logic│    │   Auth          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Structure des Dossiers

```
aimmo/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Routes authentifiées
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── documents/
│   │   ├── tenants/
│   │   ├── leases/
│   │   └── alerts/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── properties/
│   │   └── ...
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── forms/                    # Form components
│   │   ├── property-form.tsx
│   │   ├── tenant-form.tsx
│   │   └── lease-form.tsx
│   ├── tables/                   # Table components
│   │   ├── properties-table.tsx
│   │   ├── tenants-table.tsx
│   │   └── leases-table.tsx
│   ├── charts/                   # Chart components
│   │   ├── kpi-card.tsx
│   │   ├── revenue-chart.tsx
│   │   └── occupancy-chart.tsx
│   └── common/                   # Reusable components
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── empty-state.tsx
├── lib/
│   ├── auth.ts                   # Supabase auth
│   ├── database.ts               # Supabase client
│   ├── storage.ts                # Supabase storage
│   ├── validations/              # Zod schemas
│   │   ├── auth.ts
│   │   ├── property.ts
│   │   └── ...
│   ├── utils/
│   │   ├── calculations.ts       # Calculs financiers
│   │   ├── formatters.ts         # Formatage données
│   │   ├── date.ts              # Utilitaires dates
│   │   └── file.ts              # Utilitaires fichiers
│   └── constants/
│       ├── routes.ts
│       ├── permissions.ts
│       └── defaults.ts
├── hooks/
│   ├── useAuth.ts                # Authentification
│   ├── useOrganization.ts        # Organisation courante
│   ├── useProperties.ts          # CRUD propriétés
│   ├── useTenants.ts             # CRUD locataires
│   ├── useLeases.ts              # CRUD baux
│   ├── useDocuments.ts           # CRUD documents
│   ├── useDashboard.ts           # Dashboard KPIs
│   ├── useAlerts.ts              # Alertes
│   └── useFileUpload.ts          # Upload fichiers
├── services/
│   ├── api.ts                    # Client API base
│   ├── auth.service.ts           # Service auth
│   ├── property.service.ts       # Service propriétés
│   ├── tenant.service.ts         # Service locataires
│   ├── lease.service.ts          # Service baux
│   ├── document.service.ts        # Service documents
│   ├── alert.service.ts          # Service alertes
│   ├── parsing.service.ts        # Service OCR/parsing
│   └── notification.service.ts   # Service notifications
├── types/
│   ├── auth.ts                   # Types auth
│   ├── organization.ts           # Types organisation
│   ├── property.ts               # Types propriété
│   ├── tenant.ts                 # Types locataire
│   ├── lease.ts                  # Types bail
│   ├── document.ts               # Types document
│   ├── alert.ts                  # Types alerte
│   ├── dashboard.ts              # Types dashboard
│   └── common.ts                 # Types communs
├── context/
│   ├── AuthContext.tsx           # Contexte auth
│   ├── OrganizationContext.tsx    # Contexte organisation
│   └── ThemeContext.tsx          # Contexte thème
└── styles/
    ├── globals.css
    └── components/
        ├── navbar.css
        ├── sidebar.css
        └── dashboard.css
```

## 🔧 Types et Interfaces Communs

### Types de Base
```typescript
// types/common.ts
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Types Métier
```typescript
// types/property.ts
export interface Property extends BaseEntity {
  name: string;
  address: string;
  type: PropertyType;
  surface: number;
  estimated_value: number;
  purchase_price?: number;
  purchase_date?: string;
  status: PropertyStatus;
}

// types/lease.ts
export interface Lease extends BaseEntity {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  charges: number;
  indexation_clause?: boolean;
  indexation_rate?: number;
  status: LeaseStatus;
}
```

## 🪝 Hooks Réutilisables

### Hook de CRUD Générique
```typescript
// hooks/useCrud.ts
export function useCrud<T extends BaseEntity>(
  resource: string,
  service: CrudService<T>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (params?: PaginationParams) => {
    // Implémentation générique
  }, [service]);

  const create = useCallback(async (item: Omit<T, keyof BaseEntity>) => {
    // Implémentation générique
  }, [service]);

  // ... autres méthodes CRUD

  return { data, loading, error, fetchAll, create, update, delete };
}
```

### Hooks Spécifiques
```typescript
// hooks/useProperties.ts
export function useProperties() {
  return useCrud<Property>('properties', propertyService);
}

// hooks/useDashboard.ts
export function useDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchKPIs = useCallback(async (filters?: DashboardFilters) => {
    // Calculs KPIs
  }, []);

  return { kpis, loading, fetchKPIs };
}
```

## 🛠️ Services et Utilitaires

### Service API Base
```typescript
// services/api.ts
export class ApiService {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Implémentation générique avec gestion erreurs
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // ... autres méthodes HTTP
}
```

### Service Métier
```typescript
// services/property.service.ts
export class PropertyService extends ApiService {
  async getProperties(
    organizationId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Property>>> {
    return this.get<PaginatedResponse<Property>>(
      `/organizations/${organizationId}/properties`
    );
  }

  async calculateYield(propertyId: string): Promise<ApiResponse<YieldData>> {
    return this.get<YieldData>(`/properties/${propertyId}/yield`);
  }
}
```

### Utilitaires de Calcul
```typescript
// lib/utils/calculations.ts
export const calculateGrossYield = (
  annualRent: number,
  propertyValue: number
): number => (annualRent / propertyValue) * 100;

export const calculateNetYield = (
  annualRent: number,
  propertyValue: number,
  annualCharges: number
): number => ((annualRent - annualCharges) / propertyValue) * 100;

export const calculateOccupancyRate = (
  occupiedProperties: number,
  totalProperties: number
): number => (occupiedProperties / totalProperties) * 100;
```

## 📅 Plan de Développement par Phase

### Phase 0: Setup & Fondations (Semaine 0-1)
**Objectifs**: Infrastructure de base sans dette technique

**Tâches**:
1. **Setup Projet**
   - Initialiser Next.js 14 avec TypeScript
   - Configurer TailwindCSS + Shadcn/ui
   - Setup Supabase client et auth
   - Configurer ESLint, Prettier, Husky

2. **Structure de Base**
   - Créer arborescence des dossiers
   - Setup routing de base
   - Créer composants layout (Navbar, Sidebar)
   - Configurer environnement (dev/prod)

3. **Types et Utils**
   - Définir types de base (BaseEntity, Pagination)
   - Créer service API générique
   - Setup hooks CRUD génériques
   - Configurer validations Zod

**Livrables**: Structure projet fonctionnelle, environnement configuré

### Phase 1: Auth & Organisations (Semaine 1-2)
**Objectifs**: Système d'authentification et gestion multi-organisations

**Tâches**:
1. **Authentification Supabase**
   - Signup/Login/Logout
   - Reset password
   - Vérification email
   - Middleware de protection routes

2. **Gestion Organisations**
   - CRUD organisations
   - Switch d'organisation
   - Rôles et permissions
   - Contexte React pour org courante

3. **UI Auth**
   - Pages login/signup
   - Sélecteur d'organisation
   - Layout authentifié

**Livrables**: Système auth complet, gestion multi-org fonctionnelle

### Phase 2: Documents & Storage (Semaine 2-3)
**Objectifs**: Système de stockage et gestion documentaire

**Tâches**:
1. **Storage Supabase**
   - Upload/Download fichiers
   - Gestion quotas par organisation
   - Arborescence de dossiers
   - Suppression/overwrite

2. **Gestion Documentaire**
   - CRUD documents avec métadonnées
   - Explorateur de fichiers
   - Tags et catégories
   - Lien vers entités métier

3. **UI Documents**
   - Composant upload drag-and-drop
   - Explorateur avec arborescence
   - Modal détails document
   - Filtres et recherche

**Livrables**: Stockage documents fonctionnel, interface complète

### Phase 3: OCR & Parsing Baux (Semaine 3-5)
**Objectifs**: Extraction automatisée des données des baux

**Tâches**:
1. **Pipeline OCR**
   - Détection PDF scanné
   - Intégration Tesseract
   - Extraction texte brut
   - Détection langue

2. **Parsing Structuré**
   - Extraction parties, dates, montants
   - Validation utilisateur
   - Création automatique entités
   - Gestion erreurs parsing

3. **UI Parsing**
   - Interface upload → OCR → parsing
   - Modal validation extraction
   - Mapping champs automatique
   - Historique parsing

**Livrables**: Pipeline OCR/parsing fonctionnel, création automatique baux

### Phase 4: Propriétés/Locataires/Baux UI (Semaine 5-6)
**Objectifs**: Interface complète pour les entités métier

**Tâches**:
1. **CRUD Entités**
   - Forms propriétés/locataires/baux
   - Tables avec pagination/filtres
   - Pages détail
   - Liens entre entités

2. **Calculs Métier**
   - Rendement par bien
   - Statuts paiements
   - Historique modifications
   - Alertes échéances

3. **UI Unifiée**
   - Design system cohérent
   - Composants réutilisables
   - Navigation fluide
   - Mode édition/consultation

**Livrables**: Interface métier complète, fonctionnalités CRUD

### Phase 5: Dashboard Portefeuille (Semaine 6-8)
**Objectifs**: Vue analytique et KPIs

**Tâches**:
1. **Backend KPIs**
   - Calculs agrégés
   - Performance portefeuille
   - Taux occupation/vacance
   - Agrégations par période

2. **Frontend Dashboard**
   - Cards KPIs
   - Graphiques (Chart.js/Recharts)
   - Filtres globaux
   - Export données

3. **UX Avancée**
   - Widgets modulables
   - Sauvegarde vues
   - Mode présentation
   - Responsive design

**Livrables**: Dashboard analytique complet, exports disponibles

### Phase 6: Alertes & Newsletter (Semaine 8-9)
**Objectifs**: Système de notifications et rétention

**Tâches**:
1. **Système Alertes**
   - Détection automatique événements
   - Centre d'alertes
   - Notifications in-app
   - Configuration alertes

2. **Newsletter**
   - Système abonnement
   - Templates newsletters
   - Historique envois
   - Stats ouverture

3. **UI Notifications**
   - Centre alertes intuitif
   - Badge notifications
   - Préférences utilisateur
   - Interface newsletter

**Livrables**: Système alertes fonctionnel, newsletter opérationnelle

### Phase 7: Stabilisation & Performance (Semaine 9-12)
**Objectifs**: Production ready

**Tâches**:
1. **Performance**
   - Optimisation chargement
   - Cache stratégique
   - Lazy loading
   - Bundle optimization

2. **Sécurité**
   - Audit sécurité
   - Validation inputs
   - Permissions renforcées
   - Logs et monitoring

3. **Qualité**
   - Tests unitaires/intégration
   - Documentation
   - Seed data démo
   - UX polish

**Livrables**: Application production ready, documentation complète

## 🔄 Optimisations & Bonnes Pratiques

### Réduction Redondance
- **Hooks génériques** pour éviter duplication CRUD
- **Composants réutilisables** avec props configurables
- **Services partagés** pour logique métier commune
- **Types centralisés** pour cohérence données

### Performance
- **React.memo** pour composants coûteux
- **useMemo/useCallback** pour calculs et fonctions
- **Code splitting** par route
- **Images optimisées** et lazy loading

### Maintenabilité
- **Convention命名** cohérente
- **Documentation** inline et externe
- **Tests** pour logique critique
- **Error boundaries** pour robustesse

### Scalabilité
- **Architecture modulaire** pour évolutions futures
- **API versionnée** pour compatibilité
- **Database indexes** optimisés
- **Monitoring** proactif

Cette architecture permet un développement rapide avec une base solide, évolutive et maintenable, tout en minimisant la redondance et en maximisant la réutilisabilité.
