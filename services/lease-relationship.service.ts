import { apiClient } from './api-client';
import type { 
  LeaseRelationship, 
  CreateLeaseRelationshipRequest,
  LeaseWithRelationships,
  ValidationResult,
  LeaseEntityType
} from '@/types/lease-relationship';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

class LeaseRelationshipService {
  private baseUrl = '/organizations';

  /**
   * Créer une relation entre un bail et une entité (owner, tenant, property)
   */
  async create(
    organizationId: string,
    data: CreateLeaseRelationshipRequest
  ): Promise<ApiResponse<LeaseRelationship>> {
    return apiClient.post(
      `${this.baseUrl}/${organizationId}/lease-relationships`,
      data
    );
  }

  /**
   * Créer plusieurs relations en une seule transaction
   */
  async createBulk(
    organizationId: string,
    leaseId: string,
    relationships: {
      owners: { id: string; percentage?: number; is_main_owner?: boolean }[];
      tenants: { id: string; is_main_tenant?: boolean }[];
      property_id: string;
    }
  ): Promise<ApiResponse<LeaseRelationship[]>> {
    const requests: CreateLeaseRelationshipRequest[] = [];

    // Ajouter la propriété
    requests.push({
      lease_id: leaseId,
      entity_type: 'property',
      entity_id: relationships.property_id,
      metadata: {}
    });

    // Ajouter les owners
    relationships.owners.forEach(owner => {
      requests.push({
        lease_id: leaseId,
        entity_type: 'owner',
        entity_id: owner.id,
        metadata: {
          percentage: owner.percentage,
          is_main_owner: owner.is_main_owner
        }
      });
    });

    // Ajouter les tenants
    relationships.tenants.forEach(tenant => {
      requests.push({
        lease_id: leaseId,
        entity_type: 'tenant',
        entity_id: tenant.id,
        metadata: {
          is_main_tenant: tenant.is_main_tenant
        }
      });
    });

    return apiClient.post(
      `${this.baseUrl}/${organizationId}/lease-relationships/bulk`,
      { relationships: requests }
    );
  }

  /**
   * Obtenir toutes les relations d'un bail
   */
  async getByLeaseId(
    organizationId: string,
    leaseId: string
  ): Promise<ApiResponse<LeaseRelationship[]>> {
    return apiClient.get(
      `${this.baseUrl}/${organizationId}/lease-relationships?lease_id=${leaseId}`
    );
  }

  /**
   * Obtenir toutes les relations d'une entité (ex: tous les baux d'un owner)
   */
  async getByEntity(
    organizationId: string,
    entityType: LeaseEntityType,
    entityId: string
  ): Promise<ApiResponse<LeaseRelationship[]>> {
    return apiClient.get(
      `${this.baseUrl}/${organizationId}/lease-relationships?entity_type=${entityType}&entity_id=${entityId}`
    );
  }

  /**
   * Obtenir un bail avec toutes ses relations (owners, tenants, property)
   */
  async getLeaseWithRelationships(
    organizationId: string,
    leaseId: string
  ): Promise<ApiResponse<LeaseWithRelationships>> {
    return apiClient.get(
      `${this.baseUrl}/${organizationId}/leases/${leaseId}/relationships`
    );
  }

  /**
   * Mettre à jour les métadonnées d'une relation
   */
  async updateMetadata(
    organizationId: string,
    relationshipId: string,
    metadata: Record<string, any>
  ): Promise<ApiResponse<LeaseRelationship>> {
    return apiClient.patch(
      `${this.baseUrl}/${organizationId}/lease-relationships/${relationshipId}`,
      { metadata }
    );
  }

  /**
   * Terminer une relation (soft delete)
   */
  async terminate(
    organizationId: string,
    relationshipId: string
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(
      `${this.baseUrl}/${organizationId}/lease-relationships/${relationshipId}`
    );
  }

  /**
   * Valider qu'une relation peut être créée
   */
  async validate(
    organizationId: string,
    data: CreateLeaseRelationshipRequest
  ): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `${this.baseUrl}/${organizationId}/lease-relationships/validate`,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    return {
      valid: false,
      message: response.error || 'Validation failed'
    };
  }

  /**
   * Valider que les pourcentages de propriété totalisent 100%
   */
  validateOwnershipPercentages(
    owners: { percentage?: number }[]
  ): ValidationResult {
    const total = owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);

    if (total > 100) {
      return {
        valid: false,
        message: `Le pourcentage total de propriété dépasse 100% (${total}%)`
      };
    }

    if (total > 0 && total < 100) {
      return {
        valid: false,
        message: `Le pourcentage total de propriété doit être 100% (actuel: ${total}%)`
      };
    }

    return { valid: true };
  }

  /**
   * Vérifier qu'il y a au moins un owner principal
   */
  validateMainOwner(
    owners: { is_main_owner?: boolean }[]
  ): ValidationResult {
    const mainOwners = owners.filter(o => o.is_main_owner);

    if (mainOwners.length === 0) {
      return {
        valid: false,
        message: 'Au moins un propriétaire principal doit être désigné'
      };
    }

    if (mainOwners.length > 1) {
      return {
        valid: false,
        message: 'Un seul propriétaire principal peut être désigné'
      };
    }

    return { valid: true };
  }

  /**
   * Vérifier qu'il y a au moins un tenant principal
   */
  validateMainTenant(
    tenants: { is_main_tenant?: boolean }[]
  ): ValidationResult {
    const mainTenants = tenants.filter(t => t.is_main_tenant);

    if (mainTenants.length === 0) {
      return {
        valid: false,
        message: 'Au moins un locataire principal doit être désigné'
      };
    }

    if (mainTenants.length > 1) {
      return {
        valid: false,
        message: 'Un seul locataire principal peut être désigné'
      };
    }

    return { valid: true };
  }
}

export const leaseRelationshipService = new LeaseRelationshipService();
