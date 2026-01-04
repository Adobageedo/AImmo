// Hooks Barrel Export
export { useAuth } from "./use-auth"
export { useDocumentOperations } from "./use-documents"
export { useDisclosure } from "./use-disclosure"
export { useSearch } from "./use-search"
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "./use-media-query"
export { useAsync } from "./use-async"
export { useParsing } from "./use-parsing"
export { useChatMvp as useChat } from "./use-chat-mvp"
export { useDashboard } from "./use-dashboard"
export { useAlerts, useAlertPreferences } from "./use-alerts"
export { useNewsletter } from "./use-newsletter"

// Entity Hooks - Phase 6
export { useEntity } from "./use-entity"
export type { UseEntityOptions, UseEntityResult } from "./use-entity"
export { useProperties } from "./use-properties"
export type { UsePropertiesOptions, UsePropertiesResult } from "./use-properties"
export { useOwners } from "./use-owners"
export type {
    UseOwnersOptions,
    UseOwnersResult,
} from "./use-owners"

export { useEntityDocuments } from "./use-entity-documents"
export type {
    EntityDocument,
    UseEntityDocumentsOptions,
    UseEntityDocumentsReturn,
} from "./use-entity-documents"
export { useTenants } from "./use-tenants"
export type { UseTenantsOptions, UseTenantsResult } from "./use-tenants"
export { useLeases } from "./use-leases"
export type { UseLeasesOptions, UseLeasesResult } from "./use-leases"
