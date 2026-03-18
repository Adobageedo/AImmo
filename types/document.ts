import type { BaseEntity } from "./common";

export type DocumentType = 
  | "lease"
  | "invoice"
  | "payment_notice"
  | "diagnostic"
  | "financial_report"
  | "other";

export type DocumentStatus = "pending" | "processing" | "processed" | "failed";

export interface Document extends BaseEntity {
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  type: DocumentType;
  status: DocumentStatus;
  folder_path?: string;
  tags?: string[];
  description?: string;
  linked_property_id?: string;
  linked_lease_id?: string;
  linked_tenant_id?: string;
  ocr_text?: string;
  extracted_data?: Record<string, unknown>;
  indexed_at?: string;
}

export interface UploadDocumentRequest {
  file: File;
  type: DocumentType;
  folder_path?: string;
  tags?: string[];
  description?: string;
  linked_property_id?: string;
  linked_lease_id?: string;
  linked_tenant_id?: string;
}

export interface UpdateDocumentRequest {
  name?: string;
  type?: DocumentType;
  folder_path?: string;
  tags?: string[];
  description?: string;
  linked_property_id?: string;
  linked_lease_id?: string;
  linked_tenant_id?: string;
}

export interface DocumentSearchParams {
  query?: string;
  type?: DocumentType;
  tags?: string[];
  folder_path?: string;
  linked_property_id?: string;
  linked_lease_id?: string;
  linked_tenant_id?: string;
}
