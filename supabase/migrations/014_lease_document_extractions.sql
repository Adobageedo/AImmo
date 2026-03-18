-- =====================================================
-- LEASE DOCUMENT EXTRACTIONS TABLE
-- =====================================================

CREATE TABLE lease_document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES lease_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  entity_matches JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Disable RLS
ALTER TABLE lease_document_extractions DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lease_extractions_document ON lease_document_extractions(document_id);
CREATE INDEX idx_lease_extractions_organization ON lease_document_extractions(organization_id);
CREATE INDEX idx_lease_extractions_status ON lease_document_extractions(status);

-- Trigger for updated_at
CREATE TRIGGER update_lease_extractions_updated_at 
  BEFORE UPDATE ON lease_document_extractions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE lease_document_extractions IS 'AI extraction results from lease documents';
