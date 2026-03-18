/**
 * Properties List Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Building2,
    MapPin,
    SquareStack,
    Euro,
    TrendingUp,
    Home,
    Key,
} from "lucide-react"
import { EntityList } from "@/components/entity"
import { useProperties } from "@/lib/hooks/use-properties"
import type { Property, PropertyStatus, PropertyType } from "@/lib/types/entity"

type ViewMode = "list" | "grid" | "table"

export default function PropertiesPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>("list")

    const {
        items: properties,
        loading,
        error,
        totalItems,
        page,
        totalPages,
        searchQuery,
        setSearchQuery,
        setPage,
        getStatusInfo,
        getTypeLabel,
        calculateYield,
        formatAddress,
    } = useProperties({ autoLoad: true })

    // Handle property selection
    const handleSelect = useCallback((property: Property) => {
        router.push(`/dashboard/properties/${property.id}`)
    }, [router])

    // Handle new property
    const handleNew = useCallback(() => {
        router.push("/dashboard/properties/new")
    }, [router])

    // Get icon for property type
    const getPropertyIcon = (property: Property) => {
        switch (property.property_type) {
            case "house":
                return Home
            case "apartment":
            case "studio":
                return Building2
            default:
                return Key
        }
    }

    // Get avatar color based on status
    const getAvatarColor = (property: Property) => {
        switch (property.status) {
            case "rented":
                return "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
            case "available":
                return "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            case "under_renovation":
                return "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
            default:
                return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)"
        }
    }

    // Format currency
    const formatCurrency = (amount?: number) => {
        if (!amount) return "—"
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <EntityList<Property>
                items={properties}
                loading={loading}
                error={error}
                title="Propriétés"
                subtitle="Gérez votre patrimoine immobilier"
                emptyTitle="Aucune propriété"
                emptyDescription="Commencez par ajouter votre premier bien immobilier"
                emptyIcon={Building2}

                // Item rendering
                getTitle={(p) => p.name}
                getSubtitle={(p) => {
                    return p.address ? `${p.address}, ${p.postal_code} ${p.city}` : "Adresse non renseignée"
                }}
                getIcon={getPropertyIcon}
                getAvatarColor={getAvatarColor}
                getStatus={(p) => getStatusInfo(p.status)}
                getBadges={(p) => [
                    { label: getTypeLabel(p.property_type), variant: "secondary" as const }
                ]}
                getMeta={(p) => [
                    { icon: SquareStack, value: `${p.surface_area} m²` },
                    { icon: MapPin, value: p.city || "—" },
                    ...(p.current_tenant_name ? [{ icon: Key, value: p.current_tenant_name }] : []),
                ]}
                getStats={(p) => [
                    {
                        value: formatCurrency(p.monthly_rent),
                        label: "Loyer mensuel",
                        variant: "highlight" as const,
                    },
                    {
                        value: `${calculateYield(p).toFixed(1)}%`,
                        label: "Rendement",
                        variant: calculateYield(p) >= 5 ? "success" as const : "default" as const,
                    },
                ]}

                // Navigation
                onSelect={handleSelect}
                onDoubleClick={handleSelect}

                // Search
                searchPlaceholder="Rechercher une propriété..."
                searchValue={searchQuery}
                onSearch={setSearchQuery}

                // Actions
                primaryAction={{
                    label: "Nouvelle propriété",
                    icon: Building2,
                    onClick: handleNew,
                }}
                actions={[
                    {
                        key: "edit",
                        label: "Modifier",
                        onClick: (p) => router.push(`/dashboard/properties/${p.id}/edit`),
                    },
                ]}

                // Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}

                // View
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showViewToggle={true}

                // Sorting
                sortOptions={[
                    { label: "Nom A-Z", value: "name_asc" },
                    { label: "Nom Z-A", value: "name_desc" },
                    { label: "Loyer ↑", value: "rent_asc" },
                    { label: "Loyer ↓", value: "rent_desc" },
                    { label: "Surface ↑", value: "surface_asc" },
                    { label: "Surface ↓", value: "surface_desc" },
                    { label: "Plus récent", value: "created_desc" },
                ]}
            />
        </div>
    )
}
