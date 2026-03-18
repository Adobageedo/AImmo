/**
 * Owner Detail Page
 */

"use client"

import React, { useEffect, useCallback, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    Users,
    Mail,
    Phone,
    MapPin,
    Building2,
    Briefcase,
    FileText,
} from "lucide-react"
import { EntityDetail, AddressInfoSection, DocumentsList } from "@/components/entity"
import { useOwners, useEntityDocuments } from "@/lib/hooks"
import { useAuthStore } from "@/lib/store/auth-store"
import type { Owner } from "@/lib/types/entity"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export default function OwnerDetailPage() {
    const router = useRouter()
    const params = useParams()
    const ownerId = params.id as string

    const {
        selectedItem: owner,
        loadingItem: loading,
        error,
        loadItem,
        deleteItem,
        formatOwnerName,
        getInitials,
    } = useOwners({ autoLoad: false })

    const [ownerProperties, setOwnerProperties] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(false)
    const accessToken = useAuthStore((state) => state.accessToken)

    // Use entity documents hook
    const { documents: ownerDocuments } = useEntityDocuments({
        entityType: "owner",
        entityId: ownerId,
    })

    // Load owner on mount
    useEffect(() => {
        if (ownerId) {
            loadItem(ownerId)
        }
    }, [ownerId, loadItem])

    // Load owner properties
    useEffect(() => {
        const fetchOwnerProperties = async () => {
            if (!ownerId || !accessToken) return
            
            setLoadingData(true)
            try {
                const propsResponse = await fetch(
                    `${API_URL}/owners/${ownerId}/properties`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )
                if (propsResponse.ok) {
                    const properties = await propsResponse.json()
                    setOwnerProperties(properties)
                }
            } catch (error) {
                console.error("Failed to fetch owner properties:", error)
            } finally {
                setLoadingData(false)
            }
        }

        fetchOwnerProperties()
    }, [ownerId, accessToken])

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!owner) return

        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer "${formatOwnerName(owner)}" ? Cette action est irréversible.`
        )

        if (confirmed) {
            const success = await deleteItem(owner.id)
            if (success) {
                router.push("/dashboard/owners")
            }
        }
    }, [owner, deleteItem, router, formatOwnerName])

    // Get avatar color
    const getAvatarColor = (o: Owner) => {
        const colors = [
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
            "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        ]
        const index = o.name.charCodeAt(0) % colors.length
        return colors[index]
    }

    // Calculate total monthly rent and gross yield
    const calculateStats = () => {
        const totalMonthlyRent = ownerProperties.reduce((sum, prop) => {
            // Get monthly rent from property's current lease if available
            return sum + (parseFloat(prop.monthly_rent || 0))
        }, 0)

        const totalPropertyValue = ownerProperties.reduce((sum, prop) => {
            return sum + (parseFloat(prop.current_value || prop.purchase_price || 0))
        }, 0)

        const grossYield = totalPropertyValue > 0 
            ? ((totalMonthlyRent * 12) / totalPropertyValue) * 100 
            : 0

        return {
            totalMonthlyRent,
            totalPropertyValue,
            grossYield,
            propertiesCount: ownerProperties.length,
        }
    }

    const stats = calculateStats()

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(value)
    }

    if (!owner && !loading && !error) {
        return null
    }

    // Build personal info items
    const buildPersonalInfo = (o: Owner) => [
        { label: "Nom", value: o.name },
        ...(o.company_name ? [{ label: "Entreprise", value: o.company_name }] : []),
        ...(o.siret ? [{ label: "SIRET", value: o.siret }] : []),
    ]

    // Build contact info items
    const buildContactInfo = (o: Owner) => [
        { label: "Email", value: o.email, highlight: true, empty: !o.email },
        { label: "Téléphone", value: o.phone, empty: !o.phone },
    ]

    // Build address info
    const buildAddressInfo = (o: Owner) => {
        if (!o.address) return []
        return [
            { label: "Adresse", value: o.address },
        ]
    }

    return (
        <EntityDetail
            title={owner ? formatOwnerName(owner) : "Chargement..."}
            subtitle={owner?.email}
            avatar={owner ? getInitials(owner) : undefined}
            avatarColor={owner ? getAvatarColor(owner) : undefined}
            badges={owner ? [
                ...(owner.company_name ? [{ label: "Entreprise", variant: "secondary" as const }] : [{ label: "Particulier", variant: "default" as const }])
            ] : []}
            meta={[]}

            backHref="/dashboard/owners"
            backLabel="Propriétaires"

            editHref={owner ? `/dashboard/owners/${owner.id}/edit` : undefined}
            onDelete={owner ? handleDelete : undefined}

            loading={loading}
            error={error}
            createdAt={owner?.created_at}
            updatedAt={owner?.updated_at}

            stats={owner ? [
                {
                    label: "Biens possédés",
                    value: `${stats.propertiesCount}`,
                    icon: Building2,
                    variant: "default" as const,
                },
                {
                    label: "Loyer mensuel",
                    value: formatCurrency(stats.totalMonthlyRent),
                    icon: Building2,
                    variant: "success" as const,
                },
                {
                    label: "Valeur totale",
                    value: formatCurrency(stats.totalPropertyValue),
                    icon: Building2,
                    variant: "default" as const,
                },
                {
                    label: "Rendement brut",
                    value: `${stats.grossYield.toFixed(2)}%`,
                    icon: Building2,
                    variant: stats.grossYield > 5 ? "success" as const : "default" as const,
                },
            ] : []}

            sections={owner ? [
                {
                    id: "personal",
                    title: "Informations personnelles",
                    icon: Users,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildPersonalInfo(owner).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className="text-gray-900">
                                        {item.value || "Non renseigné"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                {
                    id: "contact",
                    title: "Coordonnées",
                    icon: Mail,
                    action: owner.email ? {
                        label: "Envoyer un email",
                        onClick: () => window.open(`mailto:${owner.email}`),
                    } : undefined,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildContactInfo(owner).map((item, idx) => (
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
                ...(owner.address ? [AddressInfoSection({
                    address: owner.address,
                })] : []),
            ] : []}

            relatedItems={[
                ...ownerProperties.map((prop) => ({
                    id: prop.id,
                    title: prop.name,
                    subtitle: `${prop.address}, ${prop.city}`,
                    icon: Building2,
                    href: `/dashboard/properties/${prop.id}`,
                })),
                // Add leases and tenants from properties
                ...ownerProperties.flatMap((prop) => {
                    const items = []
                    if (prop.current_lease_id) {
                        items.push({
                            id: `lease-${prop.current_lease_id}`,
                            title: "Bail actif",
                            subtitle: `Propriété: ${prop.name}`,
                            icon: FileText,
                            href: `/dashboard/leases/${prop.current_lease_id}`,
                        })
                    }
                    if (prop.current_tenant_id) {
                        items.push({
                            id: `tenant-${prop.current_tenant_id}`,
                            title: "Locataire",
                            subtitle: `Propriété: ${prop.name}`,
                            icon: Users,
                            href: `/dashboard/tenants/${prop.current_tenant_id}`,
                        })
                    }
                    return items
                }),
            ]}

            documents={DocumentsList({ documents: ownerDocuments })}
            onAddDocument={() => router.push(`/dashboard/documents?owner_id=${ownerId}`)}
        />
    )
}
