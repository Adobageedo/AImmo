/**
 * Generic Entity Types for Properties, Tenants, Leases
 * Phase 6 - Business UI Foundation
 */

// ============================================
// PROPERTY TYPES
// ============================================

export enum PropertyType {
    APARTMENT = "apartment",
    HOUSE = "house",
    STUDIO = "studio",
    COMMERCIAL = "commercial",
    PARKING = "parking",
    STORAGE = "storage",
    LAND = "land",
    OTHER = "other",
}

export enum PropertyStatus {
    AVAILABLE = "available",
    RENTED = "rented",
    UNDER_RENOVATION = "under_renovation",
    FOR_SALE = "for_sale",
    SOLD = "sold",
}

export interface PropertyAddress {
    street: string
    city: string
    postal_code: string
    country: string
    building?: string
    floor?: number
    door?: string
}

export interface Property {
    id: string
    name: string
    description?: string
    property_type: PropertyType
    status: PropertyStatus
    address: PropertyAddress
    surface_m2: number
    rooms?: number
    bedrooms?: number
    bathrooms?: number
    has_parking?: boolean
    has_cellar?: boolean
    has_balcony?: boolean
    has_garden?: boolean
    construction_year?: number
    last_renovation_year?: number
    energy_class?: string
    ges_class?: string
    purchase_price?: number
    purchase_date?: string
    current_value?: number
    monthly_charges?: number
    property_tax?: number
    organization_id: string
    created_at: string
    updated_at: string
    // Computed fields
    current_lease_id?: string
    current_tenant_id?: string
    monthly_rent?: number
    yield_percentage?: number
}

export interface PropertyCreateRequest {
    name: string
    description?: string
    property_type: PropertyType
    status?: PropertyStatus
    address: PropertyAddress
    surface_m2: number
    rooms?: number
    bedrooms?: number
    bathrooms?: number
    has_parking?: boolean
    has_cellar?: boolean
    has_balcony?: boolean
    has_garden?: boolean
    construction_year?: number
    purchase_price?: number
    purchase_date?: string
    current_value?: number
    monthly_charges?: number
    property_tax?: number
    organization_id: string
}

export interface PropertyUpdateRequest extends Partial<PropertyCreateRequest> {
    id?: never
    organization_id?: never
    created_at?: never
    updated_at?: never
}

// ============================================
// TENANT TYPES
// ============================================

export enum TenantType {
    INDIVIDUAL = "individual",
    COMPANY = "company",
    ASSOCIATION = "association",
}

export enum TenantStatus {
    ACTIVE = "active",
    PAST = "past",
    PROSPECT = "prospect",
}

export interface TenantContact {
    email: string
    phone?: string
    phone_secondary?: string
}

export interface Tenant {
    id: string
    name: string
    tenant_type: TenantType
    status: TenantStatus
    email?: string
    phone?: string
    company_name?: string
    address?: string
    date_of_birth?: string
    place_of_birth?: string
    nationality?: string
    profession?: string
    employer?: string
    monthly_income?: number
    guarantor_name?: string
    guarantor_contact?: string
    notes?: string
    organization_id: string
    created_at: string
    updated_at: string
    // Computed fields
    current_lease_id?: string
    current_property_id?: string
    total_paid?: number
    outstanding_balance?: number
}

export interface TenantCreateRequest {
    name: string
    company_name?: string
    tenant_type: TenantType
    status?: TenantStatus
    email: string
    phone?: string
    address?: string
    date_of_birth?: string
    place_of_birth?: string
    nationality?: string
    profession?: string
    employer?: string
    monthly_income?: number
    guarantor_name?: string
    guarantor_contact?: string
    notes?: string
    organization_id: string
}

export interface TenantUpdateRequest extends Partial<TenantCreateRequest> {
    id?: string
}

// ============================================
// LEASE TYPES
// ============================================

export enum LeaseType {
    UNFURNISHED = "unfurnished", // Location vide
    FURNISHED = "furnished", // Location meublée
    COMMERCIAL = "commercial", // Bail commercial
    PROFESSIONAL = "professional", // Bail professionnel
    SEASONAL = "seasonal", // Location saisonnière
    STUDENT = "student", // Bail étudiant
    MOBILITY = "mobility", // Bail mobilité
}

export enum LeaseStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    EXPIRED = "expired",
    TERMINATED = "terminated",
    RENEWED = "renewed",
}

export enum PaymentFrequency {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUALLY = "annually",
}

export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    PARTIAL = "partial",
    LATE = "late",
    UNPAID = "unpaid",
}

export interface LeasePayment {
    id: string
    lease_id: string
    due_date: string
    period_start: string
    period_end: string
    rent_amount: number
    charges_amount: number
    total_amount: number
    paid_amount: number
    payment_date?: string
    payment_method?: string
    status: PaymentStatus
    notes?: string
    created_at: string
}

export interface Lease {
    id: string
    reference: string
    property_id: string
    tenant_id: string
    lease_type: LeaseType
    status: LeaseStatus
    start_date: string
    end_date?: string
    duration_months: number
    rent_amount: number
    charges_amount: number
    total_monthly: number
    deposit_amount: number
    deposit_paid: boolean
    payment_frequency: PaymentFrequency
    payment_day: number // Day of month for payment
    rent_revision_date?: string
    rent_revision_index?: string // IRL, ICC, etc.
    insurance_required: boolean
    insurance_provided: boolean
    special_clauses?: string
    notes?: string
    organization_id: string
    created_at: string
    updated_at: string
    // Computed/joined fields
    property?: Property
    tenant?: Tenant
    payments?: LeasePayment[]
    next_payment_date?: string
    payment_status?: PaymentStatus
    total_collected?: number
    outstanding_amount?: number
}

export interface LeaseCreateRequest {
    reference?: string
    property_id: string
    tenant_id: string
    lease_type: LeaseType
    status?: LeaseStatus
    start_date: string
    end_date?: string
    duration_months: number
    rent_amount: number
    charges_amount: number
    deposit_amount: number
    payment_frequency?: PaymentFrequency
    payment_day?: number
    rent_revision_date?: string
    rent_revision_index?: string
    insurance_required?: boolean
    special_clauses?: string
    notes?: string
    organization_id: string
}

export interface LeaseUpdateRequest extends Partial<LeaseCreateRequest> {
    id?: never
    organization_id?: never
    created_at?: never
    updated_at?: never
}

// ============================================
// GENERIC ENTITY TYPES
// ============================================

export type EntityType = "property" | "tenant" | "lease" | "document" | "payment"

export interface BaseEntity {
    id: string
    organization_id: string
    created_at: string
    updated_at: string
}

export interface EntityConfig<T extends BaseEntity> {
    entityType: EntityType
    singularName: string
    pluralName: string
    icon: React.ComponentType<{ className?: string }>
    getTitle: (entity: T) => string
    getSubtitle: (entity: T) => string
    getStatus?: (entity: T) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    getBadges?: (entity: T) => Array<{ label: string; variant?: string }>
    columns: EntityColumn<T>[]
    searchFields: (keyof T)[]
    sortOptions: Array<{ label: string; value: keyof T; direction: "asc" | "desc" }>
    filterOptions?: EntityFilterOption[]
    actions?: EntityAction<T>[]
}

export interface EntityColumn<T> {
    key: keyof T | string
    label: string
    render?: (entity: T) => React.ReactNode
    sortable?: boolean
    width?: string
    align?: "left" | "center" | "right"
    hideOnMobile?: boolean
}

export interface EntityFilterOption {
    key: string
    label: string
    type: "select" | "date" | "range" | "search"
    options?: Array<{ label: string; value: string }>
}

export interface EntityAction<T> {
    key: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: (entity: T) => void
    variant?: "default" | "danger"
    condition?: (entity: T) => boolean
}

// ============================================
// STATISTICS & KPI TYPES
// ============================================

export interface PropertyStats {
    total_properties: number
    total_surface_m2: number
    properties_by_status: Record<PropertyStatus, number>
    properties_by_type: Record<PropertyType, number>
    average_rent: number
    total_monthly_revenue: number
    average_yield: number
    occupancy_rate: number
}

export interface TenantStats {
    total_tenants: number
    tenants_by_status: Record<TenantStatus, number>
    average_lease_duration: number
    total_outstanding: number
}

export interface LeaseStats {
    total_leases: number
    active_leases: number
    leases_by_status: Record<LeaseStatus, number>
    leases_by_type: Record<LeaseType, number>
    total_monthly_rent: number
    total_collected_this_month: number
    collection_rate: number
    upcoming_renewals: number
    upcoming_expirations: number
}

export interface FinancialSummary {
    total_revenue: number
    total_expenses: number
    net_income: number
    outstanding_rent: number
    average_yield: number
    month_over_month_change: number
}
