"use client"

import { useState, useCallback } from "react"
import { ownerService } from "@/services/owner.service"
import type { Owner } from "@/types/owner"
import type { PaginationParams } from "@/types/common"

export function useOwners(organizationId: string) {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOwners = useCallback(async (params?: PaginationParams & { includeRelationships?: boolean }) => {
    if (!organizationId) return

    setLoading(true)
    setError(null)
    try {
      // Par défaut, inclure les relationships pour optimiser les performances
      const includeRelationships = params?.includeRelationships !== false;
      const serviceParams: PaginationParams & { includeRelationships?: boolean } = {
        page: params?.page || 1,
        limit: params?.limit || 20,
        includeRelationships
      };
      
      const response = await ownerService.getAll(organizationId, serviceParams)
      if (response.success && response.data) {
        // Handle both paginated response and direct array response
        if (Array.isArray(response.data)) {
          setOwners(response.data);
        } else {
          setOwners(response.data.data);
        }
      } else {
        setError(response.error || "Erreur lors du chargement des propriétaires")
      }
    } catch (err) {
      setError("Erreur lors du chargement des propriétaires")
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const deleteOwner = useCallback(async (id: string) => {
    if (!organizationId) return false

    try {
      const response = await ownerService.delete(organizationId, id)
      if (response.success) {
        setOwners(prev => prev.filter(owner => owner.id !== id))
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }, [organizationId])

  return {
    owners,
    loading,
    error,
    fetchOwners,
    deleteOwner,
  }
}
