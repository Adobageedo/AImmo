/**
 * Tenants Hook - Specialized hook for tenant management
 * Phase 6 - Business UI Foundation
 */

"use client"

import { useCallback, useMemo } from "react"
import { useEntity, UseEntityOptions, UseEntityResult } from "./use-entity"
import { tenantService, TenantListParams } from "@/lib/services/tenant-service"
import type {
    Tenant,
    TenantCreateRequest,
    TenantUpdateRequest,
    TenantStats,
    TenantStatus,
    TenantType,
} from "@/lib/types/entity"

export interface UseTenantsOptions extends UseEntityOptions<Tenant> {
    status?: TenantStatus
    tenantType?: TenantType
    hasActiveLease?: boolean
}

export interface UseTenantsResult extends UseEntityResult<Tenant, TenantCreateRequest, TenantUpdateRequest> {
    // Tenant-specific computed data
    tenantStats: TenantStats | null
    activeTenants: Tenant[]
    tenantsWithBalance: Tenant[]

    // Tenant-specific filters
    filterByStatus: (status: TenantStatus | null) => void
    filterByType: (type: TenantType | null) => void
    filterByActiveLease: (hasActiveLease: boolean | null) => void

    // Tenant-specific helpers
    getFullName: (tenant: Tenant) => string
    getInitials: (tenant: Tenant) => string
    getTypeLabel: (type: TenantType) => string
    getStatusInfo: (status: TenantStatus) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    formatContact: (tenant: Tenant) => string
    hasCompleteProfile: (tenant: Tenant) => boolean
}

export function useTenants(options: UseTenantsOptions = {}): UseTenantsResult {
    const { status, tenantType, hasActiveLease, ...entityOptions } = options

    // Build initial filters from options
    const initialFilters: Partial<TenantListParams> = {
        ...entityOptions.initialFilters,
    }
    if (status) initialFilters.status = status
    if (tenantType) initialFilters.tenant_type = tenantType
    if (hasActiveLease !== undefined) initialFilters.has_active_lease = hasActiveLease

    // Use base entity hook
    const entityResult = useEntity<Tenant, TenantCreateRequest, TenantUpdateRequest>(
        tenantService,
        "tenant",
        { ...entityOptions, initialFilters }
    )

    // Compute tenant statistics from stats
    const tenantStats = useMemo(() => {
        if (!entityResult.stats || Object.keys(entityResult.stats).length === 0) {
            return null
        }
        return entityResult.stats as unknown as TenantStats
    }, [entityResult.stats])

    // Filter active tenants
    const activeTenants = useMemo(() => {
        return entityResult.items.filter(t => t.status === "active")
    }, [entityResult.items])

    // Filter tenants with outstanding balance
    const tenantsWithBalance = useMemo(() => {
        return entityResult.items.filter(t => (t.outstanding_balance || 0) > 0)
    }, [entityResult.items])

    // Filter by status
    const filterByStatus = useCallback((status: TenantStatus | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            status: status || undefined,
        })
    }, [entityResult])

    // Filter by type
    const filterByType = useCallback((type: TenantType | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            tenant_type: type || undefined,
        })
    }, [entityResult])

    // Filter by active lease
    const filterByActiveLease = useCallback((hasActiveLease: boolean | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            has_active_lease: hasActiveLease ?? undefined,
        })
    }, [entityResult])

    // Expose service helpers
    const getFullName = useCallback((tenant: Tenant) => {
        return tenantService.getFullName(tenant)
    }, [])

    const getInitials = useCallback((tenant: Tenant) => {
        return tenantService.getInitials(tenant)
    }, [])

    const getTypeLabel = useCallback((type: TenantType) => {
        return tenantService.getTypeLabel(type)
    }, [])

    const getStatusInfo = useCallback((status: TenantStatus) => {
        return tenantService.getStatusInfo(status)
    }, [])

    const formatContact = useCallback((tenant: Tenant) => {
        return tenantService.formatContact(tenant)
    }, [])

    const hasCompleteProfile = useCallback((tenant: Tenant) => {
        return tenantService.hasCompleteProfile(tenant)
    }, [])

    return {
        ...entityResult,
        tenantStats,
        activeTenants,
        tenantsWithBalance,
        filterByStatus,
        filterByType,
        filterByActiveLease,
        getFullName,
        getInitials,
        getTypeLabel,
        getStatusInfo,
        formatContact,
        hasCompleteProfile,
    }
}

// Export type for external use
export type { Tenant, TenantCreateRequest, TenantUpdateRequest, TenantStats }
