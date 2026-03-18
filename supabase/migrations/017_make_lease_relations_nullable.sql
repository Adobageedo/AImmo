-- =====================================================
-- MAKE LEASE RELATIONS NULLABLE
-- =====================================================
-- Rendre property_id, owner_ids, tenant_ids optionnels
-- car les relations sont maintenant gérées via lease_relationships

-- Supprimer la contrainte NOT NULL sur property_id
ALTER TABLE leases 
  ALTER COLUMN property_id DROP NOT NULL;

-- Supprimer la contrainte NOT NULL sur owner_ids
ALTER TABLE leases 
  ALTER COLUMN owner_ids DROP NOT NULL;

-- Supprimer la contrainte NOT NULL sur tenant_ids
ALTER TABLE leases 
  ALTER COLUMN tenant_ids DROP NOT NULL;

-- Mettre à jour les valeurs par défaut pour être NULL au lieu de tableaux vides
ALTER TABLE leases 
  ALTER COLUMN owner_ids SET DEFAULT NULL;

ALTER TABLE leases 
  ALTER COLUMN tenant_ids SET DEFAULT NULL;

-- Commentaire pour documenter le changement
COMMENT ON COLUMN leases.property_id IS 'Property ID (optional - use lease_relationships for new leases)';
COMMENT ON COLUMN leases.owner_ids IS 'Owner IDs (legacy - use lease_relationships for new leases)';
COMMENT ON COLUMN leases.tenant_ids IS 'Tenant IDs (legacy - use lease_relationships for new leases)';
