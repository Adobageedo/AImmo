-- =====================================================
-- ORGANIZATION USERS TABLE
-- =====================================================

CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Disable RLS
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;
