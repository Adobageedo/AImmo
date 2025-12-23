/**
 * Tenant Detail Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    Users,
    Mail,
    Phone,
    Euro,
    Building2,
    FileText,
    Calendar,
    Briefcase,
    MapPin,
    CreditCard,
    AlertCircle,
    CheckCircle,
} from "lucide-react"
import { EntityDetail } from "@/components/entity"
import { useTenants } from "@/lib/hooks/use-tenants"
import type { Tenant } from "@/lib/types/entity"

export default function TenantDetailPage() {
    const router = useRouter()
    const params = useParams()
    const tenantId = params.id as string

    const {
        selectedItem: tenant,
        loadingItem: loading,
        error,
        loadItem,
        deleteItem,
        getFullName,
        getInitials,
        getStatusInfo,
        getTypeLabel,
        formatContact,
        hasCompleteProfile,
    } = useTenants({ autoLoad: false })

    // Load tenant on mount
    useEffect(() => {
        if (tenantId) {
            loadItem(tenantId)
        }
    }, [tenantId, loadItem])

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!tenant) return

        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer "${getFullName(tenant)}" ? Cette action est irréversible.`
        )

        if (confirmed) {
            const success = await deleteItem(tenant.id)
            if (success) {
                router.push("/dashboard/tenants")
            }
        }
    }, [tenant, deleteItem, router, getFullName])

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

    // Get avatar gradient color
    const getAvatarColor = (t: Tenant) => {
        const colors = [
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
            "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        ]

        const name = getFullName(t)
        const index = name.charCodeAt(0) % colors.length
        return colors[index]
    }

    if (!tenant && !loading && !error) {
        return null
    }

    const status = tenant ? getStatusInfo(tenant.status) : null
    const isProfileComplete = tenant ? hasCompleteProfile(tenant) : false

    // Build personal info items
    const buildPersonalInfo = (t: Tenant) => [
        { label: "Nom Complet", value: t.name },
        { label: "Type", value: getTypeLabel(t.tenant_type) },
    ]

    // Build contact info items
    const buildContactInfo = (t: Tenant) => [
        { label: "Email", value: t.email, highlight: true },
    ]

    // Build address info
    const buildAddressInfo = (t: Tenant) => {
        if (!t.address) return []
        return [
            { label: "Adresse", value: t.address },
        ]
    }

    return (
        <EntityDetail
            title={tenant ? getFullName(tenant) : "Chargement..."}
            subtitle={tenant?.email}
            avatar={tenant ? getInitials(tenant) : undefined}
            avatarColor={tenant ? getAvatarColor(tenant) : undefined}
            status={status || undefined}
            badges={tenant ? [
                { label: getTypeLabel(tenant.tenant_type), variant: "secondary" as const },
                ...(isProfileComplete
                    ? [{ label: "Profil complet", variant: "success" as const }]
                    : [{ label: "Profil incomplet", variant: "warning" as const }]
                ),
            ] : []}
            meta={[]}

            backHref="/dashboard/tenants"
            backLabel="Locataires"

            editHref={tenant ? `/dashboard/tenants/${tenant.id}/edit` : undefined}
            onDelete={tenant ? handleDelete : undefined}

            loading={loading}
            error={error}
            createdAt={tenant?.created_at}
            updatedAt={tenant?.updated_at}

            stats={tenant ? [
                ...(tenant.total_paid !== undefined ? [{
                    label: "Total payé",
                    value: formatCurrency(tenant.total_paid),
                    icon: CreditCard,
                    variant: "success" as const,
                }] : []),
                ...(tenant.outstanding_balance && tenant.outstanding_balance > 0 ? [{
                    label: "Solde impayé",
                    value: formatCurrency(tenant.outstanding_balance),
                    icon: AlertCircle,
                    variant: "error" as const,
                }] : [{
                    label: "Solde",
                    value: "À jour",
                    icon: CheckCircle,
                    variant: "success" as const,
                }]),
            ] : []}

            sections={tenant ? [
                {
                    id: "personal",
                    title: "Informations personnelles",
                    icon: Users,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildPersonalInfo(tenant).map((item, idx) => (
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
                    action: tenant.email ? {
                        label: "Envoyer un email",
                        onClick: () => window.open(`mailto:${tenant.email}`),
                    } : undefined,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildContactInfo(tenant).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`${item.highlight ? "font-semibold text-indigo-600" : "text-gray-900"} ${!item.value ? "text-gray-400 italic font-normal" : ""}`}>
                                        {item.value || "Non renseigné"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                ...(tenant.address ? [{
                    id: "address",
                    title: "Adresse personnelle",
                    icon: MapPin,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildAddressInfo(tenant).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className="text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    ),
                }] : []),
            ] : []}

            relatedItems={tenant ? [
                ...(tenant.current_lease_id ? [{
                    id: "lease",
                    title: "Bail actif",
                    subtitle: "Voir le bail en cours",
                    icon: FileText,
                    href: `/dashboard/leases/${tenant.current_lease_id}`,
                }] : []),
                ...(tenant.current_property_id ? [{
                    id: "property",
                    title: "Propriété louée",
                    subtitle: "Voir la propriété",
                    icon: Building2,
                    href: `/dashboard/properties/${tenant.current_property_id}`,
                }] : []),
            ] : []}

            documents={[]}
            onAddDocument={() => router.push(`/dashboard/documents?tenant_id=${tenantId}`)}
        />
    )
}
