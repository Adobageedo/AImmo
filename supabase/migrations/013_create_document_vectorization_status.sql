-- Migration: Add vectorization tracking to documents table
-- Tracks the status and progress of document vectorization in Qdrant

-- Add vectorization columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vectorization_status TEXT DEFAULT 'not_planned' CHECK (vectorization_status IN ('not_planned', 'planned', 'in_progress', 'vectorized', 'error', 'waiting'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vectorization_started_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vectorization_completed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vectorization_error TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS qdrant_collection_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS num_chunks INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for vectorization status queries
CREATE INDEX IF NOT EXISTS idx_documents_vectorization_status 
ON documents(vectorization_status);

CREATE INDEX IF NOT EXISTS idx_documents_qdrant_collection 
ON documents(qdrant_collection_name);

CREATE INDEX IF NOT EXISTS idx_documents_content_hash 
ON documents(content_hash);

-- Create a table to track vectorization jobs/tasks
CREATE TABLE IF NOT EXISTS vectorization_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    num_chunks_processed INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vectorization jobs
CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_document 
ON vectorization_jobs(document_id);

CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_status 
ON vectorization_jobs(status);

CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_organization 
ON vectorization_jobs(organization_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_vectorization_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vectorization_jobs_updated_at
    BEFORE UPDATE ON vectorization_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_vectorization_jobs_updated_at();

-- Enable RLS
ALTER TABLE vectorization_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vectorization_jobs
CREATE POLICY "Users can view their organization's vectorization jobs"
    ON vectorization_jobs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage vectorization jobs"
    ON vectorization_jobs FOR ALL
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Add comments
COMMENT ON COLUMN documents.vectorization_status IS 'Status of document vectorization: not_planned, planned, in_progress, vectorized, error, waiting';
COMMENT ON COLUMN documents.qdrant_collection_name IS 'Name of the Qdrant collection where document vectors are stored';
COMMENT ON COLUMN documents.num_chunks IS 'Number of chunks the document was split into';
COMMENT ON COLUMN documents.content_hash IS 'SHA-256 hash of document content for change detection';
COMMENT ON TABLE vectorization_jobs IS 'Tracks background vectorization jobs for documents';
