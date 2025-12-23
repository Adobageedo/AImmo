export enum OCRProvider {
  TESSERACT = "tesseract",
  GPT_VISION = "gpt_vision",
  HYBRID = "hybrid",
}

export enum DocumentLanguage {
  FR = "fr",
  EN = "en",
  ES = "es",
  IT = "it",
  DE = "de",
}

export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  VALIDATED = "validated",
}

export interface OCRResult {
  text: string
  confidence: number
  language: DocumentLanguage
  provider: OCRProvider
  page_count: number
  is_scanned: boolean
  metadata: Record<string, any>
}

export interface ParsedParty {
  type: "landlord" | "tenant"
  name: string
  address?: string
  email?: string
  phone?: string
  company_name?: string
  siret?: string
}

export interface ParsedLease {
  parties: ParsedParty[]
  property_address: string
  property_city?: string
  property_zip?: string
  property_type?: string
  surface_area?: number
  start_date?: string
  end_date?: string
  monthly_rent?: number
  charges?: number
  deposit?: number
  indexation_rate?: number
  key_clauses: string[]
  confidence: number
  raw_data: Record<string, any>
}

export interface DocumentProcessing {
  id: string
  document_id: string
  status: ProcessingStatus
  ocr_result?: OCRResult
  parsed_lease?: ParsedLease
  error_message?: string
  created_at: string
  updated_at: string
  validated_at?: string
  validated_by?: string
}

export interface ProcessingRequest {
  document_id: string
  organization_id: string
  ocr_provider?: OCRProvider
  force_reprocess?: boolean
}

export interface ValidationRequest {
  processing_id: string
  organization_id: string
  validated_data: ParsedLease
  create_entities?: boolean
}

export interface EntityCreationResult {
  property_id?: string
  tenant_id?: string
  lease_id?: string
  errors: string[]
}
