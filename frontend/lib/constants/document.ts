import { DocumentType } from "@/lib/types/document"

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.BAIL]: "Bail",
  [DocumentType.FACTURE]: "Facture",
  [DocumentType.AVIS_ECHEANCE]: "Avis d'échéance",
  [DocumentType.DIAGNOSTIC]: "Diagnostic",
  [DocumentType.RAPPORT_FINANCIER]: "Rapport financier",
  [DocumentType.AUTRE]: "Autre",
}

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
]

export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
]

export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase()
}

export function isFileTypeAllowed(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type) || 
         ALLOWED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
}
