"use client"

import { useState, useCallback } from "react"
import { processingService } from "@/lib/services/processing-service"
import { useAuthStore } from "@/lib/store/auth-store"
import {
    type ParsingResult,
    type ParsingStatus,
    type FieldExtraction,
    type ExtractedLeaseData,
    ConfidenceLevel,
} from "@/lib/types/parsing"
import type {
    ValidationRequest,
    EntityCreationResult,
    OCRProvider,
    ParsedLease,
} from "@/lib/types/processing"
import { calculateOverallConfidence, requiresReview } from "@/lib/llm-parser"

interface UseParsingOptions {
    onSuccess?: (result: ParsingResult) => void
    onError?: (error: string) => void
}

/**
 * Convert ParsedLease to ExtractedLeaseData
 */
function convertToExtractedLeaseData(parsed?: ParsedLease): ExtractedLeaseData | undefined {
    if (!parsed) return undefined

    return {
        parties: parsed.parties.map(p => ({
            ...p,
            type: p.type as "landlord" | "tenant" | "guarantor" | "other",
            confidence: 0.8,
        })),
        property_address: parsed.property_address,
        property_zip: (parsed as any).property_zip,
        property_city: (parsed as any).property_city,
        property_type: parsed.property_type,
        surface_area: parsed.surface_area,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        monthly_rent: parsed.monthly_rent,
        charges: parsed.charges,
        deposit: parsed.deposit,
        special_clauses: parsed.key_clauses || [],
    }
}

/**
 * Hook for OCR → parsing → validation pipeline
 */
export function useParsing(options: UseParsingOptions = {}) {
    const { currentOrganizationId } = useAuthStore()
    const [result, setResult] = useState<ParsingResult | null>(null)
    const [status, setStatus] = useState<ParsingStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    /**
     * Start parsing a document
     */
    /**
     * Helper to populate fields for UI from structured data
     */
    const populateFieldsFromLeaseData = (data: ExtractedLeaseData): FieldExtraction[] => {
        return [
            {
                name: "property_address",
                label: "Adresse du bien",
                value: data.property_address ?? null,
                type: "string",
                confidence: 0.9,
                confidence_level: ConfidenceLevel.HIGH,
                is_validated: false
            },
            {
                name: "monthly_rent",
                label: "Loyer mensuel",
                value: data.monthly_rent ?? null,
                type: "currency",
                confidence: 0.8,
                confidence_level: ConfidenceLevel.MEDIUM,
                is_validated: false
            },
            {
                name: "charges",
                label: "Charges",
                value: data.charges ?? null,
                type: "currency",
                confidence: 0.8,
                confidence_level: ConfidenceLevel.MEDIUM,
                is_validated: false
            },
            {
                name: "start_date",
                label: "Date de début",
                value: data.start_date ?? null,
                type: "date",
                confidence: 0.9,
                confidence_level: ConfidenceLevel.HIGH,
                is_validated: false
            },
            {
                name: "surface_area",
                label: "Surface",
                value: data.surface_area ?? null,
                type: "number",
                confidence: 0.8,
                confidence_level: ConfidenceLevel.MEDIUM,
                is_validated: false
            }
        ]
    }

    /**
     * Start parsing a document
     */
    const startParsing = useCallback(async (
        documentId: string,
        provider: OCRProvider = "hybrid" as OCRProvider
    ) => {
        if (!currentOrganizationId) {
            setError("No organization selected")
            return null
        }

        setLoading(true)
        setError(null)
        setProgress(0)
        setStatus("pending" as ParsingStatus)

        try {
            // Step 1: Start processing
            setProgress(10)

            setStatus("ocr_processing" as ParsingStatus)
            setProgress(30)

            // Call processing service
            const processingResult = await processingService.processDocument({
                document_id: documentId,
                organization_id: currentOrganizationId,
                ocr_provider: provider,
            })

            setProgress(70)
            setStatus("parsing" as ParsingStatus)

            const leaseData = convertToExtractedLeaseData(processingResult.parsed_lease)
            const initialFields = leaseData ? populateFieldsFromLeaseData(leaseData) : []

            // Convert to our ParsingResult format
            const parsingResult: ParsingResult = {
                id: processingResult.id,
                document_id: documentId,
                status: "review" as ParsingStatus,
                provider: provider,
                ocr_text: processingResult.ocr_result?.text,
                ocr_confidence: processingResult.ocr_result?.confidence ?? 0,
                page_count: processingResult.ocr_result?.page_count ?? 1,
                language: processingResult.ocr_result?.language ?? "fr",
                is_scanned: processingResult.ocr_result?.is_scanned ?? false,
                fields: initialFields,
                lease_data: leaseData,
                overall_confidence: processingResult.parsed_lease?.confidence ?? 0,
                requires_review: true,
                created_at: processingResult.created_at,
                updated_at: processingResult.updated_at,
            }

            // Calculate confidence
            if (parsingResult.fields.length > 0) {
                parsingResult.overall_confidence = calculateOverallConfidence(parsingResult.fields)
                parsingResult.requires_review = requiresReview(parsingResult.fields)
            }

            setProgress(100)
            setStatus("review" as ParsingStatus)
            setResult(parsingResult)
            options.onSuccess?.(parsingResult)

            return parsingResult
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Parsing failed"
            setError(errorMessage)
            setStatus("failed" as ParsingStatus)
            options.onError?.(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId, options])

    /**
     * Update a field value during review
     */
    const updateField = useCallback((fieldName: string, value: any) => {
        setResult(prev => {
            if (!prev) return null

            // Update UI fields
            const newFields = prev.fields.map(f =>
                f.name === fieldName
                    ? { ...f, value, is_validated: true }
                    : f
            )

            // Update structured data (lease_data) to match
            const newLeaseData = prev.lease_data ? { ...prev.lease_data } : undefined
            if (newLeaseData) {
                // Map field names back to lease_data keys
                if (fieldName in newLeaseData) {
                    (newLeaseData as any)[fieldName] = value
                }
            }

            return {
                ...prev,
                fields: newFields,
                lease_data: newLeaseData
            }
        })
    }, [])

    /**
     * Update party details
     */
    const updateParty = useCallback((index: number, party: any) => {
        setResult(prev => {
            if (!prev || !prev.lease_data) return null

            const newParties = [...prev.lease_data.parties]
            newParties[index] = { ...newParties[index], ...party }

            return {
                ...prev,
                lease_data: {
                    ...prev.lease_data,
                    parties: newParties
                }
            }
        })
    }, [])

    /**
     * Add a new party
     */
    const addParty = useCallback((type: "landlord" | "tenant") => {
        setResult(prev => {
            if (!prev || !prev.lease_data) return null

            const newParty: any = {
                type,
                name: "",
                confidence: 1.0,
            }

            return {
                ...prev,
                lease_data: {
                    ...prev.lease_data,
                    parties: [...prev.lease_data.parties, newParty]
                }
            }
        })
    }, [])

    /**
     * Remove a party
     */
    const removeParty = useCallback((index: number) => {
        setResult(prev => {
            if (!prev || !prev.lease_data) return null

            const newParties = [...prev.lease_data.parties]
            newParties.splice(index, 1)

            return {
                ...prev,
                lease_data: {
                    ...prev.lease_data,
                    parties: newParties
                }
            }
        })
    }, [])

    /**
     * Convert ExtractedLeaseData back to ParsedLease for API
     */
    const convertToParsedLease = (data: ExtractedLeaseData): ParsedLease => {
        return {
            parties: data.parties.map(p => ({
                type: p.type as "landlord" | "tenant", // Keep as general string if needed but ParsedLease usually expects strict enum
                name: p.name,
                address: p.address,
                email: p.email,
                phone: p.phone,
                company_name: p.company_name,
                siret: p.siret,
            })),
            property_address: data.property_address || "",
            property_city: data.property_city,
            property_zip: data.property_zip,
            property_type: data.property_type,
            surface_area: data.surface_area,
            start_date: data.start_date,
            end_date: data.end_date,
            monthly_rent: data.monthly_rent,
            charges: data.charges,
            deposit: data.deposit,
            key_clauses: data.special_clauses,
            confidence: 1.0, // User validated
            raw_data: {},
        }
    }

    /**
     * Validate all fields and optionally create entities
     */
    const validateAndComplete = useCallback(async (
        createEntities: boolean = false
    ): Promise<EntityCreationResult | null> => {
        if (!result || !currentOrganizationId || !result.lease_data) {
            setError("No parsing result to validate")
            return null
        }

        setLoading(true)
        setError(null)

        try {
            const validationRequest: ValidationRequest = {
                processing_id: result.id,
                organization_id: currentOrganizationId,
                validated_data: convertToParsedLease(result.lease_data),
                create_entities: createEntities,
            }

            const entityResult = await processingService.validateAndCreate(validationRequest)

            setStatus("completed" as ParsingStatus)
            setResult(prev => prev ? { ...prev, status: "completed" as ParsingStatus } : null)

            return entityResult
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Validation failed"
            setError(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }, [result, currentOrganizationId])

    /**
     * Reset parsing state
     */
    const reset = useCallback(() => {
        setResult(null)
        setStatus(null)
        setLoading(false)
        setError(null)
        setProgress(0)
    }, [])

    return {
        // State
        result,
        status,
        loading,
        error,
        progress,

        // Actions
        startParsing,
        updateField,
        updateParty,
        addParty,
        removeParty,
        validateAndComplete,
        reset,

        // Computed
        isComplete: status === "completed",
        needsReview: result?.requires_review ?? false,
    }
}
