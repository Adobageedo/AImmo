/**
 * Tenants List Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Users,
    Mail,
    Phone,
    Euro,
    Building2,
    AlertCircle,
    UserPlus,
} from "lucide-react"
import { EntityList } from "@/components/entity"
import { useTenants } from "@/lib/hooks/use-tenants"
import type { Tenant, TenantStatus } from "@/lib/types/entity"

type ViewMode = "list" | "grid" | "table"

export default function TenantsPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>("list")

    const {
        items: tenants,
        loading,
        error,
        totalItems,
        page,
        totalPages,
        searchQuery,
        setSearchQuery,
        setPage,
        getFullName,
        getInitials,
        getStatusInfo,
        getTypeLabel,
        formatContact,
    } = useTenants({ autoLoad: true })

    // Handle tenant selection
    const handleSelect = useCallback((tenant: Tenant) => {
        router.push(`/dashboard/tenants/${tenant.id}`)
    }, [router])

    // Handle new tenant
    const handleNew = useCallback(() => {
        router.push("/dashboard/tenants/new")
    }, [router])

    // Get avatar gradient color based on name
    const getAvatarColor = (tenant: Tenant) => {
        const colors = [
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
            "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        ]

        const name = getFullName(tenant)
        const index = name.charCodeAt(0) % colors.length
        return colors[index]
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
            <EntityList<Tenant>
                items={tenants}
                loading={loading}
                error={error}
                title="Locataires"
                subtitle="Gérez vos locataires et leurs informations"
                emptyTitle="Aucun locataire"
                emptyDescription="Commencez par ajouter votre premier locataire"
                emptyIcon={Users}

                // Item rendering
                getTitle={getFullName}
                getSubtitle={(t) => formatContact(t)}
                getAvatar={getInitials}
                getAvatarColor={getAvatarColor}
                getStatus={(t) => getStatusInfo(t.status)}
                getBadges={(t) => [
                    { label: getTypeLabel(t.tenant_type), variant: "secondary" as const }
                ]}
                getMeta={(t) => [
                    ...(t.contact.email ? [{ icon: Mail, value: t.contact.email }] : []),
                    ...(t.contact.phone ? [{ icon: Phone, value: t.contact.phone }] : []),
                    ...(t.current_property_id ? [{ icon: Building2, value: "Bail actif" }] : []),
                ]}
                getStats={(t) => [
                    ...(t.total_paid !== undefined ? [{
                        value: formatCurrency(t.total_paid),
                        label: "Total payé",
                        variant: "default" as const,
                    }] : []),
                    ...(t.outstanding_balance && t.outstanding_balance > 0 ? [{
                        value: formatCurrency(t.outstanding_balance),
                        label: "Impayés",
                        variant: "error" as const,
                    }] : []),
                ]}

                // Navigation
                onSelect={handleSelect}
                onDoubleClick={handleSelect}

                // Search
                searchPlaceholder="Rechercher un locataire..."
                searchValue={searchQuery}
                onSearch={setSearchQuery}

                // Actions
                primaryAction={{
                    label: "Nouveau locataire",
                    icon: UserPlus,
                    onClick: handleNew,
                }}
                actions={[
                    {
                        key: "edit",
                        label: "Modifier",
                        onClick: (t) => router.push(`/dashboard/tenants/${t.id}/edit`),
                    },
                    {
                        key: "email",
                        label: "Envoyer un email",
                        icon: Mail,
                        onClick: (t) => window.open(`mailto:${t.contact.email}`),
                        condition: (t) => !!t.contact.email,
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
                    { label: "Statut", value: "status" },
                    { label: "Plus récent", value: "created_desc" },
                ]}
            />
        </div>
    )
}
