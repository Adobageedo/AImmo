/**
 * Property Detail Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    Building2,
    MapPin,
    SquareStack,
    Euro,
    TrendingUp,
    Calendar,
    FileText,
    Users,
    Home,
    Zap,
    Thermometer,
    Car,
    Trees,
} from "lucide-react"
import { EntityDetail, AddressInfoSection, DocumentsList } from "@/components/entity"
import { useProperties, useEntityDocuments } from "@/lib/hooks"
import type { Property } from "@/lib/types/entity"

export default function PropertyDetailPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string

    const {
        selectedItem: property,
        loadingItem: loading,
        error,
        loadItem,
        deleteItem,
        getStatusInfo,
        getTypeLabel,
        calculateYield,
        formatAddress,
    } = useProperties({ autoLoad: false })
    console.log("Property:", property);

    // Use entity documents hook
    const { documents: propertyDocuments } = useEntityDocuments({
        entityType: "property",
        entityId: propertyId,
    })

    // Load property on mount
    useEffect(() => {
        if (propertyId) {
            loadItem(propertyId)
        }
    }, [propertyId, loadItem])

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!property) return

        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer "${property.name}" ? Cette action est irréversible.`
        )

        if (confirmed) {
            const success = await deleteItem(property.id)
            if (success) {
                router.push("/dashboard/properties")
            }
        }
    }, [property, deleteItem, router])

    // Format currency
    const formatCurrency = (amount?: number) => {
        if (!amount) return "Non renseigné"
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(amount)
    }

    // Format date
    const formatDate = (date?: string) => {
        if (!date) return "Non renseignée"
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    }

    if (!property && !loading && !error) {
        return null
    }

    const status = property ? getStatusInfo(property.status) : null
    const yieldValue = property ? calculateYield(property) : 0

    // Build info items
    const buildInfoItems = (p: Property) => [
        { label: "Type de bien", value: getTypeLabel(p.property_type) },
        { label: "Surface", value: `${p.surface_area} m²` },
        { label: "Année de construction", value: p.construction_year ? `${p.construction_year}` : undefined, empty: !p.construction_year },
        { label: "Dernière rénovation", value: p.last_renovation_year ? `${p.last_renovation_year}` : undefined, empty: !p.last_renovation_year },
        { label: "Classe énergie (DPE)", value: p.energy_class || undefined, empty: !p.energy_class },
        { label: "Classe GES", value: p.ges_class || undefined, empty: !p.ges_class },
    ]

    // Build financial items
    const buildFinancialItems = (p: Property) => [
        { label: "Prix d'achat", value: formatCurrency(p.purchase_price), highlight: true, empty: !p.purchase_price },
        { label: "Date d'achat", value: formatDate(p.purchase_date), empty: !p.purchase_date },
        { label: "Valeur actuelle", value: formatCurrency(p.current_value), empty: !p.current_value },
        { label: "Loyer mensuel", value: formatCurrency(p.monthly_rent), highlight: true, empty: !p.monthly_rent },
        { label: "Charges mensuelles", value: formatCurrency(p.monthly_charges), empty: !p.monthly_charges },
        { label: "Taxe foncière", value: formatCurrency(p.property_tax), empty: !p.property_tax },
    ]

    return (
        <EntityDetail
            title={property?.name || "Chargement..."}
            subtitle={property ? formatAddress(property).split("\n")[0] : undefined}
            icon={Building2}
            status={status || undefined}
            badges={property ? [{ label: getTypeLabel(property.property_type), variant: "secondary" as const }] : []}
            meta={property ? [
                { icon: SquareStack, value: `${property.surface_area} m²` },
                { icon: MapPin, value: property.city || "—" },
            ] : []}

            backHref="/dashboard/properties"
            backLabel="Propriétés"

            editHref={property ? `/dashboard/properties/${property.id}/edit` : undefined}
            onDelete={property ? handleDelete : undefined}

            loading={loading}
            error={error}
            createdAt={property?.created_at}
            updatedAt={property?.updated_at}

            stats={property ? [
                {
                    label: "Loyer mensuel",
                    value: formatCurrency(parseFloat(property.monthly_rent as any) || 0),
                    icon: Euro,
                    variant: "highlight",
                },
                {
                    label: "Rendement brut",
                    value: `${yieldValue.toFixed(1)}%`,
                    icon: TrendingUp,
                    variant: yieldValue >= 5 ? "success" : yieldValue >= 3 ? "default" : "warning",
                },
                {
                    label: "Valeur actuelle",
                    value: formatCurrency(
                        parseFloat(property.current_value as any) || 
                        parseFloat(property.purchase_price as any) || 
                        0
                    ),
                    icon: Building2,
                },
                {
                    label: "Charges annuelles",
                    value: formatCurrency(
                        (parseFloat(property.monthly_charges as any) || 0) * 12 + 
                        (parseFloat(property.property_tax as any) || 0)
                    ),
                    icon: Calendar,
                },
            ] : []}

            sections={property ? [
                {
                    id: "info",
                    title: "Informations générales",
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildInfoItems(property).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`text-gray-900 ${item.empty ? "text-gray-400 italic" : ""}`}>
                                        {item.empty ? "Non renseigné" : item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                AddressInfoSection({
                    address: property.address,
                    city: property.city,
                    postalCode: property.postal_code,
                    country: property.country,
                }),
                {
                    id: "financial",
                    title: "Données financières",
                    icon: Euro,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildFinancialItems(property).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`${item.highlight ? "font-semibold text-indigo-600" : "text-gray-900"} ${item.empty ? "text-gray-400 italic font-normal" : ""}`}>
                                        {item.empty ? "Non renseigné" : item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
            ] : []}

            relatedItems={property ? [
                ...(property.owner_id ? [{
                    id: "owner",
                    title: "Propriétaire",
                    subtitle: "Voir la fiche propriétaire",
                    icon: Users,
                    href: `/dashboard/owners/${property.owner_id}`,
                }] : []),
                ...(property.source_document_id ? [{
                    id: "source_document",
                    title: "Document source",
                    subtitle: "Bail ayant créé cette propriété",
                    icon: FileText,
                    href: `/dashboard/documents/${property.source_document_id}`,
                }] : []),
                ...(property.current_lease_id ? [{
                    id: "lease",
                    title: "Bail actif",
                    subtitle: "Voir le bail en cours",
                    icon: FileText,
                    href: `/dashboard/leases/${property.current_lease_id}`,
                }] : []),
                ...(property.current_tenant_id ? [{
                    id: "tenant",
                    title: "Locataire actuel",
                    subtitle: "Voir la fiche locataire",
                    icon: Users,
                    href: `/dashboard/tenants/${property.current_tenant_id}`,
                }] : []),
            ] : []}

            documents={DocumentsList({ documents: propertyDocuments })}
            onAddDocument={() => router.push(`/dashboard/documents?property_id=${propertyId}`)}
        />
    )
}
