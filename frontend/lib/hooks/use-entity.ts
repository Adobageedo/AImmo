/**
 * Generic Entity Hook - Base hook for all entity CRUD operations
 * Phase 6 - Business UI Foundation
 */

"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import type { BaseEntity, EntityType } from "@/lib/types/entity"
import type { EntityService, ListParams, ListResponse } from "@/lib/services/entity-service"

export interface UseEntityOptions<T> {
    autoLoad?: boolean
    initialFilters?: Partial<ListParams>
    pageSize?: number
    sortBy?: keyof T
    sortDirection?: "asc" | "desc"
}

export interface UseEntityResult<T extends BaseEntity, TCreate, TUpdate> {
    // Data
    items: T[]
    selectedItem: T | null
    stats: Record<string, unknown>

    // Pagination
    page: number
    totalPages: number
    totalItems: number
    pageSize: number

    // UI State
    loading: boolean
    loadingItem: boolean
    saving: boolean
    deleting: boolean
    error: string | null

    // Actions
    loadItems: (filters?: Partial<ListParams>) => Promise<void>
    loadItem: (id: string) => Promise<T | null>
    createItem: (data: TCreate) => Promise<T | null>
    updateItem: (id: string, data: TUpdate) => Promise<T | null>
    deleteItem: (id: string) => Promise<boolean>
    loadStats: () => Promise<void>

    // Selection
    selectItem: (item: T | null) => void

    // Pagination
    setPage: (page: number) => void
    setPageSize: (size: number) => void

    // Filters & Sorting
    filters: Partial<ListParams>
    setFilters: (filters: Partial<ListParams>) => void
    sortBy: string | null
    sortDirection: "asc" | "desc"
    setSorting: (field: string, direction: "asc" | "desc") => void

    // Search
    searchQuery: string
    setSearchQuery: (query: string) => void

    // Utilities
    clearError: () => void
    refresh: () => Promise<void>
}

export function useEntity<
    T extends BaseEntity,
    TCreate = Partial<T>,
    TUpdate = Partial<T>
>(
    service: EntityService<T, TCreate, TUpdate>,
    _entityType: EntityType,
    options: UseEntityOptions<T> = {}
): UseEntityResult<T, TCreate, TUpdate> {
    const { currentOrganizationId } = useAuthStore()

    const {
        autoLoad = true,
        initialFilters = {},
        pageSize: initialPageSize = 20,
        sortBy: initialSortBy,
        sortDirection: initialSortDirection = "desc",
    } = options

    // Data state
    const [items, setItems] = useState<T[]>([])
    const [selectedItem, setSelectedItem] = useState<T | null>(null)
    const [stats, setStats] = useState<Record<string, unknown>>({})

    // Pagination state
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [pageSize, setPageSize] = useState(initialPageSize)

    // UI state
    const [loading, setLoading] = useState(false)
    const [loadingItem, setLoadingItem] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filter & search state
    const [filters, setFilters] = useState<Partial<ListParams>>(initialFilters)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<string | null>(initialSortBy as string || null)
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSortDirection)

    /**
     * Load items with current filters and pagination
     */
    const loadItems = useCallback(async (additionalFilters?: Partial<ListParams>) => {
        if (!currentOrganizationId) {
            setError("Aucune organisation sélectionnée")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const params: ListParams = {
                page,
                limit: pageSize,
                ...filters,
                ...additionalFilters,
            }

            if (searchQuery) {
                params.search = searchQuery
            }

            if (sortBy) {
                params.sort_by = sortBy
                params.sort_direction = sortDirection
            }

            const response = await service.list(currentOrganizationId, params)

            // Handle both paginated and non-paginated responses
            if (Array.isArray(response)) {
                setItems(response)
                setTotalItems(response.length)
                setTotalPages(1)
            } else {
                const paginatedResponse = response as ListResponse<T>
                setItems(paginatedResponse.items || [])
                setTotalItems(paginatedResponse.total || 0)
                setTotalPages(paginatedResponse.total_pages || 1)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du chargement")
            setItems([])
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId, service, page, pageSize, filters, searchQuery, sortBy, sortDirection])

    /**
     * Load a single item by ID
     */
    const loadItem = useCallback(async (id: string): Promise<T | null> => {
        if (!currentOrganizationId) {
            setError("Aucune organisation sélectionnée")
            return null
        }

        setLoadingItem(true)
        setError(null)

        try {
            const item = await service.get(id, currentOrganizationId)
            setSelectedItem(item)
            return item
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du chargement")
            return null
        } finally {
            setLoadingItem(false)
        }
    }, [currentOrganizationId, service])

    /**
     * Create a new item
     */
    const createItem = useCallback(async (data: TCreate): Promise<T | null> => {
        setSaving(true)
        setError(null)

        try {
            const item = await service.create(data)
            setItems(prev => [item, ...prev])
            setTotalItems(prev => prev + 1)
            return item
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la création")
            return null
        } finally {
            setSaving(false)
        }
    }, [service])

    /**
     * Update an existing item
     */
    const updateItem = useCallback(async (id: string, data: TUpdate): Promise<T | null> => {
        if (!currentOrganizationId) {
            setError("Aucune organisation sélectionnée")
            return null
        }

        setSaving(true)
        setError(null)

        try {
            const updated = await service.update(id, currentOrganizationId, data)

            // Update in list
            setItems(prev => prev.map(item => item.id === id ? updated : item))

            // Update selected if it's the same item
            if (selectedItem?.id === id) {
                setSelectedItem(updated)
            }

            return updated
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
            return null
        } finally {
            setSaving(false)
        }
    }, [currentOrganizationId, service, selectedItem])

    /**
     * Delete an item
     */
    const deleteItem = useCallback(async (id: string): Promise<boolean> => {
        if (!currentOrganizationId) {
            setError("Aucune organisation sélectionnée")
            return false
        }

        setDeleting(true)
        setError(null)

        try {
            await service.delete(id, currentOrganizationId)

            // Remove from list
            setItems(prev => prev.filter(item => item.id !== id))
            setTotalItems(prev => prev - 1)

            // Clear selection if deleted item was selected
            if (selectedItem?.id === id) {
                setSelectedItem(null)
            }

            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
            return false
        } finally {
            setDeleting(false)
        }
    }, [currentOrganizationId, service, selectedItem])

    /**
     * Load statistics
     */
    const loadStats = useCallback(async () => {
        if (!currentOrganizationId) return

        try {
            const statsData = await service.getStats(currentOrganizationId)
            setStats(statsData)
        } catch {
            // Stats are optional, don't set error
        }
    }, [currentOrganizationId, service])

    /**
     * Set sorting
     */
    const setSorting = useCallback((field: string, direction: "asc" | "desc") => {
        setSortBy(field)
        setSortDirection(direction)
    }, [])

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    /**
     * Refresh data
     */
    const refresh = useCallback(async () => {
        await loadItems()
        await loadStats()
    }, [loadItems, loadStats])

    /**
     * Select item helper
     */
    const selectItem = useCallback((item: T | null) => {
        setSelectedItem(item)
    }, [])

    // Auto-load on mount and when filters change
    useEffect(() => {
        if (autoLoad && currentOrganizationId) {
            loadItems()
        }
    }, [autoLoad, currentOrganizationId, page, filters, searchQuery, sortBy, sortDirection])

    // Memoize the return object to prevent unnecessary re-renders
    return useMemo(() => ({
        // Data
        items,
        selectedItem,
        stats,

        // Pagination
        page,
        totalPages,
        totalItems,
        pageSize,

        // UI State
        loading,
        loadingItem,
        saving,
        deleting,
        error,

        // Actions
        loadItems,
        loadItem,
        createItem,
        updateItem,
        deleteItem,
        loadStats,

        // Selection
        selectItem,

        // Pagination
        setPage,
        setPageSize,

        // Filters & Sorting
        filters,
        setFilters,
        sortBy,
        sortDirection,
        setSorting,

        // Search
        searchQuery,
        setSearchQuery,

        // Utilities
        clearError,
        refresh,
    }), [
        items, selectedItem, stats,
        page, totalPages, totalItems, pageSize,
        loading, loadingItem, saving, deleting, error,
        loadItems, loadItem, createItem, updateItem, deleteItem, loadStats,
        selectItem, filters, sortBy, sortDirection, setSorting,
        searchQuery, clearError, refresh,
    ])
}
