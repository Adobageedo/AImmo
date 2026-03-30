-- =====================================================
-- ADD STORAGE PATHS TO LEASE DOCUMENTS
-- =====================================================
-- Adds columns to track file storage in Supabase Storage bucket
-- and links lease_documents to leases

-- Storage path for original file in Supabase Storage bucket
ALTER TABLE lease_documents
ADD COLUMN storage_path TEXT;

-- Storage path for the full raw extracted text in Supabase Storage bucket
ALTER TABLE lease_documents
ADD COLUMN raw_text_path TEXT;

-- Extraction status tracking (mirrors extraction table but useful for quick queries)
ALTER TABLE lease_documents
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending' 
  CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review'));

-- Updated at timestamp
ALTER TABLE lease_documents
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Link to the lease created from this document
ALTER TABLE lease_documents
ADD COLUMN lease_id UUID REFERENCES leases(id) ON DELETE SET NULL;

-- Index for lease lookup
CREATE INDEX IF NOT EXISTS idx_lease_documents_lease ON lease_documents(lease_id);

-- Comments
COMMENT ON COLUMN lease_documents.storage_path IS 'Path in Supabase Storage bucket: {org_id}/lease-originals/{doc_id}/{filename}';
COMMENT ON COLUMN lease_documents.raw_text_path IS 'Path in Supabase Storage bucket: {org_id}/lease-texts/{doc_id}/raw.txt';
COMMENT ON COLUMN lease_documents.lease_id IS 'Reference to the lease created from this document';

-- =====================================================
-- CREATE SUPABASE STORAGE BUCKET (run manually in dashboard or via SQL)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;
