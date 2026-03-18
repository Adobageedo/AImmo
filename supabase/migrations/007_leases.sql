-- =====================================================
-- LEASES TABLE
-- =====================================================

CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  tenant_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  lease_type TEXT NOT NULL CHECK (lease_type IN ('residential', 'commercial', 'furnished', 'unfurnished', 'seasonal')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  charges NUMERIC NOT NULL DEFAULT 0,
  deposit NUMERIC NOT NULL DEFAULT 0,
  payment_day INTEGER NOT NULL DEFAULT 1 CHECK (payment_day >= 1 AND payment_day <= 31),
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly')),
  indexation_clause BOOLEAN NOT NULL DEFAULT false,
  indexation_rate NUMERIC,
  indexation_index TEXT CHECK (indexation_index IN ('irl', 'icc', 'custom')),
  indexation_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'expiring_soon', 'expired', 'terminated', 'disputed')),
  termination_notice_period INTEGER,
  renewal_automatic BOOLEAN DEFAULT false,
  renewal_conditions TEXT,
  special_clauses TEXT[] DEFAULT ARRAY[]::TEXT[],
  document_id UUID,
  signed_at TIMESTAMPTZ,
  notes TEXT
);

-- Disable RLS
ALTER TABLE leases DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_leases_organization ON leases(organization_id);
CREATE INDEX idx_leases_property ON leases(property_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_start_date ON leases(start_date);
CREATE INDEX idx_leases_end_date ON leases(end_date);

-- Trigger for updated_at
CREATE TRIGGER update_leases_updated_at 
  BEFORE UPDATE ON leases 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE leases IS 'Lease contracts between owners and tenants';
