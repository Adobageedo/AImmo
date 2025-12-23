/**
 * Properties Hook - Specialized hook for property management
 * Phase 6 - Business UI Foundation
 */

"use client"

import { useCallback, useMemo } from "react"
import { useEntity, UseEntityOptions, UseEntityResult } from "./use-entity"
import { propertyService, PropertyListParams } from "@/lib/services/property-service"
import type {
    Property,
    PropertyCreateRequest,
    PropertyUpdateRequest,
    PropertyStats,
    PropertyStatus,
    PropertyType,
} from "@/lib/types/entity"

export interface UsePropertiesOptions extends UseEntityOptions<Property> {
    status?: PropertyStatus
    propertyType?: PropertyType
}

export interface UsePropertiesResult extends UseEntityResult<Property, PropertyCreateRequest, PropertyUpdateRequest> {
    // Property-specific computed data
    propertyStats: PropertyStats | null
    availableProperties: Property[]
    rentedProperties: Property[]

    // Property-specific filters
    filterByStatus: (status: PropertyStatus | null) => void
    filterByType: (type: PropertyType | null) => void

    // Property-specific helpers
    calculateYield: (property: Property) => number
    formatAddress: (property: Property) => string
    getTypeLabel: (type: PropertyType) => string
    getStatusInfo: (status: PropertyStatus) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
}

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesResult {
    const { status, propertyType, ...entityOptions } = options

    // Build initial filters from options
    const initialFilters: Partial<PropertyListParams> = {
        ...entityOptions.initialFilters,
    }
    if (status) initialFilters.status = status
    if (propertyType) initialFilters.property_type = propertyType

    // Use base entity hook
    const entityResult = useEntity<Property, PropertyCreateRequest, PropertyUpdateRequest>(
        propertyService,
        "property",
        { ...entityOptions, initialFilters }
    )

    // Compute property statistics from stats
    const propertyStats = useMemo(() => {
        if (!entityResult.stats || Object.keys(entityResult.stats).length === 0) {
            return null
        }
        return entityResult.stats as unknown as PropertyStats
    }, [entityResult.stats])

    // Filter available properties
    const availableProperties = useMemo(() => {
        return entityResult.items.filter(p => p.status === "available")
    }, [entityResult.items])

    // Filter rented properties
    const rentedProperties = useMemo(() => {
        return entityResult.items.filter(p => p.status === "rented")
    }, [entityResult.items])

    // Filter by status
    const filterByStatus = useCallback((status: PropertyStatus | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            status: status || undefined,
        })
    }, [entityResult])

    // Filter by type
    const filterByType = useCallback((type: PropertyType | null) => {
        entityResult.setFilters({
            ...entityResult.filters,
            property_type: type || undefined,
        })
    }, [entityResult])

    // Expose service helpers
    const calculateYield = useCallback((property: Property) => {
        return propertyService.calculateYield(property)
    }, [])

    const formatAddress = useCallback((property: Property) => {
        return propertyService.formatAddress(property)
    }, [])

    const getTypeLabel = useCallback((type: PropertyType) => {
        return propertyService.getTypeLabel(type)
    }, [])

    const getStatusInfo = useCallback((status: PropertyStatus) => {
        return propertyService.getStatusInfo(status)
    }, [])

    return {
        ...entityResult,
        propertyStats,
        availableProperties,
        rentedProperties,
        filterByStatus,
        filterByType,
        calculateYield,
        formatAddress,
        getTypeLabel,
        getStatusInfo,
    }
}

// Export type for external use
export type { Property, PropertyCreateRequest, PropertyUpdateRequest, PropertyStats }
