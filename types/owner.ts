import type { BaseEntity } from "./common";

export interface Owner extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  
  // Address
  address: string;
  city: string;
  postal_code: string;
  country: string;
  
  // Banking info
  iban?: string;
  bic?: string;
  bank_name?: string;
  
  // Preferences
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'mail';
  preferred_language?: 'fr' | 'en';
  
  notes?: string;
}

export interface CreateOwnerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'mail';
  preferred_language?: 'fr' | 'en';
  notes?: string;
}

export interface UpdateOwnerRequest extends Partial<CreateOwnerRequest> {}
