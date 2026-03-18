import type { BaseEntity } from "./common";

export type TenantType = "individual" | "company";
export type PaymentStatus = "ok" | "late" | "unpaid";
export type ContractType = "cdi" | "cdd" | "interim" | "freelance" | "retired" | "student" | "other";

export interface TenantEmployment {
  employer: string;
  position: string;
  contract_type: ContractType;
  start_date: string;
  monthly_salary?: number;
  employer_phone?: string;
  employer_address?: string;
}

export interface TenantReference {
  id?: string;
  type: 'employer' | 'previous_landlord' | 'personal';
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

export interface TenantGuarantor {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  relationship: string;
  monthly_income?: number;
  iban?: string;
  bic?: string;
}

export interface Tenant extends BaseEntity {
  type: TenantType;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  payment_status: PaymentStatus;
  
  // Employment info (for individuals)
  employment?: TenantEmployment;
  
  // References
  references?: TenantReference[];
  
  // Guarantors
  guarantors?: TenantGuarantor[];
  
  notes?: string;
}

export interface CreateTenantRequest {
  type: TenantType;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  employment?: TenantEmployment;
  references?: TenantReference[];
  guarantors?: TenantGuarantor[];
  notes?: string;
}

export interface UpdateTenantRequest extends Partial<CreateTenantRequest> {
  payment_status?: PaymentStatus;
}
