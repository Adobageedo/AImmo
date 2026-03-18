export type EntityType = 'property' | 'owner' | 'tenant' | 'lease';

export interface EntityCardData {
  id: string;
  type: EntityType;
  name: string;
  essentialInfo?: {
    // Property
    address?: string;
    city?: string;
    type?: string;
    
    // Owner/Tenant
    email?: string;
    phone?: string;
    
    // Lease
    monthlyRent?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    
    // Relationship metadata
    percentage?: number;
    isMainOwner?: boolean;
    isMainTenant?: boolean;
  };
}

export interface EntityRelation {
  id: string;
  entityType: EntityType;
  entityId: string;
  relatedEntityType: EntityType;
  relatedEntityId: string;
  metadata?: Record<string, any>;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: string;
}
