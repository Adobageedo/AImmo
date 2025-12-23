import { ProcessingStatus, OCRProvider } from "@/lib/types/processing"

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  [ProcessingStatus.PENDING]: "En attente",
  [ProcessingStatus.PROCESSING]: "Traitement en cours...",
  [ProcessingStatus.COMPLETED]: "Terminé",
  [ProcessingStatus.FAILED]: "Échec",
  [ProcessingStatus.VALIDATED]: "Validé",
}

export const PROCESSING_STATUS_COLORS: Record<ProcessingStatus, string> = {
  [ProcessingStatus.PENDING]: "text-yellow-600",
  [ProcessingStatus.PROCESSING]: "text-blue-600",
  [ProcessingStatus.COMPLETED]: "text-green-600",
  [ProcessingStatus.FAILED]: "text-red-600",
  [ProcessingStatus.VALIDATED]: "text-purple-600",
}

export const OCR_PROVIDER_LABELS: Record<OCRProvider, string> = {
  [OCRProvider.TESSERACT]: "Tesseract OCR",
  [OCRProvider.GPT_VISION]: "GPT-4 Vision",
  [OCRProvider.HYBRID]: "Hybride (Auto)",
}
