/**
 * Owners List Page
 */

"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Users,
    Building2,
    Mail,
    Phone,
    Briefcase,
} from "lucide-react"
import { EntityList } from "@/components/entity"
import { useOwners } from "@/lib/hooks/use-owners"
import type { Owner } from "@/lib/types/entity"

type ViewMode = "list" | "grid" | "table"

export default function OwnersPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>("list")

    const {
        items: owners,
        loading,
        error,
        totalItems,
        page,
        totalPages,
        searchQuery,
        setSearchQuery,
        setPage,
        formatOwnerName,
        getInitials,
    } = useOwners({ autoLoad: true })

    // Handle owner selection
    const handleSelect = useCallback((owner: Owner) => {
        router.push(`/dashboard/owners/${owner.id}`)
    }, [router])

    // Handle new owner
    const handleNew = useCallback(() => {
        router.push("/dashboard/owners/new")
    }, [router])

    // Get avatar color
    const getAvatarColor = (owner: Owner) => {
        const colors = [
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
            "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
            "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
            "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        ]
        const index = owner.name.charCodeAt(0) % colors.length
        return colors[index]
    }

    return (
        <div className="space-y-6">
            <EntityList<Owner>
                items={owners}
                loading={loading}
                error={error}
                title="Propriétaires"
                subtitle="Gérez vos propriétaires et bailleurs"
                emptyTitle="Aucun propriétaire"
                emptyDescription="Commencez par ajouter votre premier propriétaire"
                emptyIcon={Users}

                // Item rendering
                getTitle={(o) => formatOwnerName(o)}
                getSubtitle={(o) => o.email || "Email non renseigné"}
                getAvatar={(o) => getInitials(o)}
                getAvatarColor={getAvatarColor}
                getBadges={(o) => [
                    ...(o.company_name ? [{ label: "Entreprise", variant: "secondary" as const }] : [{ label: "Particulier", variant: "default" as const }])
                ]}
                getMeta={(o) => [
                    ...(o.email ? [{ icon: Mail, value: o.email }] : []),
                    ...(o.phone ? [{ icon: Phone, value: o.phone }] : []),
                    ...(o.properties_count ? [{ icon: Building2, value: `${o.properties_count} bien${o.properties_count > 1 ? 's' : ''}` }] : []),
                ]}

                // Navigation
                onSelect={handleSelect}
                onDoubleClick={handleSelect}

                // Search
                searchPlaceholder="Rechercher un propriétaire..."
                searchValue={searchQuery}
                onSearch={setSearchQuery}

                // Actions
                primaryAction={{
                    label: "Nouveau propriétaire",
                    icon: Users,
                    onClick: handleNew,
                }}
                actions={[
                    {
                        key: "edit",
                        label: "Modifier",
                        onClick: (o) => router.push(`/dashboard/owners/${o.id}/edit`),
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
                    { label: "Plus récent", value: "created_desc" },
                ]}
            />
        </div>
    )
}
