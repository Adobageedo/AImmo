export type DocumentType = 'pdf' | 'word' | 'image';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'needs_review';
export type EntityMatchStatus = 'exact' | 'fuzzy' | 'new' | 'manual';

export interface UploadedDocument {
  id: string;
  file_name: string;
  file_type: DocumentType;
  file_size: number;
  file_url: string;
  storage_path: string | null;
  raw_text_path: string | null;
  uploaded_at: string;
  organization_id: string;
  lease_id?: string;
}

export interface ExtractedLeaseData {
  // Parties
  landlord_name?: string;
  landlord_address?: string;
  landlord_email?: string;
  landlord_phone?: string;
  
  tenant_name?: string;
  tenant_company_name?: string;
  tenant_address?: string;
  tenant_email?: string;
  tenant_phone?: string;
  
  // Property
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_type?: string;
  property_surface?: number;
  
  // Lease details
  lease_type?: 'residential' | 'commercial' | 'furnished' | 'unfurnished' | 'seasonal';
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  
  // Financial
  monthly_rent?: number;
  charges?: number;
  deposit?: number;
  payment_day?: number;
  
  // Indexation
  indexation_clause?: boolean;
  indexation_index?: string;
  indexation_rate?: number;
  
  // Other
  special_clauses?: string[];
  termination_notice_period?: number;
  renewal_automatic?: boolean;
  
  // Metadata
  confidence_score?: number;
  extraction_method?: 'pdf_text' | 'ocr' | 'word';
  raw_text?: string;
}

export interface EntityMatch {
  type: 'property' | 'owner' | 'tenant';
  status: EntityMatchStatus;
  confidence: number;
  existing_id?: string;
  existing_name?: string;
  extracted_data: any;
  suggested_action: 'link' | 'create' | 'review';
}

export interface LeaseDocumentExtraction {
  id: string;
  document_id: string;
  organization_id: string;
  status: ExtractionStatus;
  extracted_data: ExtractedLeaseData;
  entity_matches: {
    property?: EntityMatch;
    owner?: EntityMatch;
    tenant?: EntityMatch;
  };
  created_at: string;
  updated_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface LeaseDocumentUploadRequest {
  file: File;
  organization_id: string;
}

export interface LeaseDocumentUploadResponse {
  document: UploadedDocument;
  extraction: LeaseDocumentExtraction;
}

export interface ValidateAndCreateLeaseRequest {
  extraction_id: string;
  validated_data: {
    lease_data: ExtractedLeaseData;
    property_action: 'link' | 'create';
    property_id?: string;
    owner_action: 'link' | 'create';
    owner_id?: string;
    tenant_action: 'link' | 'create';
    tenant_id?: string;
  };
}

export interface ValidateAndCreateLeaseResponse {
  lease_id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  created_entities: {
    property_created: boolean;
    owner_created: boolean;
    tenant_created: boolean;
  };
}

export interface LeaseDocument {
  id: string;
  lease_id?: string;
  document_id: string;
  file_name: string;
  file_type: DocumentType;
  file_url: string;
  file_size: number;
  storage_path: string | null;
  raw_text_path: string | null;
  text_content?: string; // Preview du texte extrait (2000 chars max, full text dans Storage)
  extraction_status: ExtractionStatus;
  extraction_data?: ExtractedLeaseData;
  extraction_error?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}
