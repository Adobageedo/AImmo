import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api-client'
import type { EntityType, EntityCardData } from '@/types/entity-card'

interface UseEntityRelationsResult {
  relations: EntityCardData[]
  loading: boolean
  error: string | null
}

export function useEntityRelations(
  entityType: EntityType,
  entityId: string,
  relatedType: EntityType,
  organizationId: string,
  options?: { skip?: boolean }
): UseEntityRelationsResult {
  const [relations, setRelations] = useState<EntityCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si skip est true, ne pas faire l'appel API
    if (options?.skip) {
      setLoading(false)
      setRelations([])
      return
    }

    if (!entityId || !organizationId) {
      setLoading(false)
      return
    }

    const fetchRelations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Récupérer les relations via lease_relationships
        const response = await apiClient.get<any[]>(
          `/organizations/${organizationId}/lease-relationships`,
          {
            entity_type: entityType,
            entity_id: entityId
          }
        )

        if (!response.success || !response.data) {
          setRelations([])
          return
        }

        // Filtrer par le type de relation demandé
        const filteredRelations = response.data.filter(
          rel => rel.entity_type === relatedType || rel.related_entity_type === relatedType
        )

        // Récupérer les détails des entités liées
        const relatedEntityIds = filteredRelations.map(rel => 
          rel.entity_type === relatedType ? rel.entity_id : rel.related_entity_id
        )

        if (relatedEntityIds.length === 0) {
          setRelations([])
          return
        }

        // Récupérer les détails selon le type
        const detailsPromises = relatedEntityIds.map(async (id) => {
          const endpoint = getEntityEndpoint(relatedType, organizationId, id)
          const result = await apiClient.get(endpoint)
          return result.success ? result.data : null
        })

        const details = await Promise.all(detailsPromises)
        
        // Transformer en EntityCardData
        const cardData: EntityCardData[] = details
          .filter(Boolean)
          .map((entity, index) => {
            const relation = filteredRelations[index]
            return transformToCardData(relatedType, entity, relation?.metadata)
          })

        setRelations(cardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des relations')
        setRelations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRelations()
  }, [entityType, entityId, relatedType, organizationId])

  return { relations, loading, error }
}

function getEntityEndpoint(type: EntityType, orgId: string, id: string): string {
  switch (type) {
    case 'property':
      return `/organizations/${orgId}/properties/${id}`
    case 'owner':
      return `/organizations/${orgId}/owners/${id}`
    case 'tenant':
      return `/organizations/${orgId}/tenants/${id}`
    case 'lease':
      return `/organizations/${orgId}/leases/${id}`
    default:
      return ''
  }
}

function transformToCardData(
  type: EntityType,
  entity: any,
  metadata?: Record<string, any>
): EntityCardData {
  const baseData: EntityCardData = {
    id: entity.id,
    type,
    name: '',
    essentialInfo: {}
  }

  switch (type) {
    case 'property':
      baseData.name = entity.name || entity.address || 'Propriété'
      baseData.essentialInfo = {
        address: entity.address,
        city: entity.city,
        type: entity.type
      }
      break

    case 'owner':
      baseData.name = `${entity.first_name} ${entity.last_name}`
      baseData.essentialInfo = {
        email: entity.email,
        phone: entity.phone,
        percentage: metadata?.percentage,
        isMainOwner: metadata?.is_main_owner
      }
      break

    case 'tenant':
      baseData.name = `${entity.first_name} ${entity.last_name}`
      baseData.essentialInfo = {
        email: entity.email,
        phone: entity.phone,
        isMainTenant: metadata?.is_main_tenant
      }
      break

    case 'lease':
      baseData.name = `Bail ${entity.lease_type || ''}`
      baseData.essentialInfo = {
        monthlyRent: entity.monthly_rent,
        startDate: entity.start_date,
        endDate: entity.end_date,
        status: entity.status
      }
      break
  }

  return baseData
}
