// Alert Types for AImmo - Phase 8

/**
 * Alert type categories
 */
export enum AlertType {
    UNPAID = "unpaid",           // Loyer impayé
    RENEWAL = "renewal",         // Renouvellement de bail
    INDEXATION = "indexation",   // Indexation annuelle
    DOCUMENT = "document",       // Document à fournir/renouveler
    MAINTENANCE = "maintenance", // Maintenance requise
    VACANCY = "vacancy",         // Vacance locative
    INSURANCE = "insurance",     // Assurance à renouveler
    CUSTOM = "custom",           // Alerte personnalisée
}

/**
 * Alert priority levels
 */
export enum AlertPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent",
}

/**
 * Alert status
 */
export enum AlertStatus {
    PENDING = "pending",     // Non traitée
    ACKNOWLEDGED = "acknowledged", // Vue mais pas traitée
    IN_PROGRESS = "in_progress",   // En cours de traitement
    RESOLVED = "resolved",   // Résolue
    DISMISSED = "dismissed", // Ignorée
    SNOOZED = "snoozed",     // Reportée
}

/**
 * Alert entity reference
 */
export interface AlertReference {
    entity_type: "property" | "lease" | "tenant" | "document"
    entity_id: string
    entity_name: string
}

/**
 * Main Alert interface
 */
export interface Alert {
    id: string
    organization_id: string
    type: AlertType
    priority: AlertPriority
    status: AlertStatus
    title: string
    message: string
    reference?: AlertReference
    amount?: number          // For unpaid alerts
    due_date?: string        // Date d'échéance
    snooze_until?: string    // Si reportée
    action_url?: string      // Lien vers l'action
    metadata?: Record<string, unknown>
    created_at: string
    updated_at: string
    acknowledged_at?: string
    resolved_at?: string
    created_by?: string
}

/**
 * Alert creation request
 */
export interface AlertCreateRequest {
    type: AlertType
    priority: AlertPriority
    title: string
    message: string
    reference?: AlertReference
    amount?: number
    due_date?: string
    action_url?: string
    metadata?: Record<string, unknown>
}

/**
 * Alert update request
 */
export interface AlertUpdateRequest {
    status?: AlertStatus
    priority?: AlertPriority
    snooze_until?: string
    metadata?: Record<string, unknown>
}

/**
 * Alert filters for listing
 */
export interface AlertFilters {
    types?: AlertType[]
    priorities?: AlertPriority[]
    statuses?: AlertStatus[]
    from_date?: string
    to_date?: string
    property_id?: string
    lease_id?: string
    tenant_id?: string
}

/**
 * Alert statistics
 */
export interface AlertStats {
    total: number
    by_type: Record<AlertType, number>
    by_priority: Record<AlertPriority, number>
    by_status: Record<AlertStatus, number>
    urgent_count: number
    pending_amount: number  // Total des montants impayés
}

/**
 * Alert notification preferences
 */
export interface AlertPreferences {
    email_enabled: boolean
    push_enabled: boolean
    sms_enabled: boolean
    types_enabled: AlertType[]
    minimum_priority: AlertPriority
    quiet_hours_start?: string  // HH:mm
    quiet_hours_end?: string    // HH:mm
}
