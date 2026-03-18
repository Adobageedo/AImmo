"use client"

// Geographic Map Component - Phase 7: Portfolio Dashboard MVP
// Carte géographique simple pour visualiser les propriétés

import { cn } from "@/lib/utils"
import { MapPin, Building2 } from "lucide-react"
import type { PropertyLocation, GeoRegion } from "@/lib/types/dashboard"
import { formatCurrency, formatPercentage } from "@/lib/dashboardCalculations"

interface GeoMapProps {
    properties: PropertyLocation[]
    regions?: GeoRegion[]
    onPropertyClick?: (property: PropertyLocation) => void
    selectedPropertyId?: string
    className?: string
}

export function GeoMap({
    properties,
    regions,
    onPropertyClick,
    selectedPropertyId,
    className,
}: GeoMapProps) {
    // Group properties by city if regions not provided
    const displayRegions = regions || groupByCity(properties)

    return (
        <div className={cn("dashboard__geo-map", className)}>
            <div className="dashboard__geo-map-header">
                <h3 className="dashboard__geo-map-title">
                    <MapPin className="dashboard__geo-map-title-icon" />
                    Répartition géographique
                </h3>
                <span className="dashboard__geo-map-count">
                    {properties.length} bien{properties.length > 1 ? "s" : ""}
                </span>
            </div>

            {/* City/Region cards */}
            <div className="dashboard__geo-map-regions">
                {displayRegions.length === 0 ? (
                    <div className="dashboard__geo-map-empty">
                        <Building2 className="dashboard__geo-map-empty-icon" />
                        <p>Aucune propriété enregistrée</p>
                    </div>
                ) : (
                    displayRegions.map((region, index) => (
                        <RegionCard key={index} region={region} />
                    ))
                )}
            </div>

            {/* Property list */}
            {properties.length > 0 && (
                <div className="dashboard__geo-map-properties">
                    <h4 className="dashboard__geo-map-properties-title">Détail par bien</h4>
                    <div className="dashboard__geo-map-properties-list">
                        {properties.map((property) => (
                            <PropertyListItem
                                key={property.id}
                                property={property}
                                isSelected={property.id === selectedPropertyId}
                                onClick={() => onPropertyClick?.(property)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// Region Card Component
function RegionCard({ region }: { region: GeoRegion }) {
    const occupancyColor =
        region.occupancyRate >= 80
            ? "dashboard__geo-map-region--success"
            : region.occupancyRate >= 50
                ? "dashboard__geo-map-region--warning"
                : "dashboard__geo-map-region--danger"

    return (
        <div className={cn("dashboard__geo-map-region", occupancyColor)}>
            <div className="dashboard__geo-map-region-header">
                <MapPin className="dashboard__geo-map-region-icon" />
                <span className="dashboard__geo-map-region-name">{region.name}</span>
            </div>

            <div className="dashboard__geo-map-region-stats">
                <div className="dashboard__geo-map-region-stat">
                    <span className="dashboard__geo-map-region-stat-value">
                        {region.propertyCount}
                    </span>
                    <span className="dashboard__geo-map-region-stat-label">Biens</span>
                </div>

                <div className="dashboard__geo-map-region-stat">
                    <span className="dashboard__geo-map-region-stat-value">
                        {formatPercentage(region.occupancyRate, 0)}
                    </span>
                    <span className="dashboard__geo-map-region-stat-label">Occupé</span>
                </div>

                {region.totalValue > 0 && (
                    <div className="dashboard__geo-map-region-stat">
                        <span className="dashboard__geo-map-region-stat-value">
                            {formatCurrency(region.totalValue)}
                        </span>
                        <span className="dashboard__geo-map-region-stat-label">Valeur</span>
                    </div>
                )}
            </div>

            {/* Occupancy bar */}
            <div className="dashboard__geo-map-region-bar">
                <div
                    className="dashboard__geo-map-region-bar-fill"
                    style={{ width: `${region.occupancyRate}%` }}
                />
            </div>
        </div>
    )
}

// Property List Item
function PropertyListItem({
    property,
    isSelected,
    onClick,
}: {
    property: PropertyLocation
    isSelected: boolean
    onClick?: () => void
}) {
    const statusClass =
        property.occupancyStatus === "occupied"
            ? "dashboard__geo-map-property--occupied"
            : property.occupancyStatus === "vacant"
                ? "dashboard__geo-map-property--vacant"
                : "dashboard__geo-map-property--partial"

    return (
        <button
            className={cn(
                "dashboard__geo-map-property",
                statusClass,
                isSelected && "dashboard__geo-map-property--selected"
            )}
            onClick={onClick}
        >
            <div className="dashboard__geo-map-property-indicator" />
            <div className="dashboard__geo-map-property-info">
                <span className="dashboard__geo-map-property-name">{property.name}</span>
                <span className="dashboard__geo-map-property-address">
                    {property.city}, {property.postalCode}
                </span>
            </div>
            <div className="dashboard__geo-map-property-status">
                {property.occupancyStatus === "occupied" ? "Occupé" : "Vacant"}
            </div>
        </button>
    )
}

// Helper function to group properties by city
function groupByCity(properties: PropertyLocation[]): GeoRegion[] {
    const cityMap = new Map<string, PropertyLocation[]>()

    properties.forEach((property) => {
        const existing = cityMap.get(property.city) || []
        cityMap.set(property.city, [...existing, property])
    })

    return Array.from(cityMap.entries())
        .map(([name, props]) => {
            const occupiedCount = props.filter(
                (p) => p.occupancyStatus === "occupied"
            ).length

            return {
                name,
                propertyCount: props.length,
                totalValue: props.reduce((sum, p) => sum + (p.estimatedValue || 0), 0),
                occupancyRate:
                    props.length > 0 ? (occupiedCount / props.length) * 100 : 0,
            }
        })
        .sort((a, b) => b.propertyCount - a.propertyCount)
}

export default GeoMap
