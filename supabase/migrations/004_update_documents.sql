-- Ajouter les colonnes manquantes à la table documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'autre',
ADD COLUMN IF NOT EXISTS folder_path VARCHAR(500) DEFAULT '/';

-- Mettre à jour les contraintes
ALTER TABLE documents 
ALTER COLUMN file_type TYPE VARCHAR(10);

-- Créer un index sur folder_path pour les recherches
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON documents(folder_path);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Ajouter une contrainte de vérification pour document_type
ALTER TABLE documents 
ADD CONSTRAINT check_document_type 
CHECK (document_type IN ('bail', 'facture', 'avis_echeance', 'diagnostic', 'rapport_financier', 'autre'));
