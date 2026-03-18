"use client"

import { useMemo } from 'react'
import { EntityCard } from './EntityCard'
import type { EntityType, EntityCardData } from '@/types/entity-card'

interface EntityColumnProps {
  entityType: EntityType
  entityId: string
  relatedType: EntityType
  organizationId: string
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  // Relationships préchargées (optimisation)
  preloadedRelationships?: {
    properties?: Array<{ id: string; relationship_id: string; metadata?: any }>
    owners?: Array<{ id: string; relationship_id: string; metadata?: any }>
    tenants?: Array<{ id: string; relationship_id: string; metadata?: any }>
    leases?: Array<{ id: string; relationship_id: string; metadata?: any }>
    property?: { id: string; relationship_id: string; metadata?: any } | null
  }
}

export function EntityColumn({
  entityType,
  entityId,
  relatedType,
  organizationId,
  maxDisplay = 3,
  size = 'sm',
  preloadedRelationships
}: EntityColumnProps) {
  // Si on a des relationships préchargées, les utiliser directement
  const hasPreloadedData = useMemo(() => {
    if (!preloadedRelationships) return false;
    
    let hasData = false;
    switch (relatedType) {
      case 'property':
        hasData = !!preloadedRelationships.property || ((preloadedRelationships.properties?.length ?? 0) > 0);
        break;
      case 'owner':
        hasData = (preloadedRelationships.owners?.length ?? 0) > 0;
        break;
      case 'tenant':
        hasData = (preloadedRelationships.tenants?.length ?? 0) > 0;
        break;
      case 'lease':
        hasData = (preloadedRelationships.leases?.length ?? 0) > 0;
        break;
      default:
        hasData = false;
    }

    return hasData;
  }, [preloadedRelationships, relatedType]);

  // Convertir les relationships préchargées en EntityCardData
  const preloadedCards = useMemo(() => {
    if (!preloadedRelationships) return [];
    
    const getRelationships = () => {
      switch (relatedType) {
        case 'property':
          return preloadedRelationships.property ? [preloadedRelationships.property] : (preloadedRelationships.properties || []);
        case 'owner':
          return preloadedRelationships.owners || [];
        case 'tenant':
          return preloadedRelationships.tenants || [];
        case 'lease':
          return preloadedRelationships.leases || [];
        default:
          return [];
      }
    };

    const rels = getRelationships();
    
    // Transformer en EntityCardData avec les données complètes
    return rels.map(rel => {
      let name = '';
      let essentialInfo: Record<string, any> = rel.metadata || {};

      switch (relatedType) {
        case 'property':
          name = (rel as any).name || `Property ${rel.id.substring(0, 8)}`;
          if ((rel as any).address) essentialInfo.address = (rel as any).address;
          if ((rel as any).city) essentialInfo.city = (rel as any).city;
          break;
        case 'owner':
        case 'tenant':
          const firstName = (rel as any).first_name || '';
          const lastName = (rel as any).last_name || '';
          name = firstName || lastName ? `${firstName} ${lastName}`.trim() : `${relatedType} ${rel.id.substring(0, 8)}`;
          if ((rel as any).email) essentialInfo.email = (rel as any).email;
          break;
        case 'lease':
          // Afficher les dates et le montant du bail
          const startDate = (rel as any).start_date;
          const endDate = (rel as any).end_date;
          const monthlyRent = (rel as any).monthly_rent;
          
          if (startDate && endDate) {
            name = `Bail ${new Date(startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
          } else {
            name = `Bail ${rel.id.substring(0, 8)}`;
          }
          
          if (monthlyRent) essentialInfo.loyer = `${monthlyRent}€/mois`;
          if ((rel as any).status) essentialInfo.statut = (rel as any).status;
          break;
        default:
          name = `${relatedType} ${rel.id.substring(0, 8)}`;
      }

      return {
        id: rel.id,
        type: relatedType,
        name,
        essentialInfo
      } as EntityCardData;
    });
  }, [preloadedRelationships, relatedType]);

  // Utiliser UNIQUEMENT les données préchargées
  // Pas de fallback hook pour éviter les N+1 queries
  const finalRelations = preloadedCards;

  
  if (finalRelations.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Aucun
      </div>
    )
  }

  const displayedRelations = finalRelations.slice(0, maxDisplay)
  const remainingCount = finalRelations.length - maxDisplay

  return (
    <div className="flex flex-col gap-1">
      {displayedRelations.map((relation) => (
        <EntityCard
          key={relation.id}
          data={relation}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div className="text-xs text-muted-foreground px-2">
          +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
