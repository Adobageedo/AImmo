-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{"storage_quota_mb": 1000, "max_users": 10, "features_enabled": []}'::jsonb
);

-- Disable RLS
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE organizations IS 'Organizations/companies using the platform';
