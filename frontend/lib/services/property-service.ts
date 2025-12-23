/**
 * Property Service - CRUD operations for properties
 * Phase 6 - Business UI Foundation
 */

import { EntityService, ListParams } from "./entity-service"
import type {
    Property,
    PropertyCreateRequest,
    PropertyUpdateRequest,
    PropertyStats,
    PropertyStatus,
    PropertyType,
} from "@/lib/types/entity"

export interface PropertyListParams extends ListParams {
    status?: PropertyStatus
    property_type?: PropertyType
    city?: string
    min_surface?: number
    max_surface?: number
    min_rent?: number
    max_rent?: number
    has_current_lease?: boolean
}

class PropertyService extends EntityService<Property, PropertyCreateRequest, PropertyUpdateRequest> {
    protected entityType = "property" as const
    protected endpoint = "properties"

    /**
     * List properties with specific filters
     */
    async listProperties(
        organizationId: string,
        params?: PropertyListParams
    ): Promise<Property[]> {
        return this.listAll(organizationId, params)
    }

    /**
     * Get property with related data (current lease, tenant, documents)
     */
    async getPropertyWithRelations(
        id: string,
        organizationId: string
    ): Promise<Property & {
        current_lease?: unknown
        current_tenant?: unknown
        documents?: unknown[]
    }> {
        const property = await this.get(id, organizationId)

        // For now, return property as-is
        // Relations will be fetched by backend or separate calls
        return property
    }

    /**
     * Get properties by status
     */
    async getByStatus(organizationId: string, status: PropertyStatus): Promise<Property[]> {
        return this.listAll(organizationId, { status })
    }

    /**
     * Get available properties (not rented)
     */
    async getAvailable(organizationId: string): Promise<Property[]> {
        return this.getByStatus(organizationId, "available" as PropertyStatus)
    }

    /**
     * Get rented properties
     */
    async getRented(organizationId: string): Promise<Property[]> {
        return this.getByStatus(organizationId, "rented" as PropertyStatus)
    }

    /**
     * Calculate yield for a property
     */
    calculateYield(property: Property): number {
        if (!property.purchase_price || !property.monthly_rent) {
            return 0
        }

        const annualRent = property.monthly_rent * 12
        const annualCharges = (property.monthly_charges || 0) * 12
        const propertyTax = property.property_tax || 0

        // Net yield calculation
        const netAnnualIncome = annualRent - annualCharges - propertyTax
        const yieldPercentage = (netAnnualIncome / property.purchase_price) * 100

        return Math.round(yieldPercentage * 100) / 100
    }

    /**
     * Get property statistics
     */
    async getPropertyStats(organizationId: string): Promise<PropertyStats> {
        const stats = await this.getStats(organizationId)
        return stats as unknown as PropertyStats
    }

    /**
     * Format property address as string
     */
    formatAddress(property: Property): string {
        const { address } = property
        if (!address) return "Adresse non renseignée"

        const parts = [
            address.street,
            address.building ? `Bât. ${address.building}` : null,
            address.floor !== undefined ? `${address.floor}ème étage` : null,
            address.door ? `Porte ${address.door}` : null,
        ].filter(Boolean)

        const line1 = parts.join(", ")
        const line2 = `${address.postal_code} ${address.city}`

        return `${line1}\n${line2}`
    }

    /**
     * Get property type label in French
     */
    getTypeLabel(type: PropertyType): string {
        const labels: Record<PropertyType, string> = {
            apartment: "Appartement",
            house: "Maison",
            studio: "Studio",
            commercial: "Local commercial",
            parking: "Parking",
            storage: "Box/Cave",
            land: "Terrain",
            other: "Autre",
        }
        return labels[type] || type
    }

    /**
     * Get property status label and color
     */
    getStatusInfo(status: PropertyStatus): { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" } {
        const statusMap: Record<PropertyStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = {
            available: { label: "Disponible", variant: "success" },
            rented: { label: "Loué", variant: "default" },
            under_renovation: { label: "En travaux", variant: "warning" },
            for_sale: { label: "En vente", variant: "secondary" },
            sold: { label: "Vendu", variant: "secondary" },
        }
        return statusMap[status] || { label: status, variant: "default" }
    }
}

export const propertyService = new PropertyService()
