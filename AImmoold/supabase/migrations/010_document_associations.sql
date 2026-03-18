-- Create document_associations table to link documents with various entities
CREATE TABLE IF NOT EXISTS public.document_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'tenant', 'owner', 'lease')),
    entity_id UUID NOT NULL,
    association_type TEXT DEFAULT 'general',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique associations
    UNIQUE(document_id, entity_type, entity_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_document_associations_document_id ON public.document_associations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_associations_entity ON public.document_associations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_associations_created_by ON public.document_associations(created_by);

-- Enable RLS
ALTER TABLE public.document_associations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view document associations in their organization" ON public.document_associations;
CREATE POLICY "Users can view document associations in their organization"
    ON public.document_associations
    FOR SELECT
    USING (
        document_id IN (
            SELECT id FROM public.documents 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_users 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create document associations in their organization" ON public.document_associations;
CREATE POLICY "Users can create document associations in their organization"
    ON public.document_associations
    FOR INSERT
    WITH CHECK (
        document_id IN (
            SELECT id FROM public.documents 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_users 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update document associations in their organization" ON public.document_associations;
CREATE POLICY "Users can update document associations in their organization"
    ON public.document_associations
    FOR UPDATE
    USING (
        document_id IN (
            SELECT id FROM public.documents 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_users 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete document associations in their organization" ON public.document_associations;
CREATE POLICY "Users can delete document associations in their organization"
    ON public.document_associations
    FOR DELETE
    USING (
        document_id IN (
            SELECT id FROM public.documents 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.organization_users 
                WHERE user_id = auth.uid()
            )
        )
    );
