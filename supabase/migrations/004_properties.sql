-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'France',
  type TEXT NOT NULL CHECK (type IN ('residential', 'commercial', 'industrial', 'mixed')),
  surface NUMERIC NOT NULL,
  rooms INTEGER,
  bathrooms INTEGER,
  estimated_value NUMERIC NOT NULL,
  purchase_price NUMERIC,
  purchase_date DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'sold')),
  description TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  coordinates JSONB
);

-- Disable RLS
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);

-- Trigger for updated_at
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE properties IS 'Real estate properties managed by organizations';
