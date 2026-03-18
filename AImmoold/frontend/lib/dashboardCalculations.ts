// Dashboard Calculations - Phase 7: Portfolio Dashboard MVP
// Fonctions de calcul pour performances, taux d'occupation, rendements

import type {
    DashboardKPIs,
    PropertyLocation,
    ChartDataPoint,
    DashboardSummary,
    GeoRegion,
} from "./types/dashboard"

// ============================================
// OCCUPANCY CALCULATIONS
// ============================================

/**
 * Calculate occupancy rate based on leases and properties
 * @param occupiedUnits Number of units with active leases
 * @param totalUnits Total number of units/properties
 * @returns Occupancy rate as percentage (0-100)
 */
export function calculateOccupancyRate(
    occupiedUnits: number,
    totalUnits: number
): number {
    if (totalUnits === 0) return 0
    return Math.round((occupiedUnits / totalUnits) * 100 * 100) / 100
}

/**
 * Calculate vacancy rate (inverse of occupancy)
 * @param occupancyRate Current occupancy rate
 * @returns Vacancy rate as percentage (0-100)
 */
export function calculateVacancyRate(occupancyRate: number): number {
    return Math.round((100 - occupancyRate) * 100) / 100
}

/**
 * Calculate weighted occupancy rate by surface area
 * @param properties Properties with their occupancy status and surface
 * @returns Weighted occupancy rate
 */
export function calculateWeightedOccupancy(
    properties: PropertyLocation[]
): number {
    if (properties.length === 0) return 0

    const totalSurface = properties.reduce(
        (sum, p) => sum + (p.surfaceArea || 0),
        0
    )
    if (totalSurface === 0) return 0

    const occupiedSurface = properties
        .filter((p) => p.occupancyStatus === "occupied")
        .reduce((sum, p) => sum + (p.surfaceArea || 0), 0)

    return Math.round((occupiedSurface / totalSurface) * 100 * 100) / 100
}

// ============================================
// FINANCIAL CALCULATIONS
// ============================================

/**
 * Calculate gross rental yield
 * @param annualRent Total annual rent income
 * @param propertyValue Total property value
 * @returns Gross yield as percentage
 */
export function calculateGrossYield(
    annualRent: number,
    propertyValue: number
): number {
    if (propertyValue === 0) return 0
    return Math.round((annualRent / propertyValue) * 100 * 100) / 100
}

/**
 * Calculate net rental yield (after charges)
 * @param annualRent Total annual rent income
 * @param annualCharges Total annual charges/expenses
 * @param propertyValue Total property value
 * @returns Net yield as percentage
 */
export function calculateNetYield(
    annualRent: number,
    annualCharges: number,
    propertyValue: number
): number {
    if (propertyValue === 0) return 0
    const netIncome = annualRent - annualCharges
    return Math.round((netIncome / propertyValue) * 100 * 100) / 100
}

/**
 * Calculate average rent per square meter
 * @param totalRent Total monthly rent
 * @param totalSurface Total surface area in sqm
 * @returns Average rent per sqm
 */
export function calculateRentPerSqm(
    totalRent: number,
    totalSurface: number
): number {
    if (totalSurface === 0) return 0
    return Math.round((totalRent / totalSurface) * 100) / 100
}

/**
 * Calculate portfolio performance score (0-100)
 * Based on occupancy, yield, and lease stability
 */
export function calculatePerformanceScore(
    occupancyRate: number,
    grossYield: number,
    expiringSoonRatio: number
): number {
    // Weights for each factor
    const occupancyWeight = 0.4
    const yieldWeight = 0.35
    const stabilityWeight = 0.25

    // Normalize occupancy (already 0-100)
    const occupancyScore = occupancyRate

    // Normalize yield (target 5-10%, cap at 15%)
    const yieldScore = Math.min((grossYield / 10) * 100, 100)

    // Stability score (lower expiring ratio = better)
    const stabilityScore = Math.max(0, 100 - expiringSoonRatio * 100)

    const totalScore =
        occupancyScore * occupancyWeight +
        yieldScore * yieldWeight +
        stabilityScore * stabilityWeight

    return Math.round(totalScore * 100) / 100
}

// ============================================
// CHART DATA TRANSFORMATIONS
// ============================================

/**
 * Transform property types into chart data
 */
export function transformPropertyTypesToChart(
    propertiesByType: Record<string, number>
): ChartDataPoint[] {
    const colors = [
        "#6366f1", // indigo
        "#8b5cf6", // violet
        "#ec4899", // pink
        "#f97316", // orange
        "#10b981", // emerald
        "#06b6d4", // cyan
    ]

    const total = Object.values(propertiesByType).reduce((a, b) => a + b, 0)

    return Object.entries(propertiesByType).map(([label, value], index) => ({
        label: translatePropertyType(label),
        value,
        color: colors[index % colors.length],
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
}

/**
 * Transform tenant types into chart data
 */
export function transformTenantTypesToChart(
    tenantsByType: Record<string, number>
): ChartDataPoint[] {
    const colors = ["#10b981", "#6366f1"]
    const total = Object.values(tenantsByType).reduce((a, b) => a + b, 0)

    return Object.entries(tenantsByType).map(([label, value], index) => ({
        label: label === "individual" ? "Particuliers" : "Entreprises",
        value,
        color: colors[index % colors.length],
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
}

/**
 * Group properties by city for geographic view
 */
export function groupPropertiesByCity(
    properties: PropertyLocation[]
): GeoRegion[] {
    const cityMap = new Map<string, PropertyLocation[]>()

    properties.forEach((property) => {
        const existing = cityMap.get(property.city) || []
        cityMap.set(property.city, [...existing, property])
    })

    return Array.from(cityMap.entries()).map(([name, props]) => {
        const occupiedCount = props.filter(
            (p) => p.occupancyStatus === "occupied"
        ).length

        return {
            name,
            propertyCount: props.length,
            totalValue: props.reduce((sum, p) => sum + (p.estimatedValue || 0), 0),
            occupancyRate: calculateOccupancyRate(occupiedCount, props.length),
        }
    })
}

// ============================================
// KPI AGGREGATIONS
// ============================================

/**
 * Generate dashboard summary from KPIs
 */
export function generateDashboardSummary(kpis: DashboardKPIs): DashboardSummary {
    const expiringSoonRatio =
        kpis.totalLeases > 0 ? kpis.expiringSoonLeases / kpis.totalLeases : 0

    return {
        portfolioValue: kpis.totalEstimatedValue,
        annualRevenue: kpis.totalAnnualRent,
        averageOccupancy: kpis.occupancyRate,
        performanceScore: calculatePerformanceScore(
            kpis.occupancyRate,
            kpis.grossYield,
            expiringSoonRatio
        ),
    }
}

/**
 * Create empty KPIs object with default values
 */
export function createEmptyKPIs(): DashboardKPIs {
    return {
        totalProperties: 0,
        propertiesByType: {},
        totalSurfaceArea: 0,
        totalEstimatedValue: 0,
        occupancyRate: 0,
        vacancyRate: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        totalMonthlyRent: 0,
        totalAnnualRent: 0,
        totalCharges: 0,
        totalDeposits: 0,
        averageRentPerSqm: 0,
        grossYield: 0,
        totalTenants: 0,
        tenantsByType: {},
        totalLeases: 0,
        activeLeases: 0,
        expiringSoonLeases: 0,
        expiredLeases: 0,
        totalDocuments: 0,
        documentsByType: {},
        lastUpdated: new Date().toISOString(),
    }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency value
 */
export function formatCurrency(
    value: number,
    locale: string = "fr-FR",
    currency: string = "EUR"
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
}

/**
 * Format surface area
 */
export function formatSurface(value: number): string {
    return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} m²`
}

/**
 * Format large numbers with abbreviation
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}k`
    }
    return value.toString()
}

/**
 * Translate property type to French
 */
export function translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
        apartment: "Appartement",
        house: "Maison",
        commercial: "Commercial",
        office: "Bureau",
        warehouse: "Entrepôt",
        parking: "Parking",
        land: "Terrain",
        other: "Autre",
    }
    return translations[type.toLowerCase()] || type
}

/**
 * Get trend indicator based on value change
 */
export function getTrendIndicator(
    current: number,
    previous: number
): { value: number; positive: boolean; text: string } {
    if (previous === 0) {
        return { value: 0, positive: true, text: "N/A" }
    }

    const change = ((current - previous) / previous) * 100
    const isPositive = change >= 0

    return {
        value: Math.abs(Math.round(change * 10) / 10),
        positive: isPositive,
        text: `${isPositive ? "+" : "-"}${Math.abs(Math.round(change * 10) / 10)}%`,
    }
}

// ============================================
// VALIDATION & HEALTH CHECKS
// ============================================

/**
 * Check if KPIs data is stale (older than 5 minutes)
 */
export function isKPIDataStale(lastUpdated: string): boolean {
    const staleThreshold = 5 * 60 * 1000 // 5 minutes
    const lastUpdateTime = new Date(lastUpdated).getTime()
    return Date.now() - lastUpdateTime > staleThreshold
}

/**
 * Validate KPIs data integrity
 */
export function validateKPIs(kpis: DashboardKPIs): boolean {
    // Basic sanity checks
    if (kpis.occupancyRate < 0 || kpis.occupancyRate > 100) return false
    if (kpis.vacancyRate < 0 || kpis.vacancyRate > 100) return false
    if (kpis.totalProperties < 0) return false
    if (kpis.occupiedUnits + kpis.vacantUnits > kpis.totalProperties) return false

    return true
}
