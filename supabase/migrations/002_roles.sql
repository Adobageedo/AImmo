-- =====================================================
-- ROLES TABLE
-- =====================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (name IN ('admin', 'user', 'viewer')),
  description TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Administrator with full access', ARRAY[
    'documents.read', 'documents.write', 'documents.delete',
    'properties.read', 'properties.write', 'properties.delete',
    'tenants.read', 'tenants.write', 'tenants.delete',
    'leases.read', 'leases.write', 'leases.delete',
    'dashboard.read', 'alerts.read', 'alerts.manage',
    'organization.manage'
  ]),
  ('user', 'Regular user with read/write access', ARRAY[
    'documents.read', 'documents.write',
    'properties.read', 'properties.write',
    'tenants.read', 'tenants.write',
    'leases.read', 'leases.write',
    'dashboard.read', 'alerts.read'
  ]),
  ('viewer', 'Read-only access', ARRAY[
    'documents.read', 'properties.read', 'tenants.read',
    'leases.read', 'dashboard.read', 'alerts.read'
  ]);

-- Trigger for updated_at
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
