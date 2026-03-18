/**
 * OCR Utilities
 * Client-side helpers for OCR processing
 */

import { OCRProvider, ConfidenceLevel } from "@/lib/types/parsing"

/**
 * Get confidence level from numeric confidence score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.9) return ConfidenceLevel.HIGH
    if (confidence >= 0.7) return ConfidenceLevel.MEDIUM
    if (confidence >= 0.5) return ConfidenceLevel.LOW
    return ConfidenceLevel.UNCERTAIN
}

/**
 * Get color class for confidence level
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
    switch (level) {
        case ConfidenceLevel.HIGH:
            return "text-green-600 bg-green-50"
        case ConfidenceLevel.MEDIUM:
            return "text-yellow-600 bg-yellow-50"
        case ConfidenceLevel.LOW:
            return "text-orange-600 bg-orange-50"
        case ConfidenceLevel.UNCERTAIN:
            return "text-red-600 bg-red-50"
    }
}

/**
 * Get French label for confidence level
 */
export function getConfidenceLabel(level: ConfidenceLevel): string {
    switch (level) {
        case ConfidenceLevel.HIGH:
            return "Haute confiance"
        case ConfidenceLevel.MEDIUM:
            return "Confiance moyenne"
        case ConfidenceLevel.LOW:
            return "Faible confiance"
        case ConfidenceLevel.UNCERTAIN:
            return "À vérifier"
    }
}

/**
 * Get French label for OCR provider
 */
export function getProviderLabel(provider: OCRProvider): string {
    switch (provider) {
        case OCRProvider.TESSERACT:
            return "Tesseract OCR"
        case OCRProvider.GPT_VISION:
            return "GPT-4 Vision"
        case OCRProvider.HYBRID:
            return "Hybride (Auto)"
    }
}

/**
 * Recommended provider based on document type
 */
export function getRecommendedProvider(
    fileType: string,
    isScanned: boolean
): OCRProvider {
    // For scanned documents, hybrid is best
    if (isScanned) {
        return OCRProvider.HYBRID
    }

    // For images, GPT Vision is usually better
    if (["jpg", "jpeg", "png", "gif"].includes(fileType.toLowerCase())) {
        return OCRProvider.GPT_VISION
    }

    // For PDFs, Tesseract is usually sufficient and faster
    return OCRProvider.TESSERACT
}

/**
 * Estimate processing time based on page count and provider
 */
export function estimateProcessingTime(
    pageCount: number,
    provider: OCRProvider
): number {
    const baseTime = provider === OCRProvider.GPT_VISION ? 5000 : 2000 // ms per page
    const overhead = 3000 // Initial setup time

    return overhead + (pageCount * baseTime)
}

/**
 * Format processing time for display
 */
export function formatProcessingTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.ceil(ms / 60000)}min`
}

/**
 * Check if document needs OCR (is scanned/image)
 */
export function needsOCR(fileType: string): boolean {
    const imageTypes = ["jpg", "jpeg", "png", "gif", "tiff", "bmp"]
    return imageTypes.includes(fileType.toLowerCase())
}

/**
 * Supported file types for OCR
 */
export const SUPPORTED_OCR_TYPES = [
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "tiff",
    "bmp",
]

/**
 * Check if file type is supported for OCR
 */
export function isOCRSupported(fileType: string): boolean {
    return SUPPORTED_OCR_TYPES.includes(fileType.toLowerCase())
}
