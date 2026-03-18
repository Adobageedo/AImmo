-- =====================================================
-- NEWSLETTERS TABLE
-- =====================================================

CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'taxation', 'regulation', 'market_trends')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Disable RLS
ALTER TABLE newsletters DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_newsletters_organization ON newsletters(organization_id);
CREATE INDEX idx_newsletters_active ON newsletters(active);

-- Trigger for updated_at
CREATE TRIGGER update_newsletters_updated_at 
  BEFORE UPDATE ON newsletters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE newsletters IS 'Newsletter configurations';
