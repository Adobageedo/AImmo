-- =====================================================
-- LEASE DOCUMENTS TABLE (for AI extraction)
-- =====================================================

CREATE TABLE lease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'word', 'image')),
  file_size BIGINT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE lease_documents DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lease_documents_organization ON lease_documents(organization_id);

-- Comment
COMMENT ON TABLE lease_documents IS 'Uploaded lease documents for AI extraction';
