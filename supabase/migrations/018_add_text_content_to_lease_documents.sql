-- Ajouter la colonne text_content à la table lease_documents
-- Cette colonne stockera le texte extrait lors du parsing des documents de bail

ALTER TABLE lease_documents 
ADD COLUMN text_content TEXT;

-- Ajouter un commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN lease_documents.text_content IS 'Texte extrait du document lors du parsing (OCR/extraction de texte)';
