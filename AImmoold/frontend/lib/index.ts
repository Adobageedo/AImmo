// Main lib barrel export
// Re-export commonly used modules for easier imports

// Hooks
export * from "./hooks"

// Services
export { authService } from "./services/auth-service"
export { documentService } from "./services/document-service"
export { processingService } from "./services/processing-service"

// Store
export { useAuthStore } from "./store/auth-store"

// Supabase clients
export { createClient as createSupabaseClient } from "./supabase/client"

// Utils
export { cn } from "./utils"

// Constants
export {
    APP_NAME,
    APP_DESCRIPTION,
    API_URL,
    DATE_FORMAT,
    PAGINATION,
    DEBOUNCE,
    STORAGE_KEYS,
} from "./constants/app"

// Re-export types (use type imports)
export type {
    User,
    Organization,
    AuthSession,
    LoginCredentials,
    SignupCredentials,
    AuthResponse,
} from "./types/auth"

export type {
    Document,
    DocumentType,
    FileType,
    DocumentUploadRequest,
    DocumentUpdateRequest,
    OrganizationQuota,
} from "./types/document"

export type {
    DocumentProcessing,
    ProcessingRequest,
    ProcessingStatus,
    OCRProvider,
    OCRResult,
    ParsedLease,
} from "./types/processing"
