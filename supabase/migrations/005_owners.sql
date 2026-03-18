-- =====================================================
-- OWNERS TABLE
-- =====================================================

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'France',
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'mail')),
  preferred_language TEXT CHECK (preferred_language IN ('fr', 'en')) DEFAULT 'fr',
  notes TEXT
);

-- Disable RLS
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_owners_organization ON owners(organization_id);
CREATE INDEX idx_owners_email ON owners(email);

-- Trigger for updated_at
CREATE TRIGGER update_owners_updated_at 
  BEFORE UPDATE ON owners 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE owners IS 'Property owners';
