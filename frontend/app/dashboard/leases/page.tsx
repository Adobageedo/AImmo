/**
 * Leases List Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    FileText,
    Calendar,
    Euro,
    Building2,
    Users,
    AlertTriangle,
    Clock,
    CheckCircle,
    FilePlus,
} from "lucide-react"
import { EntityList } from "@/components/entity"
import { useLeases } from "@/lib/hooks/use-leases"
import type { Lease, LeaseStatus } from "@/lib/types/entity"

type ViewMode = "list" | "grid" | "table"

export default function LeasesPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>("list")

    const {
        items: leases,
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
        getPaymentStatusInfo,
        formatPeriod,
        formatMonthlyTotal,
        isExpiringSoon,
        getRemainingMonths,
    } = useLeases({ autoLoad: true })

    // Handle lease selection
    const handleSelect = useCallback((lease: Lease) => {
        router.push(`/dashboard/leases/${lease.id}`)
    }, [router])

    // Handle new lease
    const handleNew = useCallback(() => {
        router.push("/dashboard/leases/new")
    }, [router])

    // Format currency
    const formatCurrency = (amount?: number) => {
        if (!amount) return "—"
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Get badges for lease
    const getLeaseBadges = (lease: Lease) => {
        const badges: Array<{ label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = [
            { label: getTypeLabel(lease.lease_type), variant: "secondary" }
        ]

        if (isExpiringSoon(lease)) {
            const remaining = getRemainingMonths(lease)
            badges.push({
                label: remaining ? `Expire dans ${remaining} mois` : "Expire bientôt",
                variant: "warning"
            })
        }

        if (lease.payment_status === "late" || lease.payment_status === "unpaid") {
            badges.push({ label: "Impayé", variant: "error" })
        }

        return badges
    }

    // Get meta info for lease
    const getLeaseMeta = (lease: Lease) => {
        const meta = [
            { icon: Calendar, value: formatPeriod(lease) },
        ]

        if (lease.property?.name) {
            meta.push({ icon: Building2, value: lease.property.name })
        }

        if (lease.tenant) {
            const tenantName = lease.tenant.company_name ||
                `${lease.tenant.first_name} ${lease.tenant.last_name}`
            meta.push({ icon: Users, value: tenantName })
        }

        return meta
    }

    return (
        <div className="space-y-6">
            <EntityList<Lease>
                items={leases}
                loading={loading}
                error={error}
                title="Baux"
                subtitle="Gérez vos contrats de location"
                emptyTitle="Aucun bail"
                emptyDescription="Commencez par créer un nouveau contrat de location"
                emptyIcon={FileText}

                // Item rendering
                getTitle={(l) => l.reference || `Bail ${l.id.slice(0, 8)}`}
                getSubtitle={(l) => {
                    const parts = []
                    if (l.property?.name) parts.push(l.property.name)
                    if (l.tenant) {
                        const name = l.tenant.company_name || `${l.tenant.first_name} ${l.tenant.last_name}`
                        parts.push(name)
                    }
                    return parts.join(" • ") || "Bail en cours"
                }}
                getIcon={() => FileText}
                getStatus={(l) => getStatusInfo(l.status)}
                getBadges={getLeaseBadges}
                getMeta={getLeaseMeta}
                getStats={(l) => [
                    {
                        value: formatCurrency(l.rent_amount + l.charges_amount),
                        label: "Loyer + Charges",
                        variant: "highlight" as const,
                    },
                    ...(l.payment_status ? [{
                        value: getPaymentStatusInfo(l.payment_status).label,
                        label: "Paiement",
                        variant: (l.payment_status === "paid" ? "success" :
                            l.payment_status === "late" || l.payment_status === "unpaid" ? "error" :
                                "default") as "success" | "error" | "default",
                    }] : []),
                ]}

                // Navigation
                onSelect={handleSelect}
                onDoubleClick={handleSelect}

                // Search
                searchPlaceholder="Rechercher un bail..."
                searchValue={searchQuery}
                onSearch={setSearchQuery}

                // Actions
                primaryAction={{
                    label: "Nouveau bail",
                    icon: FilePlus,
                    onClick: handleNew,
                }}
                actions={[
                    {
                        key: "edit",
                        label: "Modifier",
                        onClick: (l) => router.push(`/dashboard/leases/${l.id}/edit`),
                    },
                    {
                        key: "property",
                        label: "Voir la propriété",
                        icon: Building2,
                        onClick: (l) => router.push(`/dashboard/properties/${l.property_id}`),
                    },
                    {
                        key: "tenant",
                        label: "Voir le locataire",
                        icon: Users,
                        onClick: (l) => router.push(`/dashboard/tenants/${l.tenant_id}`),
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
                    { label: "Plus récent", value: "created_desc" },
                    { label: "Date début ↑", value: "start_asc" },
                    { label: "Date début ↓", value: "start_desc" },
                    { label: "Loyer ↑", value: "rent_asc" },
                    { label: "Loyer ↓", value: "rent_desc" },
                    { label: "Statut", value: "status" },
                ]}

                // Highlight expiring leases
                highlightIds={leases.filter(l => isExpiringSoon(l)).map(l => l.id)}
            />
        </div>
    )
}
