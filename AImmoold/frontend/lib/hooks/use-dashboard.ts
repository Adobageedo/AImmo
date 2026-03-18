"use client"

// useDashboard Hook - Phase 7: Portfolio Dashboard MVP
// Fetch et calcul des KPIs pour le dashboard

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
    DashboardKPIs,
    PropertyLocation,
    DashboardFilters,
    DashboardState,
    DashboardSummary,
    ChartDataPoint,
    GeoRegion,
} from "@/lib/types/dashboard"
import {
    calculateOccupancyRate,
    calculateVacancyRate,
    calculateGrossYield,
    calculateRentPerSqm,
    createEmptyKPIs,
    generateDashboardSummary,
    transformPropertyTypesToChart,
    transformTenantTypesToChart,
    groupPropertiesByCity,
    isKPIDataStale,
} from "@/lib/dashboardCalculations"

interface UseDashboardOptions {
    organizationId?: string
    autoRefresh?: boolean
    refreshInterval?: number // in milliseconds
}

interface UseDashboardReturn {
    // State
    kpis: DashboardKPIs | null
    properties: PropertyLocation[]
    isLoading: boolean
    error: string | null
    lastRefresh: string | null

    // Computed data
    summary: DashboardSummary | null
    propertyTypeChart: ChartDataPoint[]
    tenantTypeChart: ChartDataPoint[]
    citiesData: GeoRegion[]
    occupancyChart: ChartDataPoint[]

    // Actions
    refresh: () => Promise<void>
    setFilters: (filters: Partial<DashboardFilters>) => void
    filters: DashboardFilters
}

export function useDashboard(
    options: UseDashboardOptions = {}
): UseDashboardReturn {
    const { organizationId, autoRefresh = false, refreshInterval = 300000 } = options

    const [state, setState] = useState<DashboardState>({
        kpis: null,
        properties: [],
        isLoading: true,
        error: null,
        filters: {
            organizationId,
            occupancyStatus: "all",
        },
        lastRefresh: null,
    })

    const supabase = createClient()

    // Fetch all dashboard data
    const fetchDashboardData = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        try {
            const orgId = state.filters.organizationId || organizationId

            if (!orgId) {
                // Get user's first organization if not specified
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) throw new Error("Non authentifié")

                const { data: orgUsers } = await supabase
                    .from("organization_users")
                    .select("organization_id")
                    .eq("user_id", user.id)
                    .limit(1)
                    .single()

                if (!orgUsers) throw new Error("Aucune organisation trouvée")
                state.filters.organizationId = orgUsers.organization_id
            }

            const currentOrgId = state.filters.organizationId || orgId

            // Parallel fetch all data
            const [
                propertiesResult,
                leasesResult,
                tenantsResult,
                documentsResult,
            ] = await Promise.all([
                supabase
                    .from("properties")
                    .select("*")
                    .eq("organization_id", currentOrgId),
                supabase
                    .from("leases")
                    .select("*, property:properties(*), tenant:tenants(*)")
                    .eq("organization_id", currentOrgId),
                supabase
                    .from("tenants")
                    .select("*")
                    .eq("organization_id", currentOrgId),
                supabase
                    .from("documents")
                    .select("*")
                    .eq("organization_id", currentOrgId),
            ])

            // Handle errors
            if (propertiesResult.error) throw propertiesResult.error
            if (leasesResult.error) throw leasesResult.error
            if (tenantsResult.error) throw tenantsResult.error
            if (documentsResult.error) throw documentsResult.error

            const properties = propertiesResult.data || []
            const leases = leasesResult.data || []
            const tenants = tenantsResult.data || []
            const documents = documentsResult.data || []

            // Calculate KPIs
            const now = new Date()
            const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

            // Active leases (no end date or end date in future)
            const activeLeases = leases.filter(
                (lease) => !lease.end_date || new Date(lease.end_date) > now
            )

            // Expiring soon (within 90 days)
            const expiringSoonLeases = leases.filter((lease) => {
                if (!lease.end_date) return false
                const endDate = new Date(lease.end_date)
                return endDate > now && endDate <= ninetyDaysFromNow
            })

            // Expired leases
            const expiredLeases = leases.filter(
                (lease) => lease.end_date && new Date(lease.end_date) <= now
            )

            // Properties with active leases
            const occupiedPropertyIds = new Set(
                activeLeases.map((l) => l.property_id)
            )

            // Calculate totals
            const totalMonthlyRent = activeLeases.reduce(
                (sum, l) => sum + parseFloat(l.monthly_rent || 0),
                0
            )
            const totalCharges = activeLeases.reduce(
                (sum, l) => sum + parseFloat(l.charges || 0),
                0
            )
            const totalDeposits = activeLeases.reduce(
                (sum, l) => sum + parseFloat(l.deposit || 0),
                0
            )
            const totalSurfaceArea = properties.reduce(
                (sum, p) => sum + parseFloat(p.surface_area || 0),
                0
            )
            const totalEstimatedValue = properties.reduce(
                (sum, p) => sum + parseFloat(p.current_value || p.purchase_price || p.estimated_value || 0),
                0
            )

            // Group by type
            const propertiesByType = properties.reduce((acc, p) => {
                acc[p.property_type] = (acc[p.property_type] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            const tenantsByType = tenants.reduce((acc, t) => {
                acc[t.tenant_type] = (acc[t.tenant_type] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            const documentsByType = documents.reduce((acc, d) => {
                const type = d.document_type || "autre"
                acc[type] = (acc[type] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            // Build KPIs
            const occupiedUnits = occupiedPropertyIds.size
            const vacantUnits = properties.length - occupiedUnits
            const occupancyRate = calculateOccupancyRate(occupiedUnits, properties.length)

            const kpis: DashboardKPIs = {
                totalProperties: properties.length,
                propertiesByType,
                totalSurfaceArea,
                totalEstimatedValue,
                occupancyRate,
                vacancyRate: calculateVacancyRate(occupancyRate),
                occupiedUnits,
                vacantUnits,
                totalMonthlyRent,
                totalAnnualRent: totalMonthlyRent * 12,
                totalCharges,
                totalDeposits,
                averageRentPerSqm: calculateRentPerSqm(totalMonthlyRent, totalSurfaceArea),
                grossYield: calculateGrossYield(totalMonthlyRent * 12, totalEstimatedValue),
                totalTenants: tenants.length,
                tenantsByType,
                totalLeases: leases.length,
                activeLeases: activeLeases.length,
                expiringSoonLeases: expiringSoonLeases.length,
                expiredLeases: expiredLeases.length,
                totalDocuments: documents.length,
                documentsByType,
                lastUpdated: new Date().toISOString(),
            }

            // Transform properties for map
            const propertyLocations: PropertyLocation[] = properties.map((p) => ({
                id: p.id,
                name: p.name,
                address: p.address,
                city: p.city,
                postalCode: p.postal_code,
                country: p.country,
                propertyType: p.property_type,
                surfaceArea: p.surface_area ? parseFloat(p.surface_area) : undefined,
                estimatedValue: p.current_value 
                    ? parseFloat(p.current_value)
                    : p.purchase_price 
                    ? parseFloat(p.purchase_price)
                    : p.estimated_value
                    ? parseFloat(p.estimated_value)
                    : undefined,
                occupancyStatus: occupiedPropertyIds.has(p.id) ? "occupied" : "vacant",
                monthlyRent: activeLeases.find((l) => l.property_id === p.id)
                    ?.monthly_rent,
            }))

            setState((prev) => ({
                ...prev,
                kpis,
                properties: propertyLocations,
                isLoading: false,
                error: null,
                lastRefresh: new Date().toISOString(),
            }))
        } catch (error) {
            console.error("Dashboard fetch error:", error)
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Erreur lors du chargement du dashboard",
            }))
        }
    }, [organizationId, state.filters.organizationId, supabase])

    // Initial fetch
    useEffect(() => {
        fetchDashboardData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            if (state.lastRefresh && isKPIDataStale(state.lastRefresh)) {
                fetchDashboardData()
            }
        }, refreshInterval)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval, state.lastRefresh, fetchDashboardData])

    // Set filters
    const setFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
        setState((prev) => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters },
        }))
    }, [])

    // Computed values
    const summary = useMemo(() => {
        if (!state.kpis) return null
        return generateDashboardSummary(state.kpis)
    }, [state.kpis])

    const propertyTypeChart = useMemo(() => {
        if (!state.kpis) return []
        return transformPropertyTypesToChart(state.kpis.propertiesByType)
    }, [state.kpis])

    const tenantTypeChart = useMemo(() => {
        if (!state.kpis) return []
        return transformTenantTypesToChart(state.kpis.tenantsByType)
    }, [state.kpis])

    const citiesData = useMemo(() => {
        return groupPropertiesByCity(state.properties)
    }, [state.properties])

    const occupancyChart = useMemo((): ChartDataPoint[] => {
        if (!state.kpis) return []
        return [
            {
                label: "Occupé",
                value: state.kpis.occupiedUnits,
                color: "#10b981",
                percentage: Math.round(state.kpis.occupancyRate),
            },
            {
                label: "Vacant",
                value: state.kpis.vacantUnits,
                color: "#ef4444",
                percentage: Math.round(state.kpis.vacancyRate),
            },
        ]
    }, [state.kpis])

    return {
        kpis: state.kpis,
        properties: state.properties,
        isLoading: state.isLoading,
        error: state.error,
        lastRefresh: state.lastRefresh,
        summary,
        propertyTypeChart,
        tenantTypeChart,
        citiesData,
        occupancyChart,
        refresh: fetchDashboardData,
        setFilters,
        filters: state.filters,
    }
}

export default useDashboard
