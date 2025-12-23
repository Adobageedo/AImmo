-- Table pour stocker les résultats de traitement OCR/Parsing
CREATE TABLE IF NOT EXISTS document_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ocr_result JSONB,
    parsed_lease JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES auth.users(id),
    UNIQUE(document_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_processing_document ON document_processing(document_id);
CREATE INDEX idx_processing_status ON document_processing(status);

-- Trigger updated_at
CREATE TRIGGER update_processing_updated_at
    BEFORE UPDATE ON document_processing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE document_processing ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les traitements de leurs organisations
CREATE POLICY "Users can view their organization processings"
ON document_processing FOR SELECT
TO authenticated
USING (
    document_id IN (
        SELECT d.id FROM documents d
        INNER JOIN organization_users ou ON d.organization_id = ou.organization_id
        WHERE ou.user_id = auth.uid()
    )
);

-- Policy: Les utilisateurs peuvent créer des traitements pour leurs organisations
CREATE POLICY "Users can create processings for their organizations"
ON document_processing FOR INSERT
TO authenticated
WITH CHECK (
    document_id IN (
        SELECT d.id FROM documents d
        INNER JOIN organization_users ou ON d.organization_id = ou.organization_id
        WHERE ou.user_id = auth.uid()
    )
);

-- Policy: Les utilisateurs peuvent mettre à jour les traitements de leurs organisations
CREATE POLICY "Users can update their organization processings"
ON document_processing FOR UPDATE
TO authenticated
USING (
    document_id IN (
        SELECT d.id FROM documents d
        INNER JOIN organization_users ou ON d.organization_id = ou.organization_id
        WHERE ou.user_id = auth.uid()
    )
);
