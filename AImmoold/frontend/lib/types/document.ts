export enum DocumentType {
  BAIL = "bail",
  FACTURE = "facture",
  AVIS_ECHEANCE = "avis_echeance",
  DIAGNOSTIC = "diagnostic",
  RAPPORT_FINANCIER = "rapport_financier",
  AUTRE = "autre",
}

// RAG Source Types - Doit correspondre exactement au backend
export enum SourceType {
  DOCUMENTS = "documents",    // ✅ Correspond au backend
  LEASES = "leases",          // ✅ Correspond au backend
  PROPERTIES = "properties",  // ✅ Correspond au backend
  TENANTS = "tenants",
  KPI = "kpi",
  OWNERS = "owners",
}

export enum FileType {
  PDF = "pdf",
  DOCX = "docx",
  XLSX = "xlsx",
  PPTX = "pptx",
  TXT = "txt",
  CSV = "csv",
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  GIF = "gif",
}

export interface Document {
  id: string
  title: string
  description?: string
  document_type: DocumentType
  source_type: SourceType // For RAG indexing
  folder_path: string
  file_path: string
  file_type: FileType
  file_size: number
  organization_id: string
  property_id?: string
  lease_id?: string
  tags: string[]
  uploaded_by: string
  created_at: string
  updated_at: string
  
  // Vectorization fields
  vectorization_status?: "not_planned" | "planned" | "in_progress" | "vectorized" | "error" | "waiting"
  vectorization_started_at?: string
  vectorization_completed_at?: string
  vectorization_error?: string
  qdrant_collection_name?: string
  num_chunks?: number
  content_hash?: string
}

export interface DocumentUploadRequest {
  file: File
  organization_id: string
  title: string
  document_type?: DocumentType
  folder_path?: string
  description?: string
  property_id?: string
  lease_id?: string
  tags?: string[]
}

export interface DocumentUpdateRequest {
  title?: string
  description?: string
  document_type?: DocumentType
  folder_path?: string
  tags?: string[]
  property_id?: string
  lease_id?: string
}

export interface OrganizationQuota {
  organization_id: string
  used_bytes: number
  quota_bytes: number
  used_mb: number
  quota_mb: number
  usage_percentage: number
}
