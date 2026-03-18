import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type EntityType = 'property' | 'owner' | 'tenant' | 'lease';

interface RelationshipData {
  id: string;
  lease_id: string;
  entity_id: string;
  entity_type: EntityType;
  related_entity_id: string;
  related_entity_type: EntityType;
  metadata?: any;
  status: string;
  created_at: string;
}

interface PropertyData {
  id: string;
  name?: string;
  address?: string;
  city?: string;
  metadata?: any;
}

interface OwnerData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  metadata?: any;
}

interface TenantData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  metadata?: any;
}

interface LeaseData {
  id: string;
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  status?: string;
  metadata?: any;
}

interface EntityWithRelationships {
  entityId: string;
  entityType: EntityType;
  relationships: {
    leases: Array<LeaseData>;
    properties: Array<PropertyData>;
    owners: Array<OwnerData>;
    tenants: Array<TenantData>;
  };
}

/**
 * Service centralisé pour gérer les relationships entre entités
 * Logique optimisée selon le type d'entité:
 * - Leases: fetch direct par lease_id
 * - Autres entités: fetch via leases (lease = clé primaire)
 */
export class RelationshipService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Récupère les relationships pour une seule entité
   */
  async getRelationshipsForEntity(
    entityId: string,
    entityType: EntityType
  ): Promise<EntityWithRelationships> {
    if (entityType === 'lease') {
      return this.getRelationshipsForLease(entityId);
    }
    return this.getRelationshipsViaLeases(entityId, entityType);
  }

  /**
   * Récupère les relationships pour une liste d'entités
   * Optimisé avec bulk queries
   */
  async getRelationshipsForEntities(
    entityIds: string[],
    entityType: EntityType
  ): Promise<Map<string, EntityWithRelationships>> {
    if (entityType === 'lease') {
      return this.getRelationshipsForLeases(entityIds);
    }
    return this.getRelationshipsForEntitiesViaLeases(entityIds, entityType);
  }

  /**
   * Pour LEASES: fetch direct par lease_id
   * Simple et rapide car lease est déjà la relation
   */
  private async getRelationshipsForLease(
    leaseId: string
  ): Promise<EntityWithRelationships> {
    const { data: relationships, error } = await this.supabase
      .from('lease_relationships')
      .select('*')
      .eq('lease_id', leaseId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error fetching lease relationships: ${error.message}`);
    }

    return this.organizeRelationships(leaseId, 'lease', relationships || []);
  }

  /**
   * Pour LEASES (bulk): fetch direct pour tous les leases avec données complètes
   */
  private async getRelationshipsForLeases(
    leaseIds: string[]
  ): Promise<Map<string, EntityWithRelationships>> {
    const { data: relationships, error } = await this.supabase
      .from('lease_relationships')
      .select('*')
      .in('lease_id', leaseIds)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error fetching leases relationships: ${error.message}`);
    }

    if (!relationships || relationships.length === 0) {
      return this.organizeRelationshipsForLeases(leaseIds, []);
    }

    // Extraire les IDs par type d'entité
    const propertyIds = [...new Set(relationships.filter(r => r.entity_type === 'property').map(r => r.entity_id))];
    const ownerIds = [...new Set(relationships.filter(r => r.entity_type === 'owner').map(r => r.entity_id))];
    const tenantIds = [...new Set(relationships.filter(r => r.entity_type === 'tenant').map(r => r.entity_id))];

    // Fetch en parallèle les données complètes
    const [propertiesData, ownersData, tenantsData] = await Promise.all([
      propertyIds.length > 0 
        ? this.supabase.from('properties').select('id, name, address, city').in('id', propertyIds)
        : Promise.resolve({ data: [] }),
      ownerIds.length > 0
        ? this.supabase.from('owners').select('id, first_name, last_name, email').in('id', ownerIds)
        : Promise.resolve({ data: [] }),
      tenantIds.length > 0
        ? this.supabase.from('tenants').select('id, first_name, last_name, email').in('id', tenantIds)
        : Promise.resolve({ data: [] })
    ]);

    // Créer des maps pour lookup rapide
    const propertiesMap = new Map((propertiesData.data || []).map(p => [p.id, p]));
    const ownersMap = new Map((ownersData.data || []).map(o => [o.id, o]));
    const tenantsMap = new Map((tenantsData.data || []).map(t => [t.id, t]));

    return this.organizeRelationshipsForLeasesWithData(
      leaseIds, 
      relationships, 
      propertiesMap, 
      ownersMap, 
      tenantsMap
    );
  }

  /**
   * Pour AUTRES ENTITÉS (property, owner, tenant):
   * 1. Fetch tous les leases liés à l'entité
   * 2. Pour chaque lease, fetch toutes les relations
   * Le lease est la clé primaire du système
   */
  private async getRelationshipsViaLeases(
    entityId: string,
    entityType: EntityType
  ): Promise<EntityWithRelationships> {
    // Étape 1: Trouver tous les leases liés à cette entité
    const { data: entityLeases, error: leasesError } = await this.supabase
      .from('lease_relationships')
      .select('entity_id')
      .eq('related_entity_id', entityId)
      .eq('related_entity_type', entityType)
      .eq('entity_type', 'lease')
      .eq('status', 'active');

    if (leasesError) {
      throw new Error(`Error fetching entity leases: ${leasesError.message}`);
    }

    if (!entityLeases || entityLeases.length === 0) {
      return this.emptyRelationships(entityId, entityType);
    }

    const leaseIds = [...new Set(entityLeases.map(l => l.entity_id))];

    // Étape 2: Pour chaque lease, récupérer toutes ses relations
    const { data: allRelationships, error: relsError } = await this.supabase
      .from('lease_relationships')
      .select('*')
      .in('entity_id', leaseIds)
      .eq('entity_type', 'lease')
      .eq('status', 'active');

    if (relsError) {
      throw new Error(`Error fetching lease relationships: ${relsError.message}`);
    }

    return this.organizeRelationships(entityId, entityType, allRelationships || []);
  }

  /**
   * Pour AUTRES ENTITÉS (bulk):
   * Même logique mais optimisée pour plusieurs entités avec données enrichies
   */
  private async getRelationshipsForEntitiesViaLeases(
    entityIds: string[],
    entityType: EntityType
  ): Promise<Map<string, EntityWithRelationships>> {
    // Étape 1: Trouver tous les leases liés à ces entités
    const { data: entityLeases, error: leasesError } = await this.supabase
      .from('lease_relationships')
      .select('lease_id, entity_id')
      .in('entity_id', entityIds)
      .eq('entity_type', entityType)
      .eq('status', 'active');

    if (leasesError) {
      throw new Error(`Error fetching entities leases: ${leasesError.message}`);
    }

    if (!entityLeases || entityLeases.length === 0) {
      return this.emptyRelationshipsMap(entityIds, entityType);
    }

    // Map: entityId -> leaseIds
    const entityToLeases = new Map<string, string[]>();
    entityLeases.forEach(el => {
      if (!entityToLeases.has(el.entity_id)) {
        entityToLeases.set(el.entity_id, []);
      }
      entityToLeases.get(el.entity_id)!.push(el.lease_id);
    });

    const allLeaseIds = [...new Set(entityLeases.map(l => l.lease_id))];

    // Étape 2: Pour tous ces leases, récupérer toutes leurs relations
    const { data: allRelationships, error: relsError } = await this.supabase
      .from('lease_relationships')
      .select('*')
      .in('lease_id', allLeaseIds)
      .eq('status', 'active');

    if (relsError) {
      throw new Error(`Error fetching lease relationships: ${relsError.message}`);
    }

    if (!allRelationships || allRelationships.length === 0) {
      return this.emptyRelationshipsMap(entityIds, entityType);
    }

    // Étape 3: Enrichir les données avec les détails complets
    const propertyIds = [...new Set(allRelationships.filter(r => r.entity_type === 'property').map(r => r.entity_id))];
    const ownerIds = [...new Set(allRelationships.filter(r => r.entity_type === 'owner').map(r => r.entity_id))];
    const tenantIds = [...new Set(allRelationships.filter(r => r.entity_type === 'tenant').map(r => r.entity_id))];

    // Fetch en parallèle les données complètes (y compris les leases)
    const [propertiesData, ownersData, tenantsData, leasesData] = await Promise.all([
      propertyIds.length > 0 
        ? this.supabase.from('properties').select('id, name, address, city').in('id', propertyIds)
        : Promise.resolve({ data: [] }),
      ownerIds.length > 0
        ? this.supabase.from('owners').select('id, first_name, last_name, email').in('id', ownerIds)
        : Promise.resolve({ data: [] }),
      tenantIds.length > 0
        ? this.supabase.from('tenants').select('id, first_name, last_name, email').in('id', tenantIds)
        : Promise.resolve({ data: [] }),
      allLeaseIds.length > 0
        ? this.supabase.from('leases').select('id, start_date, end_date, monthly_rent, status').in('id', allLeaseIds)
        : Promise.resolve({ data: [] })
    ]);

    // Créer des maps pour lookup rapide
    const propertiesMap = new Map((propertiesData.data || []).map(p => [p.id, p]));
    const ownersMap = new Map((ownersData.data || []).map(o => [o.id, o]));
    const tenantsMap = new Map((tenantsData.data || []).map(t => [t.id, t]));
    const leasesMap = new Map((leasesData.data || []).map(l => [l.id, l]));

    return this.organizeRelationshipsByEntityWithData(
      entityIds, 
      entityType, 
      allRelationships, 
      propertiesMap, 
      ownersMap, 
      tenantsMap,
      leasesMap
    );
  }

/**
   * Organise les relationships pour une seule entité
   */
  private organizeRelationships(
    entityId: string,
    entityType: EntityType,
    relationships: RelationshipData[]
  ): EntityWithRelationships {
    const result: EntityWithRelationships = {
      entityId,
      entityType,
      relationships: {
        leases: [],
        properties: [],
        owners: [],
        tenants: []
      }
    };

    relationships.forEach(rel => {
      const target = {
        id: rel.entity_id,
        metadata: rel.metadata
      };

      switch (rel.entity_type) {
        case 'property':
          result.relationships.properties.push(target);
          break;
        case 'owner':
          result.relationships.owners.push(target);
          break;
        case 'tenant':
          result.relationships.tenants.push(target);
          break;
      }
    });

    // Dédupliquer
    result.relationships.properties = this.deduplicate(result.relationships.properties);
    result.relationships.owners = this.deduplicate(result.relationships.owners);
    result.relationships.tenants = this.deduplicate(result.relationships.tenants);

    return result;
  }

/**
   * Organise les relationships pour plusieurs leases AVEC données complètes
   */
  private organizeRelationshipsForLeasesWithData(
    leaseIds: string[],
    relationships: RelationshipData[],
    propertiesMap: Map<string, any>,
    ownersMap: Map<string, any>,
    tenantsMap: Map<string, any>
  ): Map<string, EntityWithRelationships> {
    const map = new Map<string, EntityWithRelationships>();

    // Initialiser toutes les entités
    leaseIds.forEach(id => {
      map.set(id, this.emptyRelationships(id, 'lease'));
    });

    // Grouper par lease_id avec données complètes
    relationships.forEach(rel => {
      const leaseRels = map.get(rel.lease_id);
      if (!leaseRels) return;

      switch (rel.entity_type) {
        case 'property': {
          const propertyData = propertiesMap.get(rel.entity_id);
          if (propertyData && !leaseRels.relationships.properties.some(p => p.id === rel.entity_id)) {
            leaseRels.relationships.properties.push({
              ...propertyData,
              metadata: rel.metadata
            });
          }
          break;
        }
        case 'owner': {
          const ownerData = ownersMap.get(rel.entity_id);
          if (ownerData && !leaseRels.relationships.owners.some(o => o.id === rel.entity_id)) {
            leaseRels.relationships.owners.push({
              ...ownerData,
              metadata: rel.metadata
            });
          }
          break;
        }
        case 'tenant': {
          const tenantData = tenantsMap.get(rel.entity_id);
          if (tenantData && !leaseRels.relationships.tenants.some(t => t.id === rel.entity_id)) {
            leaseRels.relationships.tenants.push({
              ...tenantData,
              metadata: rel.metadata
            });
          }
          break;
        }
      }
    });

    return map;
  }

  /**
   * Organise les relationships pour plusieurs leases (fallback sans données)
   * Structure spécifique: lease_id + entity_type + entity_id
   */
  private organizeRelationshipsForLeases(
    leaseIds: string[],
    relationships: RelationshipData[]
  ): Map<string, EntityWithRelationships> {
    const map = new Map<string, EntityWithRelationships>();

    // Initialiser toutes les entités
    leaseIds.forEach(id => {
      map.set(id, this.emptyRelationships(id, 'lease'));
    });

    return map;
  }

  /**
   * Organise les relationships pour plusieurs entités AVEC données enrichies
   */
  private organizeRelationshipsByEntityWithData(
    entityIds: string[],
    entityType: EntityType,
    relationships: RelationshipData[],
    propertiesMap: Map<string, any>,
    ownersMap: Map<string, any>,
    tenantsMap: Map<string, any>,
    leasesMap: Map<string, any>
  ): Map<string, EntityWithRelationships> {
    const map = new Map<string, EntityWithRelationships>();

    // Initialiser toutes les entités
    entityIds.forEach(id => {
      map.set(id, this.emptyRelationships(id, entityType));
    });

    // Grouper les relationships par lease
    const relsByLease = new Map<string, RelationshipData[]>();
    relationships.forEach(rel => {
      if (!relsByLease.has(rel.lease_id)) {
        relsByLease.set(rel.lease_id, []);
      }
      relsByLease.get(rel.lease_id)!.push(rel);
    });

    // Pour chaque lease, distribuer ses relations aux entités concernées
    relsByLease.forEach((leaseRels, leaseId) => {
      // Trouver les entités liées à ce lease
      const linkedEntities = leaseRels
        .filter(r => r.entity_type === entityType && entityIds.includes(r.entity_id))
        .map(r => r.entity_id);

      // Pour chaque entité liée à ce lease, ajouter le lease ET toutes les autres relations du lease
      linkedEntities.forEach(entityId => {
        const entityRels = map.get(entityId)!;
        
        // D'abord, ajouter le lease lui-même avec ses données complètes
        if (!entityRels.relationships.leases.some(l => l.id === leaseId)) {
          const leaseData = leasesMap.get(leaseId);
          if (leaseData) {
            entityRels.relationships.leases.push({ 
              id: leaseId, 
              ...leaseData,
              metadata: {} 
            });
          } else {
            entityRels.relationships.leases.push({ id: leaseId, metadata: {} });
          }
        }
        
        // Ensuite, ajouter toutes les autres entités liées à ce lease
        leaseRels.forEach(rel => {
          // Ne pas ajouter l'entité elle-même
          if (rel.entity_type === entityType && rel.entity_id === entityId) {
            return;
          }

          switch (rel.entity_type) {
            case 'property': {
              const propertyData = propertiesMap.get(rel.entity_id);
              if (propertyData && !entityRels.relationships.properties.some(p => p.id === rel.entity_id)) {
                entityRels.relationships.properties.push({
                  ...propertyData,
                  metadata: rel.metadata
                });
              }
              break;
            }
            case 'owner': {
              const ownerData = ownersMap.get(rel.entity_id);
              if (ownerData && !entityRels.relationships.owners.some(o => o.id === rel.entity_id)) {
                entityRels.relationships.owners.push({
                  ...ownerData,
                  metadata: rel.metadata
                });
              }
              break;
            }
            case 'tenant': {
              const tenantData = tenantsMap.get(rel.entity_id);
              if (tenantData && !entityRels.relationships.tenants.some(t => t.id === rel.entity_id)) {
                entityRels.relationships.tenants.push({
                  ...tenantData,
                  metadata: rel.metadata
                });
              }
              break;
            }
          }
        });
      });
    });

    return map;
  }

  /**
   * Organise les relationships pour plusieurs entités (fallback sans données)
   */
  private organizeRelationshipsByEntity(
    entityIds: string[],
    entityType: EntityType,
    relationships: RelationshipData[]
  ): Map<string, EntityWithRelationships> {
    const map = new Map<string, EntityWithRelationships>();

    // Initialiser toutes les entités
    entityIds.forEach(id => {
      map.set(id, this.emptyRelationships(id, entityType));
    });

    return map;
  }

  private deduplicate<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  private emptyRelationships(entityId: string, entityType: EntityType): EntityWithRelationships {
    return {
      entityId,
      entityType,
      relationships: {
        leases: [],
        properties: [],
        owners: [],
        tenants: []
      }
    };
  }

  private emptyRelationshipsMap(
    entityIds: string[],
    entityType: EntityType
  ): Map<string, EntityWithRelationships> {
    const map = new Map<string, EntityWithRelationships>();
    entityIds.forEach(id => {
      map.set(id, this.emptyRelationships(id, entityType));
    });
    return map;
  }
}

// Export singleton instance
export const relationshipService = new RelationshipService();
