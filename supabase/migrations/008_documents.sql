-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lease', 'invoice', 'payment_notice', 'diagnostic', 'financial_report', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  folder_path TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  linked_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  linked_lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  linked_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  ocr_text TEXT,
  extracted_data JSONB,
  indexed_at TIMESTAMPTZ
);

-- Disable RLS
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_linked_property ON documents(linked_property_id);
CREATE INDEX idx_documents_linked_lease ON documents(linked_lease_id);
CREATE INDEX idx_documents_linked_tenant ON documents(linked_tenant_id);

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE documents IS 'Documents related to properties, leases, and tenants';
