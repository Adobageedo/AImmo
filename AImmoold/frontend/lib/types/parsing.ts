// Parsing Types for OCR + LLM extraction
// NOTE: OCRProvider, ValidationRequest, EntityCreationResult are re-exported from processing.ts
// to maintain backward compatibility

import { OCRProvider } from "./processing"
export { OCRProvider }

/**
 * Status of the parsing pipeline
 */
export enum ParsingStatus {
    PENDING = "pending",
    OCR_PROCESSING = "ocr_processing",
    PARSING = "parsing",
    REVIEW = "review",
    COMPLETED = "completed",
    FAILED = "failed",
}

/**
 * Confidence levels for extracted data
 */
export enum ConfidenceLevel {
    HIGH = "high",     // > 0.9
    MEDIUM = "medium", // 0.7 - 0.9
    LOW = "low",       // 0.5 - 0.7
    UNCERTAIN = "uncertain", // < 0.5
}

/**
 * Individual field extracted from document
 */
export interface FieldExtraction {
    name: string
    label: string // French display label
    value: string | number | Date | null
    type: "string" | "number" | "date" | "currency" | "boolean"
    confidence: number
    confidence_level: ConfidenceLevel
    source_page?: number
    source_text?: string // Original text that was extracted from
    is_validated: boolean
    validation_error?: string
}

/**
 * Party extracted from a lease (landlord, tenant)
 */
export interface ExtractedParty {
    type: "landlord" | "tenant" | "guarantor" | "other"
    name: string
    address?: string
    email?: string
    confidence: number
}

/**
 * Extracted lease data - extends ParsedLease with additional fields
 */
export interface ExtractedLeaseData {
    parties: ExtractedParty[]
    property_address: string
    property_zip?: string
    property_city?: string
    property_type?: string
    surface_area?: number
    construction_year?: number
    last_renovation_year?: number
    energy_class?: string
    ges_class?: string
    purchase_price?: number
    purchase_date?: string
    current_value?: number
    property_tax?: number
    start_date?: string
    end_date?: string
    monthly_rent?: number
    charges?: number
    deposit?: number
    payment_day?: number
    indexation_clause?: string
    special_clauses: string[]
    raw_text?: string
}

/**
 * Complete parsing result
 */
export interface ParsingResult {
    id: string
    document_id: string
    status: ParsingStatus
    provider: OCRProvider

    // OCR results
    ocr_text?: string
    ocr_confidence: number
    page_count: number
    language: string
    is_scanned: boolean

    // Extracted fields
    fields: FieldExtraction[]
    lease_data?: ExtractedLeaseData

    // Validation
    overall_confidence: number
    requires_review: boolean
    review_notes?: string

    // Metadata
    processing_time_ms?: number
    error_message?: string
    created_at: string
    updated_at: string
    validated_at?: string
    validated_by?: string
}

/**
 * Request to start parsing
 */
export interface ParsingRequest {
    document_id: string
    organization_id: string
    provider?: OCRProvider
    force_reprocess?: boolean
    auto_create_entities?: boolean // Create lease, tenant, property automatically
}

/**
 * Prompt template for LLM extraction
 */
export interface ExtractionPrompt {
    name: string
    description: string
    system_prompt: string
    user_prompt_template: string
    output_schema: Record<string, any>
}
