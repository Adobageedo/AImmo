/**
 * Leases Hook - Specialized hook for lease management
 * Phase 6 - Business UI Foundation
 */

"use client"

import { useCallback, useMemo, useState } from "react"
import { useEntity, UseEntityOptions, UseEntityResult } from "./use-entity"
import { leaseService, LeaseListParams } from "@/lib/services/lease-service"
import type {
    Lease,
    LeaseCreateRequest,
    LeaseUpdateRequest,
    LeaseStats,
    LeaseStatus,
    LeaseType,
    LeasePayment,
    PaymentStatus,
} from "@/lib/types/entity"

export interface UseLeasesOptions extends UseEntityOptions<Lease> {
    status?: LeaseStatus
    leaseType?: LeaseType
    propertyId?: string
    tenantId?: string
    expiringSoon?: boolean
}

export interface UseLeasesResult extends UseEntityResult<Lease, LeaseCreateRequest, LeaseUpdateRequest> {
    // Lease-specific computed data
    leaseStats: LeaseStats | null
    activeLeases: Lease[]
    expiringLeases: Lease[]
    leasesWithLatePayments: Lease[]

    // Payments
    payments: LeasePayment[]
    loadingPayments: boolean
    loadPayments: (leaseId: string) => Promise<void>
    recordPayment: (leaseId: string, payment: Partial<LeasePayment>) => Promise<LeasePayment | null>

    // Lease-specific filters
    filterByStatus: (status: LeaseStatus | null) => void
    filterByType: (type: LeaseType | null) => void
    filterByProperty: (propertyId: string | null) => void
    filterByTenant: (tenantId: string | null) => void
    filterExpiringSoon: (enabled: boolean) => void

    // Lease-specific helpers
    getTypeLabel: (type: LeaseType) => string
    getStatusInfo: (status: LeaseStatus) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    getPaymentStatusInfo: (status: PaymentStatus) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    formatPeriod: (lease: Lease) => string
    formatMonthlyTotal: (lease: Lease) => string
    isExpiringSoon: (lease: Lease, months?: number) => boolean
    getRemainingMonths: (lease: Lease) => number | null
    generateReference: (propertyName: string, tenantName: string) => string
}

export function useLeases(options: UseLeasesOptions = {}): UseLeasesResult {
    const { status, leaseType, propertyId, tenantId, expiringSoon, ...entityOptions } = options

    // Build initial filters from options
    const initialFilters: Partial<LeaseListParams> = {
        ...entityOptions.initialFilters,
    }
    if (status) initialFilters.status = status
    if (leaseType) initialFilters.lease_type = leaseType
    if (propertyId) initialFilters.property_id = propertyId
    if (tenantId) initialFilters.tenant_id = tenantId
    if (expiringSoon) initialFilters.expiring_soon = expiringSoon

    // Use base entity hook
    const entityResult = useEntity<Lease, LeaseCreateRequest, LeaseUpdateRequest>(
        leaseService,
        "lease",
        { ...entityOptions, initialFilters }
    )

    // Payments state
    const [payments, setPayments] = useState<LeasePayment[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)

    // Compute lease statistics from stats
    const leaseStats = useMemo(() => {
        if (!entityResult.stats || Object.keys(entityResult.stats).length === 0) {
            return null
        }
        return entityResult.stats as unknown as LeaseStats
    }, [entityResult.stats])

    // Filter active leases
    const activeLeases = useMemo(() => {
        return entityResult.items.filter(l => l.status === "active")
    }, [entityResult.items])

    // Filter expiring leases (within 3 months)
    const expiringLeases = useMemo(() => {
        return entityResult.items.filter(l => leaseService.isExpiringSoon(l, 3))
    }, [entityResult.items])

    // Filter leases with late payments
    const leasesWithLatePayments = useMemo(() => {
        return entityResult.items.filter(l =>
            l.payment_status === "late" || l.payment_status === "unpaid"
        )
    }, [entityResult.items])

    // Load payments for a lease
    const loadPayments = useCallback(async (leaseId: string) => {
        const { currentOrganizationId } = await import("@/lib/store/auth-store").then(m => m.useAuthStore.getState())
        if (!currentOrganizationId) return

        setLoadingPayments(true)
        try {
            const paymentsData = await leaseService.getPayments(leaseId, currentOrganizationId)
            setPayments(paymentsData)
        } catch {
            setPayments([])
        } finally {
            setLoadingPayments(false)
        }
    }, [])

    // Record a payment
    const recordPayment = useCallback(async (
        leaseId: string,
        payment: Partial<LeasePayment>
    ): Promise<LeasePayment | null> => {
        const { currentOrganizationId } = await import("@/lib/store/auth-store").then(m => m.useAuthStore.getState())
        if (!currentOrganizationId) return null

        try {
            const newPayment = await leaseService.recordPayment(leaseId, currentOrganizationId, payment)
            setPayments(prev => [newPayment, ...prev])
            return newPayment
        } catch {
            return null
        }
    }, [])

    // Filter by status
    const filterByStatus = useCallback((status: LeaseStatus | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            status: status || undefined,
        })
    }, [entityResult])

    // Filter by type
    const filterByType = useCallback((type: LeaseType | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            lease_type: type || undefined,
        })
    }, [entityResult])

    // Filter by property
    const filterByProperty = useCallback((propertyId: string | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            property_id: propertyId || undefined,
        })
    }, [entityResult])

    // Filter by tenant
    const filterByTenant = useCallback((tenantId: string | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            tenant_id: tenantId || undefined,
        })
    }, [entityResult])

    // Filter expiring soon
    const filterExpiringSoon = useCallback((enabled: boolean) => {
        entityResult.setFilters({
            ...entityResult.filters,
            expiring_soon: enabled || undefined,
        })
    }, [entityResult])

    // Expose service helpers
    const getTypeLabel = useCallback((type: LeaseType) => {
        return leaseService.getTypeLabel(type)
    }, [])

    const getStatusInfo = useCallback((status: LeaseStatus) => {
        return leaseService.getStatusInfo(status)
    }, [])

    const getPaymentStatusInfo = useCallback((status: PaymentStatus) => {
        return leaseService.getPaymentStatusInfo(status)
    }, [])

    const formatPeriod = useCallback((lease: Lease) => {
        return leaseService.formatPeriod(lease)
    }, [])

    const formatMonthlyTotal = useCallback((lease: Lease) => {
        return leaseService.formatMonthlyTotal(lease)
    }, [])

    const isExpiringSoon = useCallback((lease: Lease, months?: number) => {
        return leaseService.isExpiringSoon(lease, months)
    }, [])

    const getRemainingMonths = useCallback((lease: Lease) => {
        return leaseService.getRemainingMonths(lease)
    }, [])

    const generateReference = useCallback((propertyName: string, tenantName: string) => {
        return leaseService.generateReference(propertyName, tenantName)
    }, [])

    return {
        ...entityResult,
        leaseStats,
        activeLeases,
        expiringLeases,
        leasesWithLatePayments,
        payments,
        loadingPayments,
        loadPayments,
        recordPayment,
        filterByStatus,
        filterByType,
        filterByProperty,
        filterByTenant,
        filterExpiringSoon,
        getTypeLabel,
        getStatusInfo,
        getPaymentStatusInfo,
        formatPeriod,
        formatMonthlyTotal,
        isExpiringSoon,
        getRemainingMonths,
        generateReference,
    }
}

// Export type for external use
export type { Lease, LeaseCreateRequest, LeaseUpdateRequest, LeaseStats, LeasePayment }
