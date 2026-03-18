-- =====================================================
-- TENANTS TABLE
-- =====================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  payment_status TEXT NOT NULL DEFAULT 'ok' CHECK (payment_status IN ('ok', 'late', 'unpaid')),
  employment JSONB,
  "references" JSONB DEFAULT '[]'::jsonb,
  guarantors JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- Disable RLS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_tenants_organization ON tenants(organization_id);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_payment_status ON tenants(payment_status);

-- Trigger for updated_at
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE tenants IS 'Tenants renting properties';
