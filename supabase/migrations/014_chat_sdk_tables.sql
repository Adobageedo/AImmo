-- CHAT SDK TABLES - Supabase Schema
-- Tables nécessaires pour le SDK Chat UI
-- ============================================

-- Table: artifacts (artefacts Canvas)
CREATE TABLE IF NOT EXISTS public.artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('table', 'chart', 'document', 'code')),
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON public.artifacts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON public.artifacts(message_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON public.artifacts(created_at DESC);

-- Row Level Security pour artifacts
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own artifacts"
    ON public.artifacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts"
    ON public.artifacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts"
    ON public.artifacts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts"
    ON public.artifacts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Mise à jour de la table messages
-- ============================================

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
    -- Citations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'citations'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN citations JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Artifacts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'artifacts'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN artifacts JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- Mise à jour de la table conversations
-- ============================================

DO $$
BEGIN
    -- Last message at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Updated_at (si n'existe pas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Index pour last_message_at
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- ============================================
-- Mise à jour de la table documents
-- ============================================

DO $$
BEGIN
    -- is_indexed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'is_indexed'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN is_indexed BOOLEAN DEFAULT FALSE;
    END IF;

    -- indexed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'indexed_at'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN indexed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- chunks_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'chunks_count'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN chunks_count INTEGER DEFAULT 0;
    END IF;

    -- extracted_text (si n'existe pas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'extracted_text'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN extracted_text TEXT;
    END IF;
END $$;

-- Indexes pour documents
CREATE INDEX IF NOT EXISTS idx_documents_is_indexed ON public.documents(is_indexed);
CREATE INDEX IF NOT EXISTS idx_documents_indexed_at ON public.documents(indexed_at DESC);

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artifacts_updated_at ON public.artifacts;
CREATE TRIGGER update_artifacts_updated_at
    BEFORE UPDATE ON public.artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Vues utiles
-- ============================================

-- Vue: conversations avec statistiques
CREATE OR REPLACE VIEW public.conversations_with_stats AS
SELECT 
    c.*,
    COUNT(m.id) as messages_count,
    MAX(m.created_at) as last_message_at_calc
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id
GROUP BY c.id;

-- Vue: artifacts avec informations de conversation
CREATE OR REPLACE VIEW public.artifacts_with_conversation AS
SELECT 
    a.*,
    c.title as conversation_title,
    c.organization_id
FROM public.artifacts a
JOIN public.conversations c ON c.id = a.conversation_id;

-- ============================================
-- Permissions additionnelles
-- ============================================

-- Permettre aux utilisateurs authentifiés de voir leurs conversations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artifacts TO authenticated;

-- Permissions sur les vues
GRANT SELECT ON public.conversations_with_stats TO authenticated;
GRANT SELECT ON public.artifacts_with_conversation TO authenticated;

-- ============================================
-- Commentaires pour documentation
-- ============================================

COMMENT ON TABLE public.artifacts IS 'Artefacts générés par le chat (tables, charts, documents)';
COMMENT ON COLUMN public.artifacts.type IS 'Type d''artefact: table, chart, document, code';
COMMENT ON COLUMN public.artifacts.content IS 'Contenu de l''artefact (structure JSON)';
COMMENT ON COLUMN public.artifacts.metadata IS 'Métadonnées additionnelles';

COMMENT ON COLUMN public.messages.citations IS 'Citations/sources RAG associées au message';
COMMENT ON COLUMN public.messages.artifacts IS 'Artefacts générés dans le message';

COMMENT ON COLUMN public.documents.is_indexed IS 'Document indexé dans Qdrant';
COMMENT ON COLUMN public.documents.indexed_at IS 'Date d''indexation dans Qdrant';
COMMENT ON COLUMN public.documents.chunks_count IS 'Nombre de chunks dans Qdrant';
