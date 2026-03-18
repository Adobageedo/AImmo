-- =====================================================
-- LEASE RELATIONSHIPS TABLE
-- =====================================================
-- Table de jonction simplifiée pour les relations de baux
-- Remplace les arrays owner_ids[] et tenant_ids[] dans la table leases

CREATE TABLE lease_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Organisation
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Le bail concerné
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  
  -- L'entité liée (owner, tenant, ou property)
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('owner', 'tenant', 'property')),
  entity_id UUID NOT NULL,
  
  -- Métadonnées spécifiques
  metadata JSONB DEFAULT '{}',
  -- Exemples:
  -- Pour owner: {percentage: 50, is_main_owner: true}
  -- Pour tenant: {is_main_tenant: true, occupancy_start: '2024-01-01'}
  -- Pour property: {rooms_rented: [1, 2], floor: 2}
  
  -- Statut
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  terminated_at TIMESTAMPTZ,
  terminated_by UUID REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT unique_lease_entity UNIQUE(lease_id, entity_type, entity_id, status)
);

-- Index pour performance
CREATE INDEX idx_lease_relationships_lease ON lease_relationships(lease_id) WHERE status = 'active';
CREATE INDEX idx_lease_relationships_entity ON lease_relationships(entity_type, entity_id) WHERE status = 'active';
CREATE INDEX idx_lease_relationships_org ON lease_relationships(organization_id);
CREATE INDEX idx_lease_relationships_status ON lease_relationships(status);

-- Trigger pour updated_at
CREATE TRIGGER update_lease_relationships_updated_at
  BEFORE UPDATE ON lease_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction de validation de l'entité référencée
CREATE OR REPLACE FUNCTION validate_entity_reference()
RETURNS TRIGGER AS $$
DECLARE
  entity_exists BOOLEAN;
BEGIN
  -- Vérifier que l'entité existe selon son type
  IF NEW.entity_type = 'owner' THEN
    SELECT EXISTS(SELECT 1 FROM owners WHERE id = NEW.entity_id) INTO entity_exists;
    IF NOT entity_exists THEN
      RAISE EXCEPTION 'Owner with id % does not exist', NEW.entity_id;
    END IF;
  ELSIF NEW.entity_type = 'tenant' THEN
    SELECT EXISTS(SELECT 1 FROM tenants WHERE id = NEW.entity_id) INTO entity_exists;
    IF NOT entity_exists THEN
      RAISE EXCEPTION 'Tenant with id % does not exist', NEW.entity_id;
    END IF;
  ELSIF NEW.entity_type = 'property' THEN
    SELECT EXISTS(SELECT 1 FROM properties WHERE id = NEW.entity_id) INTO entity_exists;
    IF NOT entity_exists THEN
      RAISE EXCEPTION 'Property with id % does not exist', NEW.entity_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider l'entité avant insertion/update
CREATE TRIGGER validate_entity_reference_trigger
  BEFORE INSERT OR UPDATE ON lease_relationships
  FOR EACH ROW
  EXECUTE FUNCTION validate_entity_reference();

-- RLS Policies
ALTER TABLE lease_relationships DISABLE ROW LEVEL SECURITY;
-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Fonction pour obtenir tous les owners d'un bail
CREATE OR REPLACE FUNCTION get_lease_owners(p_lease_id UUID)
RETURNS TABLE (
  owner_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  percentage NUMERIC,
  is_main_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.first_name,
    o.last_name,
    o.email,
    (lr.metadata->>'percentage')::NUMERIC,
    COALESCE((lr.metadata->>'is_main_owner')::BOOLEAN, false)
  FROM lease_relationships lr
  JOIN owners o ON o.id = lr.entity_id
  WHERE lr.lease_id = p_lease_id
    AND lr.entity_type = 'owner'
    AND lr.status = 'active'
  ORDER BY COALESCE((lr.metadata->>'is_main_owner')::BOOLEAN, false) DESC,
           (lr.metadata->>'percentage')::NUMERIC DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir tous les tenants d'un bail
CREATE OR REPLACE FUNCTION get_lease_tenants(p_lease_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  is_main_tenant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    t.email,
    COALESCE((lr.metadata->>'is_main_tenant')::BOOLEAN, false)
  FROM lease_relationships lr
  JOIN tenants t ON t.id = lr.entity_id
  WHERE lr.lease_id = p_lease_id
    AND lr.entity_type = 'tenant'
    AND lr.status = 'active'
  ORDER BY COALESCE((lr.metadata->>'is_main_tenant')::BOOLEAN, false) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir la propriété d'un bail
CREATE OR REPLACE FUNCTION get_lease_property(p_lease_id UUID)
RETURNS TABLE (
  property_id UUID,
  name VARCHAR,
  address VARCHAR,
  city VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.city
  FROM lease_relationships lr
  JOIN properties p ON p.id = lr.entity_id
  WHERE lr.lease_id = p_lease_id
    AND lr.entity_type = 'property'
    AND lr.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour valider qu'un bail a au moins 1 owner
CREATE OR REPLACE FUNCTION validate_lease_has_owner()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO owner_count
    FROM lease_relationships
    WHERE lease_id = NEW.lease_id
      AND entity_type = 'owner'
      AND status = 'active';
    
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Un bail doit avoir au moins un propriétaire';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider qu'un bail a au moins 1 tenant
CREATE OR REPLACE FUNCTION validate_lease_has_tenant()
RETURNS TRIGGER AS $$
DECLARE
  tenant_count INTEGER;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO tenant_count
    FROM lease_relationships
    WHERE lease_id = NEW.lease_id
      AND entity_type = 'tenant'
      AND status = 'active';
    
    IF tenant_count = 0 THEN
      RAISE EXCEPTION 'Un bail doit avoir au moins un locataire';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider le pourcentage total de propriété = 100%
CREATE OR REPLACE FUNCTION validate_ownership_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage NUMERIC;
BEGIN
  IF NEW.entity_type = 'owner' AND NEW.status = 'active' THEN
    SELECT COALESCE(SUM((metadata->>'percentage')::NUMERIC), 0) INTO total_percentage
    FROM lease_relationships
    WHERE lease_id = NEW.lease_id
      AND entity_type = 'owner'
      AND status = 'active'
      AND id != NEW.id; -- Exclure la ligne en cours d'insertion
    
    total_percentage := total_percentage + COALESCE((NEW.metadata->>'percentage')::NUMERIC, 0);
    
    IF total_percentage > 100 THEN
      RAISE EXCEPTION 'Le pourcentage total de propriété ne peut pas dépasser 100%% (actuel: %)', total_percentage;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers de validation
CREATE TRIGGER validate_ownership_percentage_trigger
  BEFORE INSERT OR UPDATE ON lease_relationships
  FOR EACH ROW
  EXECUTE FUNCTION validate_ownership_percentage();

COMMENT ON TABLE lease_relationships IS 'Relations entre baux et entités (owners, tenants, properties)';
COMMENT ON COLUMN lease_relationships.metadata IS 'Métadonnées spécifiques: percentage, is_main_owner, is_main_tenant, etc.';
