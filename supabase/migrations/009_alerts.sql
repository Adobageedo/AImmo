-- =====================================================
-- ALERTS TABLE
-- =====================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_overdue', 'lease_renewal', 'lease_ending', 'indexation_due', 'diagnostic_expiring', 'maintenance_required')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'resolved')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT CHECK (related_entity_type IN ('property', 'lease', 'tenant')),
  related_entity_id UUID,
  action_url TEXT,
  due_date DATE,
  resolved_at TIMESTAMPTZ
);

-- Disable RLS
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_type ON alerts(type);

-- Trigger for updated_at
CREATE TRIGGER update_alerts_updated_at 
  BEFORE UPDATE ON alerts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE alerts IS 'System alerts and notifications';
