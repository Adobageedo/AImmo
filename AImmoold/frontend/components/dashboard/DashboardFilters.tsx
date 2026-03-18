"use client"

// Dashboard Filters Component - Phase 7: Portfolio Dashboard MVP
// Filtres globaux pour le dashboard

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Filter, X, ChevronDown, Calendar, Building2, MapPin } from "lucide-react"
import type { DashboardFilters } from "@/lib/types/dashboard"

interface DashboardFiltersBarProps {
    filters: DashboardFilters
    onFilterChange: (filters: Partial<DashboardFilters>) => void
    propertyTypes?: string[]
    cities?: string[]
    className?: string
}

export function DashboardFiltersBar({
    filters,
    onFilterChange,
    propertyTypes = [],
    cities = [],
    className,
}: DashboardFiltersBarProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const activeFiltersCount = [
        filters.propertyType,
        filters.city,
        filters.occupancyStatus !== "all" ? filters.occupancyStatus : null,
        filters.dateRange,
    ].filter(Boolean).length

    const clearAllFilters = () => {
        onFilterChange({
            propertyType: undefined,
            city: undefined,
            occupancyStatus: "all",
            dateRange: undefined,
        })
    }

    return (
        <div className={cn("dashboard__filters", className)}>
            {/* Filter toggle button */}
            <div className="dashboard__filters-header">
                <button
                    className="dashboard__filters-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Filter className="dashboard__filters-toggle-icon" />
                    <span>Filtres</span>
                    {activeFiltersCount > 0 && (
                        <span className="dashboard__filters-badge">{activeFiltersCount}</span>
                    )}
                    <ChevronDown
                        className={cn(
                            "dashboard__filters-chevron",
                            isExpanded && "dashboard__filters-chevron--open"
                        )}
                    />
                </button>

                {activeFiltersCount > 0 && (
                    <button
                        className="dashboard__filters-clear"
                        onClick={clearAllFilters}
                    >
                        <X className="dashboard__filters-clear-icon" />
                        Effacer tout
                    </button>
                )}
            </div>

            {/* Expanded filters panel */}
            {isExpanded && (
                <div className="dashboard__filters-panel">
                    {/* Property Type Filter */}
                    <div className="dashboard__filters-group">
                        <label className="dashboard__filters-label">
                            <Building2 className="dashboard__filters-label-icon" />
                            Type de bien
                        </label>
                        <select
                            className="dashboard__filters-select"
                            value={filters.propertyType || ""}
                            onChange={(e) =>
                                onFilterChange({
                                    propertyType: e.target.value || undefined,
                                })
                            }
                        >
                            <option value="">Tous les types</option>
                            {propertyTypes.map((type) => (
                                <option key={type} value={type}>
                                    {translatePropertyType(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Filter */}
                    <div className="dashboard__filters-group">
                        <label className="dashboard__filters-label">
                            <MapPin className="dashboard__filters-label-icon" />
                            Ville
                        </label>
                        <select
                            className="dashboard__filters-select"
                            value={filters.city || ""}
                            onChange={(e) =>
                                onFilterChange({
                                    city: e.target.value || undefined,
                                })
                            }
                        >
                            <option value="">Toutes les villes</option>
                            {cities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Occupancy Status Filter */}
                    <div className="dashboard__filters-group">
                        <label className="dashboard__filters-label">Occupation</label>
                        <div className="dashboard__filters-radio-group">
                            <label className="dashboard__filters-radio">
                                <input
                                    type="radio"
                                    name="occupancy"
                                    checked={filters.occupancyStatus === "all"}
                                    onChange={() => onFilterChange({ occupancyStatus: "all" })}
                                />
                                <span>Tous</span>
                            </label>
                            <label className="dashboard__filters-radio">
                                <input
                                    type="radio"
                                    name="occupancy"
                                    checked={filters.occupancyStatus === "occupied"}
                                    onChange={() => onFilterChange({ occupancyStatus: "occupied" })}
                                />
                                <span>Occupé</span>
                            </label>
                            <label className="dashboard__filters-radio">
                                <input
                                    type="radio"
                                    name="occupancy"
                                    checked={filters.occupancyStatus === "vacant"}
                                    onChange={() => onFilterChange({ occupancyStatus: "vacant" })}
                                />
                                <span>Vacant</span>
                            </label>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="dashboard__filters-group dashboard__filters-group--wide">
                        <label className="dashboard__filters-label">
                            <Calendar className="dashboard__filters-label-icon" />
                            Période
                        </label>
                        <div className="dashboard__filters-date-range">
                            <input
                                type="date"
                                className="dashboard__filters-date-input"
                                value={filters.dateRange?.start || ""}
                                onChange={(e) =>
                                    onFilterChange({
                                        dateRange: {
                                            start: e.target.value,
                                            end: filters.dateRange?.end || "",
                                        },
                                    })
                                }
                            />
                            <span className="dashboard__filters-date-separator">à</span>
                            <input
                                type="date"
                                className="dashboard__filters-date-input"
                                value={filters.dateRange?.end || ""}
                                onChange={(e) =>
                                    onFilterChange({
                                        dateRange: {
                                            start: filters.dateRange?.start || "",
                                            end: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Active filter pills */}
            {activeFiltersCount > 0 && !isExpanded && (
                <div className="dashboard__filters-pills">
                    {filters.propertyType && (
                        <FilterPill
                            label={translatePropertyType(filters.propertyType)}
                            onRemove={() => onFilterChange({ propertyType: undefined })}
                        />
                    )}
                    {filters.city && (
                        <FilterPill
                            label={filters.city}
                            onRemove={() => onFilterChange({ city: undefined })}
                        />
                    )}
                    {filters.occupancyStatus && filters.occupancyStatus !== "all" && (
                        <FilterPill
                            label={filters.occupancyStatus === "occupied" ? "Occupé" : "Vacant"}
                            onRemove={() => onFilterChange({ occupancyStatus: "all" })}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

// Filter Pill Component
function FilterPill({
    label,
    onRemove,
}: {
    label: string
    onRemove: () => void
}) {
    return (
        <span className="dashboard__filters-pill">
            {label}
            <button
                className="dashboard__filters-pill-remove"
                onClick={onRemove}
                aria-label={`Supprimer le filtre ${label}`}
            >
                <X className="dashboard__filters-pill-remove-icon" />
            </button>
        </span>
    )
}

// Helper function
function translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
        apartment: "Appartement",
        house: "Maison",
        commercial: "Commercial",
        office: "Bureau",
        warehouse: "Entrepôt",
        parking: "Parking",
        land: "Terrain",
        other: "Autre",
    }
    return translations[type.toLowerCase()] || type
}

export default DashboardFiltersBar
