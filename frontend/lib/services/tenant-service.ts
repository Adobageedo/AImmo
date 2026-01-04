/**
 * Tenant Service - CRUD operations for tenants
 * Phase 6 - Business UI Foundation
 */

import { EntityService, ListParams } from "./entity-service"
import type {
    Tenant,
    TenantCreateRequest,
    TenantUpdateRequest,
    TenantStats,
    TenantStatus,
    TenantType,
} from "@/lib/types/entity"

export interface TenantListParams extends ListParams {
    status?: TenantStatus
    tenant_type?: TenantType
    has_active_lease?: boolean
    has_outstanding_balance?: boolean
}

class TenantService extends EntityService<Tenant, TenantCreateRequest, TenantUpdateRequest> {
    protected entityType = "tenant" as const
    protected endpoint = "tenants"

    /**
     * List tenants with specific filters
     */
    async listTenants(
        organizationId: string,
        params?: TenantListParams
    ): Promise<Tenant[]> {
        return this.listAll(organizationId, params)
    }

    /**
     * Get tenant with related data (current lease, property, payments)
     */
    async getTenantWithRelations(
        id: string,
        organizationId: string
    ): Promise<Tenant & {
        current_lease?: unknown
        current_property?: unknown
        payment_history?: unknown[]
    }> {
        const tenant = await this.get(id, organizationId)
        return tenant
    }

    /**
     * Get tenants by status
     */
    async getByStatus(organizationId: string, status: TenantStatus): Promise<Tenant[]> {
        return this.listAll(organizationId, { status })
    }

    /**
     * Get active tenants (with current lease)
     */
    async getActive(organizationId: string): Promise<Tenant[]> {
        return this.getByStatus(organizationId, "active" as TenantStatus)
    }

    /**
     * Get tenants with outstanding balance
     */
    async getWithOutstandingBalance(organizationId: string): Promise<Tenant[]> {
        return this.listAll(organizationId, { has_outstanding_balance: true })
    }

    /**
     * Get tenant statistics
     */
    async getTenantStats(organizationId: string): Promise<TenantStats> {
        const stats = await this.getStats(organizationId)
        return stats as unknown as TenantStats
    }

    /**
     * Get tenant full name
     */
    getFullName(tenant: Tenant): string {
        return tenant.name
    }

    /**
     * Get tenant initials for avatar
     */
    getInitials(tenant: Tenant): string {
        if (!tenant.name) return "T"
        const parts = tenant.name.split(" ")
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return tenant.name.substring(0, 2).toUpperCase()
    }

    /**
     * Get tenant type label in French
     */
    getTypeLabel(type: TenantType): string {
        const labels: Record<TenantType, string> = {
            individual: "Particulier",
            company: "Entreprise",
            association: "Association",
        }
        return labels[type] || type
    }

    /**
     * Get tenant status label and color
     */
    getStatusInfo(status: TenantStatus): { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" } {
        const statusMap: Record<TenantStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = {
            active: { label: "Actif", variant: "success" },
            past: { label: "Ancien", variant: "secondary" },
            prospect: { label: "Prospect", variant: "default" },
        }
        return statusMap[status] || { label: status, variant: "default" }
    }

    /**
     * Format contact information
     */
    formatContact(tenant: Tenant): string {
        const parts = [
            tenant.email,
            tenant.address,
        ].filter(Boolean)
        return parts.join(" • ")
    }

    /**
     * Check if tenant has complete profile
     */
    hasCompleteProfile(tenant: Tenant): boolean {
        const requiredFields = [
            tenant.name,
            tenant.email,
            tenant.address,
        ]
        return requiredFields.every(Boolean)
    }
}

export const tenantService = new TenantService()
