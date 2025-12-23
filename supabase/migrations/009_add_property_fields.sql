-- Ajouter les champs manquants à la table properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS construction_year INTEGER,
ADD COLUMN IF NOT EXISTS last_renovation_year INTEGER,
ADD COLUMN IF NOT EXISTS energy_class VARCHAR(10),
ADD COLUMN IF NOT EXISTS ges_class VARCHAR(10),
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS current_value DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS monthly_charges DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS property_tax DECIMAL(10, 2);

-- Ajouter une référence au document source pour properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Ajouter une référence au document source pour tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Ajouter une référence au document source pour leases
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Créer des index pour les recherches
CREATE INDEX IF NOT EXISTS idx_properties_source_document ON properties(source_document_id);
CREATE INDEX IF NOT EXISTS idx_tenants_source_document ON tenants(source_document_id);
CREATE INDEX IF NOT EXISTS idx_leases_source_document ON leases(source_document_id);
