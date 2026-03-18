/**
 * LLM Parser Utilities
 * Helpers for processing LLM extraction results
 */

import type {
    FieldExtraction,
    ExtractedLeaseData,
    ExtractedParty,
    ExtractionPrompt
} from "@/lib/types/parsing"
import { getConfidenceLevel } from "./ocr"

/**
 * Field definitions for lease extraction
 */
export const LEASE_FIELD_DEFINITIONS: Record<string, {
    label: string
    type: FieldExtraction["type"]
    required: boolean
}> = {
    property_address: {
        label: "Adresse du bien",
        type: "string",
        required: true,
    },
    property_type: {
        label: "Type de bien",
        type: "string",
        required: false,
    },
    surface_area: {
        label: "Surface (m²)",
        type: "number",
        required: false,
    },
    start_date: {
        label: "Date de début",
        type: "date",
        required: true,
    },
    end_date: {
        label: "Date de fin",
        type: "date",
        required: false,
    },
    monthly_rent: {
        label: "Loyer mensuel",
        type: "currency",
        required: true,
    },
    charges: {
        label: "Charges",
        type: "currency",
        required: false,
    },
    deposit: {
        label: "Dépôt de garantie",
        type: "currency",
        required: false,
    },
    payment_day: {
        label: "Jour de paiement",
        type: "number",
        required: false,
    },
}

/**
 * Party type labels in French
 */
export const PARTY_TYPE_LABELS: Record<ExtractedParty["type"], string> = {
    landlord: "Bailleur",
    tenant: "Locataire",
    guarantor: "Garant",
    other: "Autre",
}

/**
 * Convert raw LLM output to FieldExtraction array
 */
export function parseLeaseFields(
    rawData: Record<string, any>
): FieldExtraction[] {
    const fields: FieldExtraction[] = []

    for (const [key, definition] of Object.entries(LEASE_FIELD_DEFINITIONS)) {
        const value = rawData[key]
        const confidence = rawData[`${key}_confidence`] ?? 0.5

        fields.push({
            name: key,
            label: definition.label,
            value: value ?? null,
            type: definition.type,
            confidence,
            confidence_level: getConfidenceLevel(confidence),
            is_validated: false,
        })
    }

    return fields
}

/**
 * Calculate overall confidence from field extractions
 */
export function calculateOverallConfidence(fields: FieldExtraction[]): number {
    if (fields.length === 0) return 0

    const requiredFields = fields.filter(f => {
        const def = LEASE_FIELD_DEFINITIONS[f.name]
        return def?.required
    })

    if (requiredFields.length === 0) {
        return fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
    }

    // Weight required fields more heavily
    const requiredAvg = requiredFields.reduce((sum, f) => sum + f.confidence, 0) / requiredFields.length
    const allAvg = fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length

    return requiredAvg * 0.7 + allAvg * 0.3
}

/**
 * Check if result requires manual review
 */
export function requiresReview(fields: FieldExtraction[]): boolean {
    // Check if any required field has low confidence
    for (const field of fields) {
        const def = LEASE_FIELD_DEFINITIONS[field.name]
        if (def?.required && field.confidence < 0.7) {
            return true
        }
    }

    // Check if any field has very low confidence
    return fields.some(f => f.confidence < 0.5)
}

/**
 * Format field value for display
 */
export function formatFieldValue(field: FieldExtraction): string {
    if (field.value === null || field.value === undefined) {
        return "—"
    }

    switch (field.type) {
        case "currency":
            return new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
            }).format(Number(field.value))

        case "date":
            if (typeof field.value === "string") {
                const date = new Date(field.value)
                return date.toLocaleDateString("fr-FR")
            }
            return String(field.value)

        case "number":
            return new Intl.NumberFormat("fr-FR").format(Number(field.value))

        case "boolean":
            return field.value ? "Oui" : "Non"

        default:
            return String(field.value)
    }
}

/**
 * Validate field value
 */
export function validateField(field: FieldExtraction): string | null {
    const def = LEASE_FIELD_DEFINITIONS[field.name]

    // Check required
    if (def?.required && (field.value === null || field.value === "")) {
        return "Ce champ est obligatoire"
    }

    // Type-specific validation
    switch (field.type) {
        case "currency":
        case "number":
            if (field.value !== null && isNaN(Number(field.value))) {
                return "Valeur numérique invalide"
            }
            if (field.type === "currency" && Number(field.value) < 0) {
                return "Le montant ne peut pas être négatif"
            }
            break

        case "date":
            if (field.value !== null) {
                const date = new Date(String(field.value))
                if (isNaN(date.getTime())) {
                    return "Date invalide"
                }
            }
            break
    }

    return null
}

/**
 * Default lease extraction prompt
 */
export const LEASE_EXTRACTION_PROMPT: ExtractionPrompt = {
    name: "lease_extraction",
    description: "Extraction des données d'un bail de location",
    system_prompt: `Tu es un assistant spécialisé dans l'extraction de données à partir de contrats de bail immobilier français.
Tu dois extraire les informations de manière structurée et précise.
Pour chaque champ, fournis également un score de confiance entre 0 et 1.
Réponds uniquement en JSON valide.`,
    user_prompt_template: `Extrais les informations suivantes du bail ci-dessous:

TEXTE DU BAIL:
{{text}}

Extrais les champs suivants:
- property_address: Adresse complète du bien
- property_type: Type de bien (appartement, maison, studio, etc.)
- surface_area: Surface en m²
- start_date: Date de début du bail (format YYYY-MM-DD)
- end_date: Date de fin du bail (format YYYY-MM-DD)
- monthly_rent: Loyer mensuel hors charges en euros
- charges: Montant des charges en euros
- deposit: Montant du dépôt de garantie en euros
- payment_day: Jour du mois pour le paiement
- parties: Liste des parties (bailleur, locataire) avec nom, adresse, email
- special_clauses: Liste des clauses particulières

Pour chaque champ, ajoute un champ {field}_confidence avec un score de 0 à 1.`,
    output_schema: {
        type: "object",
        properties: {
            property_address: { type: "string" },
            property_address_confidence: { type: "number" },
            // ... other fields
        },
    },
}

/**
 * Parse parties from LLM output
 */
export function parseParties(
    rawParties: any[]
): ExtractedParty[] {
    if (!Array.isArray(rawParties)) return []

    return rawParties.map(p => ({
        type: p.type || "other",
        name: p.name || "",
        address: p.address,
        email: p.email,
        confidence: p.confidence ?? 0.5,
    }))
}
