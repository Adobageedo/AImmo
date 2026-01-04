/**
 * New Tenant Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { EntityForm, EntityFormSection } from "@/components/entity"
import { useTenants } from "@/lib/hooks/use-tenants"
import { useAuthStore } from "@/lib/store/auth-store"
import type { TenantCreateRequest, TenantType, TenantStatus } from "@/lib/types/entity"

const tenantFormSections: EntityFormSection[] = [
    {
        id: "identity",
        title: "Identité",
        fields: [
            {
                key: "tenant_type",
                label: "Type de locataire",
                type: "select",
                required: true,
                options: [
                    { label: "Particulier", value: "individual" },
                    { label: "Entreprise", value: "company" },
                    { label: "Association", value: "association" },
                ],
            },
            {
                key: "name",
                label: "Nom Complet",
                type: "text",
                placeholder: "Jean Dupont ou SARL Exemple",
                required: true,
            },
        ],
    },
    {
        id: "contact",
        title: "Coordonnées",
        fields: [
            {
                key: "email",
                label: "Email",
                type: "email",
                placeholder: "jean.dupont@email.com",
            },
        ],
    },
    {
        id: "address",
        title: "Adresse personnelle",
        description: "Adresse du locataire (différente du bien loué)",
        fields: [
            {
                key: "address",
                label: "Adresse complète",
                type: "text",
                placeholder: "123 rue de la Paix, 75000 Paris",
            },
        ],
    },
]

export default function NewTenantPage() {
    const router = useRouter()
    const { currentOrganizationId } = useAuthStore()
    const { createItem, saving, error } = useTenants({ autoLoad: false })

    // Handle form submit
    const handleSubmit = useCallback(async (values: Record<string, unknown>) => {
        if (!currentOrganizationId) {
            throw new Error("Aucune organisation sélectionnée")
        }

        // Transform flat form values
        const tenantData: TenantCreateRequest = {
            name: values.name as string,
            tenant_type: (values.tenant_type || "individual") as TenantType,
            status: "prospect" as TenantStatus,
            email: values.email as string | undefined,
            address: values.address as string | undefined,
            organization_id: currentOrganizationId,
        }

        const created = await createItem(tenantData)
        if (created) {
            router.push(`/dashboard/tenants/${created.id}`)
        }
    }, [currentOrganizationId, createItem, router])

    // Handle cancel
    const handleCancel = useCallback(() => {
        router.push("/dashboard/tenants")
    }, [router])

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/tenants"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour aux locataires
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nouveau locataire</h1>
                        <p className="text-gray-500">Ajoutez un nouveau locataire ou prospect</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <EntityForm
                sections={tenantFormSections}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="Créer le locataire"
                loading={saving}
                error={error}
                initialValues={{
                    tenant_type: "individual",
                }}
            />
        </div>
    )
}
