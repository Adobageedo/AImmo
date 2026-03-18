// Dashboard Types - Phase 7: Portfolio Dashboard MVP

export interface DashboardKPIs {
    // Properties KPIs
    totalProperties: number
    propertiesByType: Record<string, number>
    totalSurfaceArea: number
    totalEstimatedValue: number

    // Occupancy KPIs
    occupancyRate: number
    vacancyRate: number
    occupiedUnits: number
    vacantUnits: number

    // Financial KPIs
    totalMonthlyRent: number
    totalAnnualRent: number
    totalCharges: number
    totalDeposits: number
    averageRentPerSqm: number
    grossYield: number

    // Tenants KPIs
    totalTenants: number
    tenantsByType: Record<string, number>

    // Leases KPIs
    totalLeases: number
    activeLeases: number
    expiringSoonLeases: number // Expiring within 90 days
    expiredLeases: number

    // Documents KPIs
    totalDocuments: number
    documentsByType: Record<string, number>

    // Time-based metrics
    lastUpdated: string
}

export interface PropertyLocation {
    id: string
    name: string
    address: string
    city: string
    postalCode: string
    country: string
    latitude?: number
    longitude?: number
    propertyType: string
    surfaceArea?: number
    estimatedValue?: number
    occupancyStatus: "occupied" | "vacant" | "partial"
    monthlyRent?: number
}

export interface ChartDataPoint {
    label: string
    value: number
    color?: string
    percentage?: number
}

export interface TimeSeriesDataPoint {
    date: string
    value: number
    label?: string
}

export interface DashboardFilters {
    organizationId?: string
    propertyType?: string
    city?: string
    dateRange?: {
        start: string
        end: string
    }
    occupancyStatus?: "occupied" | "vacant" | "all"
}

export interface DashboardState {
    kpis: DashboardKPIs | null
    properties: PropertyLocation[]
    isLoading: boolean
    error: string | null
    filters: DashboardFilters
    lastRefresh: string | null
}

// Chart configurations
export type ChartType = "bar" | "line" | "pie" | "doughnut" | "area"

export interface ChartConfig {
    type: ChartType
    title: string
    data: ChartDataPoint[] | TimeSeriesDataPoint[]
    colors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    animated?: boolean
}

// KPI Card variants
export type KpiVariant = "default" | "highlight" | "warning" | "success" | "danger"

export interface KpiCardConfig {
    id: string
    title: string
    value: string | number
    unit?: string
    description?: string
    trend?: {
        value: number
        period: string
        positive: boolean
    }
    variant?: KpiVariant
    icon?: string
    href?: string
}

// Geographic data for map
export interface GeoRegion {
    name: string
    propertyCount: number
    totalValue: number
    occupancyRate: number
    coordinates?: {
        lat: number
        lng: number
    }
}

// Dashboard summary for quick overview
export interface DashboardSummary {
    portfolioValue: number
    annualRevenue: number
    averageOccupancy: number
    performanceScore: number // 0-100
}
