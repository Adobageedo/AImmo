/**
 * Owners Hook - Specialized hook for owner management
 */

"use client"

import { useCallback, useMemo } from "react"
import { useEntity, UseEntityOptions, UseEntityResult } from "./use-entity"
import { ownerService, OwnerListParams } from "@/lib/services/owner-service"
import type {
    Owner,
    OwnerCreateRequest,
    OwnerUpdateRequest,
} from "@/lib/types/entity"

export interface UseOwnersOptions extends UseEntityOptions<Owner> {}

export interface UseOwnersResult extends UseEntityResult<Owner, OwnerCreateRequest, OwnerUpdateRequest> {
    // Owner-specific helpers
    formatOwnerName: (owner: Owner) => string
    getInitials: (owner: Owner) => string
}

export function useOwners(options: UseOwnersOptions = {}): UseOwnersResult {
    const { ...entityOptions } = options

    // Use base entity hook
    const entityResult = useEntity<Owner, OwnerCreateRequest, OwnerUpdateRequest>(
        ownerService,
        "owner",
        entityOptions
    )

    // Expose service helpers
    const formatOwnerName = useCallback((owner: Owner) => {
        return ownerService.formatOwnerName(owner)
    }, [])

    const getInitials = useCallback((owner: Owner) => {
        return ownerService.getInitials(owner)
    }, [])

    return {
        ...entityResult,
        formatOwnerName,
        getInitials,
    }
}

// Export type for external use
export type { Owner, OwnerCreateRequest, OwnerUpdateRequest }
