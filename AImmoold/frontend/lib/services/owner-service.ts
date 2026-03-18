/**
 * Owner Service - CRUD operations for owners
 */

import { EntityService, ListParams } from "./entity-service"
import type {
    Owner,
    OwnerCreateRequest,
    OwnerUpdateRequest,
} from "@/lib/types/entity"

export interface OwnerListParams extends ListParams {
    has_properties?: boolean
}

class OwnerService extends EntityService<Owner, OwnerCreateRequest, OwnerUpdateRequest> {
    protected entityType = "owner" as const
    protected endpoint = "owners"

    /**
     * List owners with specific filters
     */
    async listOwners(
        organizationId: string,
        params?: OwnerListParams
    ): Promise<Owner[]> {
        return this.listAll(organizationId, params)
    }

    /**
     * Get owner with their properties
     */
    async getOwnerWithProperties(
        id: string,
        organizationId: string
    ): Promise<Owner & { properties?: unknown[] }> {
        const owner = await this.get(id, organizationId)
        
        // Fetch properties for this owner
        try {
            const url = this.buildUrl(`/${id}/properties`, { organization_id: organizationId })
            const response = await fetch(url, {
                headers: {
                    ...this.getAuthHeader(),
                    "Content-Type": "application/json",
                },
            })
            
            if (response.ok) {
                const properties = await response.json()
                return { ...owner, properties }
            }
        } catch (error) {
            console.error("Failed to fetch owner properties:", error)
        }
        
        return owner
    }

    /**
     * Format owner name (with company if applicable)
     */
    formatOwnerName(owner: Owner): string {
        if (owner.company_name) {
            return `${owner.name} (${owner.company_name})`
        }
        return owner.name
    }

    /**
     * Get owner initials for avatar
     */
    getInitials(owner: Owner): string {
        const names = owner.name.split(" ")
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        }
        return owner.name.substring(0, 2).toUpperCase()
    }
}

export const ownerService = new OwnerService()
