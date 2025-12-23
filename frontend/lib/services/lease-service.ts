/**
 * Lease Service - CRUD operations for leases
 * Phase 6 - Business UI Foundation
 */

import { EntityService, ListParams } from "./entity-service"
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

export interface LeaseListParams extends ListParams {
    status?: LeaseStatus
    lease_type?: LeaseType
    property_id?: string
    tenant_id?: string
    expiring_soon?: boolean // within 3 months
    payment_status?: PaymentStatus
}

class LeaseService extends EntityService<Lease, LeaseCreateRequest, LeaseUpdateRequest> {
    protected entityType = "lease" as const
    protected endpoint = "leases"

    /**
     * List leases with specific filters
     */
    async listLeases(
        organizationId: string,
        params?: LeaseListParams
    ): Promise<Lease[]> {
        return this.listAll(organizationId, params)
    }

    /**
     * Get lease with all related data
     */
    async getLeaseWithRelations(
        id: string,
        organizationId: string
    ): Promise<Lease> {
        const lease = await this.get(id, organizationId)
        return lease
    }

    /**
     * Get leases by status
     */
    async getByStatus(organizationId: string, status: LeaseStatus): Promise<Lease[]> {
        return this.listAll(organizationId, { status })
    }

    /**
     * Get active leases
     */
    async getActive(organizationId: string): Promise<Lease[]> {
        return this.getByStatus(organizationId, "active" as LeaseStatus)
    }

    /**
     * Get leases expiring within N months
     */
    async getExpiringSoon(organizationId: string, months: number = 3): Promise<Lease[]> {
        return this.listAll(organizationId, { expiring_soon: true })
    }

    /**
     * Get leases for a specific property
     */
    async getByProperty(organizationId: string, propertyId: string): Promise<Lease[]> {
        return this.listAll(organizationId, { property_id: propertyId })
    }

    /**
     * Get leases for a specific tenant
     */
    async getByTenant(organizationId: string, tenantId: string): Promise<Lease[]> {
        return this.listAll(organizationId, { tenant_id: tenantId })
    }

    /**
     * Get lease payments
     */
    async getPayments(leaseId: string, organizationId: string): Promise<LeasePayment[]> {
        const response = await fetch(
            this.buildUrl(`/${leaseId}/payments`, { organization_id: organizationId }),
            { headers: this.getAuthHeader() }
        )

        if (!response.ok) {
            return []
        }

        return response.json()
    }

    /**
     * Record a payment
     */
    async recordPayment(
        leaseId: string,
        organizationId: string,
        payment: Partial<LeasePayment>
    ): Promise<LeasePayment> {
        const response = await fetch(
            this.buildUrl(`/${leaseId}/payments`, { organization_id: organizationId }),
            {
                method: "POST",
                headers: {
                    ...this.getAuthHeader(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payment),
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || "Failed to record payment")
        }

        return response.json()
    }

    /**
     * Get lease statistics
     */
    async getLeaseStats(organizationId: string): Promise<LeaseStats> {
        const stats = await this.getStats(organizationId)
        return stats as unknown as LeaseStats
    }

    /**
     * Get lease type label in French
     */
    getTypeLabel(type: LeaseType): string {
        const labels: Record<LeaseType, string> = {
            unfurnished: "Location vide",
            furnished: "Location meublée",
            commercial: "Bail commercial",
            professional: "Bail professionnel",
            seasonal: "Location saisonnière",
            student: "Bail étudiant",
            mobility: "Bail mobilité",
        }
        return labels[type] || type
    }

    /**
     * Get lease status label and color
     */
    getStatusInfo(status: LeaseStatus): { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" } {
        const statusMap: Record<LeaseStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = {
            draft: { label: "Brouillon", variant: "secondary" },
            active: { label: "Actif", variant: "success" },
            expired: { label: "Expiré", variant: "warning" },
            terminated: { label: "Résilié", variant: "error" },
            renewed: { label: "Renouvelé", variant: "default" },
        }
        return statusMap[status] || { label: status, variant: "default" }
    }

    /**
     * Get payment status label and color
     */
    getPaymentStatusInfo(status: PaymentStatus): { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" } {
        const statusMap: Record<PaymentStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = {
            pending: { label: "En attente", variant: "default" },
            paid: { label: "Payé", variant: "success" },
            partial: { label: "Partiel", variant: "warning" },
            late: { label: "En retard", variant: "error" },
            unpaid: { label: "Impayé", variant: "error" },
        }
        return statusMap[status] || { label: status, variant: "default" }
    }

    /**
     * Format lease period
     */
    formatPeriod(lease: Lease): string {
        const start = new Date(lease.start_date).toLocaleDateString("fr-FR")
        const end = lease.end_date
            ? new Date(lease.end_date).toLocaleDateString("fr-FR")
            : "Indéterminée"
        return `${start} - ${end}`
    }

    /**
     * Format monthly total
     */
    formatMonthlyTotal(lease: Lease): string {
        const total = lease.rent_amount + lease.charges_amount
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(total)
    }

    /**
     * Check if lease is expiring soon (within 3 months)
     */
    isExpiringSoon(lease: Lease, monthsThreshold: number = 3): boolean {
        if (!lease.end_date || lease.status !== "active") {
            return false
        }

        const endDate = new Date(lease.end_date)
        const thresholdDate = new Date()
        thresholdDate.setMonth(thresholdDate.getMonth() + monthsThreshold)

        return endDate <= thresholdDate
    }

    /**
     * Calculate remaining duration in months
     */
    getRemainingMonths(lease: Lease): number | null {
        if (!lease.end_date) return null

        const now = new Date()
        const endDate = new Date(lease.end_date)

        if (endDate <= now) return 0

        const diffTime = endDate.getTime() - now.getTime()
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))

        return diffMonths
    }

    /**
     * Generate lease reference
     */
    generateReference(propertyName: string, tenantName: string): string {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()

        return `BAIL-${year}${month}-${random}`
    }
}

export const leaseService = new LeaseService()
