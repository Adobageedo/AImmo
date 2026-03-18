import { useState, useCallback, useEffect } from 'react';
import { leaseRelationshipService } from '@/services/lease-relationship.service';
import type { 
  LeaseRelationship, 
  LeaseWithRelationships,
  CreateLeaseRelationshipRequest 
} from '@/types/lease-relationship';

export function useLeaseRelationships(organizationId: string, leaseId?: string) {
  const [relationships, setRelationships] = useState<LeaseRelationship[]>([]);
  const [leaseWithRelationships, setLeaseWithRelationships] = useState<LeaseWithRelationships | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer toutes les relations d'un bail
  const fetchRelationships = useCallback(async () => {
    if (!leaseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.getByLeaseId(organizationId, leaseId);
      
      if (result.success && result.data) {
        setRelationships(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement des relations');
      }
    } catch (err) {
      setError('Erreur lors du chargement des relations');
    } finally {
      setLoading(false);
    }
  }, [organizationId, leaseId]);

  // Récupérer un bail avec toutes ses relations (owners, tenants, property)
  const fetchLeaseWithRelationships = useCallback(async () => {
    if (!leaseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.getLeaseWithRelationships(organizationId, leaseId);
      
      if (result.success && result.data) {
        setLeaseWithRelationships(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement du bail');
      }
    } catch (err) {
      setError('Erreur lors du chargement du bail');
    } finally {
      setLoading(false);
    }
  }, [organizationId, leaseId]);

  // Créer une relation
  const createRelationship = useCallback(async (data: CreateLeaseRelationshipRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.create(organizationId, data);
      
      if (result.success) {
        // Rafraîchir les données
        await fetchRelationships();
        await fetchLeaseWithRelationships();
        return result;
      } else {
        setError(result.error || 'Erreur lors de la création de la relation');
        return result;
      }
    } catch (err) {
      setError('Erreur lors de la création de la relation');
      return { success: false, error: 'Erreur lors de la création de la relation' };
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchRelationships, fetchLeaseWithRelationships]);

  // Créer plusieurs relations en bulk
  const createBulkRelationships = useCallback(async (
    leaseId: string,
    relationships: {
      owners: { id: string; percentage?: number; is_main_owner?: boolean }[];
      tenants: { id: string; is_main_tenant?: boolean }[];
      property_id: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.createBulk(
        organizationId,
        leaseId,
        relationships
      );
      
      if (result.success) {
        // Rafraîchir les données
        await fetchRelationships();
        await fetchLeaseWithRelationships();
        return result;
      } else {
        setError(result.error || 'Erreur lors de la création des relations');
        return result;
      }
    } catch (err) {
      setError('Erreur lors de la création des relations');
      return { success: false, error: 'Erreur lors de la création des relations' };
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchRelationships, fetchLeaseWithRelationships]);

  // Mettre à jour les métadonnées d'une relation
  const updateMetadata = useCallback(async (
    relationshipId: string,
    metadata: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.updateMetadata(
        organizationId,
        relationshipId,
        metadata
      );
      
      if (result.success) {
        // Rafraîchir les données
        await fetchRelationships();
        await fetchLeaseWithRelationships();
        return result;
      } else {
        setError(result.error || 'Erreur lors de la mise à jour');
        return result;
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour');
      return { success: false, error: 'Erreur lors de la mise à jour' };
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchRelationships, fetchLeaseWithRelationships]);

  // Terminer une relation
  const terminateRelationship = useCallback(async (relationshipId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await leaseRelationshipService.terminate(organizationId, relationshipId);
      
      if (result.success) {
        // Rafraîchir les données
        await fetchRelationships();
        await fetchLeaseWithRelationships();
        return result;
      } else {
        setError(result.error || 'Erreur lors de la suppression');
        return result;
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
      return { success: false, error: 'Erreur lors de la suppression' };
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchRelationships, fetchLeaseWithRelationships]);

  // Charger automatiquement au montage si leaseId fourni
  useEffect(() => {
    if (leaseId) {
      fetchRelationships();
      fetchLeaseWithRelationships();
    }
  }, [leaseId, fetchRelationships, fetchLeaseWithRelationships]);

  return {
    relationships,
    leaseWithRelationships,
    loading,
    error,
    fetchRelationships,
    fetchLeaseWithRelationships,
    createRelationship,
    createBulkRelationships,
    updateMetadata,
    terminateRelationship,
  };
}
