# AImmo - Plateforme de Gestion Immobilière

Application web complète de gestion de portefeuille immobilier avec Next.js 14, TypeScript, Supabase et TailwindCSS.

## 🎯 Fonctionnalités

### ✅ Modules Implémentés

- **Dashboard** : Vue d'ensemble avec KPIs financiers et opérationnels
- **Propriétés** : Gestion complète des biens immobiliers
- **Locataires** : Suivi des locataires et statuts de paiement
- **Baux** : Gestion des contrats de location
- **Documents** : Stockage et organisation des documents
- **Alertes** : Centre de notifications pour événements importants
- **Multi-organisations** : Support de plusieurs organisations par utilisateur

### 🔧 Stack Technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + TailwindCSS
- **UI Components** : Shadcn/ui + Radix UI
- **Backend** : Next.js API Routes (mock data pour développement)
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Storage** : Supabase Storage
- **Charts** : Recharts
- **Validation** : Zod
- **Date utilities** : date-fns

## 📦 Installation

### Prérequis

- Node.js 18+ 
- npm ou pnpm

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone <repo-url>
cd AImmo
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**

Créer un fichier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# OpenAI (optionnel, pour assistant)
OPENAI_API_KEY=sk-...
```

4. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
AImmo/
├── app/
│   ├── (dashboard)/          # Routes du dashboard
│   │   ├── dashboard/        # Page dashboard principal
│   │   ├── properties/       # Gestion propriétés
│   │   ├── tenants/          # Gestion locataires
│   │   ├── leases/           # Gestion baux
│   │   ├── documents/        # Gestion documents
│   │   ├── alerts/           # Centre d'alertes
│   │   └── layout.tsx        # Layout authentifié
│   └── api/                  # API Routes
│       └── organizations/    # Endpoints organisations
├── components/
│   ├── ui/                   # Composants UI Shadcn
│   ├── common/               # Composants réutilisables
│   ├── layout/               # Layout components (Navbar)
│   └── charts/               # Composants graphiques
├── context/
│   ├── AuthContext.tsx       # Contexte authentification
│   └── OrganizationContext.tsx # Contexte organisation
├── hooks/
│   ├── use-auth.ts           # Hook authentification
│   ├── use-organization.ts   # Hook organisation
│   ├── use-properties.ts     # Hook propriétés
│   ├── use-tenants.ts        # Hook locataires
│   ├── use-leases.ts         # Hook baux
│   ├── use-dashboard.ts      # Hook dashboard
│   └── use-alerts.ts         # Hook alertes
├── lib/
│   ├── supabase/             # Clients Supabase
│   ├── utils/                # Utilitaires (calculs, dates, fichiers)
│   ├── validations/          # Schémas Zod
│   └── constants.ts          # Constantes globales
├── services/
│   ├── api-client.ts         # Client HTTP générique
│   ├── property.service.ts   # Service propriétés
│   ├── tenant.service.ts     # Service locataires
│   ├── lease.service.ts      # Service baux
│   ├── document.service.ts   # Service documents
│   ├── dashboard.service.ts  # Service dashboard
│   └── alert.service.ts      # Service alertes
└── types/
    ├── common.ts             # Types communs
    ├── auth.ts               # Types authentification
    ├── organization.ts       # Types organisation
    ├── property.ts           # Types propriété
    ├── tenant.ts             # Types locataire
    ├── lease.ts              # Types bail
    ├── document.ts           # Types document
    ├── alert.ts              # Types alerte
    └── dashboard.ts          # Types dashboard
```

## 🔑 Configuration Supabase

### 1. Créer un projet Supabase

Allez sur [supabase.com](https://supabase.com) et créez un nouveau projet.

### 2. Schéma de base de données

Exécutez les migrations SQL suivantes dans l'éditeur SQL Supabase :

```sql
-- Users (géré par Supabase Auth)

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Users
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('residential', 'commercial', 'industrial', 'mixed')),
  surface DECIMAL NOT NULL,
  rooms INTEGER,
  bathrooms INTEGER,
  estimated_value DECIMAL NOT NULL,
  purchase_price DECIMAL,
  purchase_date DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'sold')),
  description TEXT,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  payment_status TEXT NOT NULL DEFAULT 'ok' CHECK (payment_status IN ('ok', 'late', 'unpaid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leases
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL NOT NULL,
  charges DECIMAL NOT NULL DEFAULT 0,
  deposit DECIMAL NOT NULL DEFAULT 0,
  indexation_clause BOOLEAN DEFAULT FALSE,
  indexation_rate DECIMAL,
  indexation_date DATE,
  payment_day INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  termination_notice_period INTEGER,
  renewal_conditions TEXT,
  special_clauses TEXT[],
  document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lease', 'invoice', 'payment_notice', 'diagnostic', 'financial_report', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  folder_path TEXT,
  tags TEXT[],
  description TEXT,
  linked_property_id UUID REFERENCES properties(id),
  linked_lease_id UUID REFERENCES leases(id),
  linked_tenant_id UUID REFERENCES tenants(id),
  ocr_text TEXT,
  extracted_data JSONB,
  indexed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_overdue', 'lease_renewal', 'lease_ending', 'indexation_due', 'diagnostic_expiring', 'maintenance_required')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'resolved')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT CHECK (related_entity_type IN ('property', 'lease', 'tenant')),
  related_entity_id UUID,
  action_url TEXT,
  due_date DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_tenants_organization ON tenants(organization_id);
CREATE INDEX idx_leases_organization ON leases(organization_id);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_status ON alerts(status);
```

### 3. Row Level Security (RLS)

Activez RLS sur toutes les tables et créez les policies appropriées.

## 🚀 Déploiement

### Vercel (Recommandé pour le frontend)

```bash
vercel deploy
```

### Variables d'environnement en production

Configurez les mêmes variables que `.env.local` dans votre plateforme de déploiement.

## 📝 Développement

### Commandes disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linter (Biome)
npm run lint:fix     # Fix automatique du linter
npm run format       # Formatage du code
npm run format:fix   # Fix automatique du formatage
```

## 🎨 Personnalisation

### Thèmes

Les couleurs et le thème sont configurables via TailwindCSS dans `tailwind.config.ts`.

### Ajout de nouvelles fonctionnalités

1. Créer les types dans `/types`
2. Créer le service dans `/services`
3. Créer le hook dans `/hooks`
4. Créer les composants dans `/components`
5. Créer la page dans `/app/(dashboard)`
6. Créer les routes API dans `/app/api`

## 📚 Documentation Technique

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)

## 🔒 Sécurité

- Authentification via Supabase Auth
- Row Level Security (RLS) sur toutes les tables
- Isolation des données par organisation
- Validation des inputs avec Zod
- Protection CSRF native de Next.js

## 🤝 Contribution

Les contributions sont les bienvenues ! Suivez ces étapes :

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.
