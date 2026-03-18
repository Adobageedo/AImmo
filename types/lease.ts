import type { BaseEntity } from "./common";

export type LeaseStatus = "draft" | "pending_signature" | "active" | "expiring_soon" | "expired" | "terminated" | "disputed";
export type LeaseType = "residential" | "commercial" | "furnished" | "unfurnished" | "seasonal";

export interface LeaseParty {
  id: string;
  name: string;
  percentage?: number; // For owners
  is_main?: boolean; // For tenants
}

export interface Lease extends BaseEntity {
  property_id: string;
  
  // Multiple owners and tenants support
  owner_ids: string[];
  tenant_ids: string[];
  owners?: LeaseParty[]; // Populated data
  tenants?: LeaseParty[]; // Populated data
  
  // Lease type and dates
  lease_type: LeaseType;
  start_date: string;
  end_date: string;
  duration_months: number;
  
  // Financial terms
  monthly_rent: number;
  charges: number;
  deposit: number;
  payment_day: number;
  payment_frequency: 'monthly' | 'quarterly';
  
  // Indexation
  indexation_clause: boolean;
  indexation_rate?: number;
  indexation_index?: 'irl' | 'icc' | 'custom';
  indexation_date?: string;
  
  // Terms and conditions
  status: LeaseStatus;
  termination_notice_period?: number;
  renewal_automatic?: boolean;
  renewal_conditions?: string;
  special_clauses?: string[];
  
  // Documents
  document_id?: string;
  signed_at?: string;
  
  notes?: string;
}

export interface LeaseExtraction {
  landlord?: string;
  tenant?: string;
  property_address?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  charges?: number;
  deposit?: number;
  indexation_clause?: boolean;
  special_clauses?: string[];
  confidence_score?: number;
}

export interface CreateLeaseRequest {
  property_id: string;
  owner_ids: string[];
  tenant_ids: string[];
  lease_type: LeaseType;
  start_date: string;
  end_date: string;
  duration_months: number;
  monthly_rent: number;
  charges: number;
  deposit: number;
  payment_day: number;
  payment_frequency?: 'monthly' | 'quarterly';
  indexation_clause?: boolean;
  indexation_rate?: number;
  indexation_index?: 'irl' | 'icc' | 'custom';
  termination_notice_period?: number;
  renewal_automatic?: boolean;
  renewal_conditions?: string;
  special_clauses?: string[];
  notes?: string;
}

export interface UpdateLeaseRequest extends Partial<CreateLeaseRequest> {
  status?: LeaseStatus;
}
