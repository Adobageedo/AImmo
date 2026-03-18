/**
 * Generic Entity Service - Base class for all entity CRUD operations
 * Phase 6 - Business UI Foundation
 */

import { useAuthStore } from "@/lib/store/auth-store"
import type { BaseEntity, EntityType } from "@/lib/types/entity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export interface ListParams {
    page?: number
    limit?: number
    sort_by?: string
    sort_direction?: "asc" | "desc"
    search?: string
    [key: string]: string | number | boolean | undefined
}

export interface ListResponse<T> {
    items: T[]
    total: number
    page: number
    limit: number
    total_pages: number
}

export abstract class EntityService<
    T extends BaseEntity,
    TCreate = Partial<T>,
    TUpdate = Partial<T>
> {
    protected abstract entityType: EntityType
    protected abstract endpoint: string

    protected getAuthHeader(): HeadersInit {
        const token = useAuthStore.getState().accessToken
        if (!token) {
            throw new Error("Not authenticated")
        }
        return {
            Authorization: `Bearer ${token}`,
        }
    }

    protected buildUrl(path: string = "", params?: Record<string, string | number | boolean | undefined>): string {
        const url = new URL(`${API_URL}/${this.endpoint}${path}`)
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    url.searchParams.append(key, String(value))
                }
            })
        }
        return url.toString()
    }

    async list(organizationId: string, params?: ListParams): Promise<ListResponse<T>> {
        const response = await fetch(
            this.buildUrl("", { organization_id: organizationId, ...params }),
            { headers: this.getAuthHeader() }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to fetch ${this.entityType} list`)
        }

        return response.json()
    }

    async listAll(organizationId: string, params?: Omit<ListParams, "page" | "limit">): Promise<T[]> {
        const response = await fetch(
            this.buildUrl("", { organization_id: organizationId, limit: 1000, ...params }),
            { headers: this.getAuthHeader() }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to fetch ${this.entityType} list`)
        }

        const data = await response.json()
        // Support both paginated and non-paginated responses
        return Array.isArray(data) ? data : data.items || []
    }

    async get(id: string, organizationId: string): Promise<T> {
        const response = await fetch(
            this.buildUrl(`/${id}`, { organization_id: organizationId }),
            { headers: this.getAuthHeader() }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to fetch ${this.entityType}`)
        }

        return response.json()
    }

    async create(data: TCreate): Promise<T> {
        const response = await fetch(this.buildUrl(), {
            method: "POST",
            headers: {
                ...this.getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to create ${this.entityType}`)
        }

        return response.json()
    }

    async update(id: string, organizationId: string, data: TUpdate): Promise<T> {
        const response = await fetch(
            this.buildUrl(`/${id}`, { organization_id: organizationId }),
            {
                method: "PUT",
                headers: {
                    ...this.getAuthHeader(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to update ${this.entityType}`)
        }

        return response.json()
    }

    async delete(id: string, organizationId: string): Promise<void> {
        const response = await fetch(
            this.buildUrl(`/${id}`, { organization_id: organizationId }),
            {
                method: "DELETE",
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `Failed to delete ${this.entityType}`)
        }
    }

    async getStats(organizationId: string): Promise<Record<string, unknown>> {
        const response = await fetch(
            this.buildUrl("/stats", { organization_id: organizationId }),
            { headers: this.getAuthHeader() }
        )

        if (!response.ok) {
            // Stats endpoint might not exist, return empty object
            return {}
        }

        return response.json()
    }
}
