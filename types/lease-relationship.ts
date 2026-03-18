import type { BaseEntity } from "./common";

export type LeaseEntityType = "owner" | "tenant" | "property";
export type LeaseRelationshipStatus = "active" | "inactive" | "terminated";

export interface LeaseRelationshipMetadata {
  // Pour owners
  percentage?: number;
  is_main_owner?: boolean;
  
  // Pour tenants
  is_main_tenant?: boolean;
  occupancy_start?: string;
  
  // Pour properties
  rooms_rented?: number[];
  floor?: number;
  
  // Autres métadonnées custom
  [key: string]: any;
}

export interface LeaseRelationship extends BaseEntity {
  organization_id: string;
  lease_id: string;
  entity_type: LeaseEntityType;
  entity_id: string;
  metadata: LeaseRelationshipMetadata;
  status: LeaseRelationshipStatus;
  created_by?: string;
  terminated_at?: string;
  terminated_by?: string;
}

export interface CreateLeaseRelationshipRequest {
  lease_id: string;
  entity_type: LeaseEntityType;
  entity_id: string;
  metadata?: LeaseRelationshipMetadata;
}

export interface LeaseWithRelationships {
  lease_id: string;
  owners: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    percentage?: number;
    is_main_owner?: boolean;
  }[];
  tenants: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_main_tenant?: boolean;
  }[];
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  errors?: string[];
}
