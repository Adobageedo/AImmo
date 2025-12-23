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
                placeholder: "Jean Dupont",
                required: true,
            },
            {
                key: "company_name",
                label: "Nom de la société",
                type: "text",
                placeholder: "SARL Exemple",
                showIf: (values) => values.tenant_type === "company" || values.tenant_type === "association",
            },
            {
                key: "date_of_birth",
                label: "Date de naissance",
                type: "date",
            },
            {
                key: "place_of_birth",
                label: "Lieu de naissance",
                type: "text",
                placeholder: "Paris",
            },
            {
                key: "nationality",
                label: "Nationalité",
                type: "text",
                placeholder: "Française",
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
                required: true,
            },
            {
                key: "phone",
                label: "Téléphone",
                type: "tel",
                placeholder: "06 12 34 56 78",
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
    {
        id: "professional",
        title: "Situation professionnelle",
        fields: [
            {
                key: "profession",
                label: "Profession",
                type: "text",
                placeholder: "Ingénieur",
            },
            {
                key: "employer",
                label: "Employeur",
                type: "text",
                placeholder: "Entreprise SAS",
            },
            {
                key: "monthly_income",
                label: "Revenus mensuels nets",
                type: "currency",
                placeholder: "2500",
                hint: "Utilisé pour vérifier le ratio loyer/revenus",
            },
        ],
    },
    {
        id: "guarantor",
        title: "Garant",
        description: "Informations sur le garant éventuel",
        fields: [
            {
                key: "guarantor_name",
                label: "Nom du garant",
                type: "text",
                placeholder: "Marie Dupont",
            },
            {
                key: "guarantor_contact",
                label: "Contact du garant",
                type: "text",
                placeholder: "06 00 00 00 00 ou email",
            },
        ],
    },
    {
        id: "notes",
        title: "Notes",
        fields: [
            {
                key: "notes",
                label: "Notes privées",
                type: "textarea",
                placeholder: "Informations complémentaires sur le locataire...",
                fullWidth: true,
                rows: 4,
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

        // Transform flat form values to nested structure
        const tenantData: TenantCreateRequest = {
            name: values.name as string,
            company_name: values.company_name as string | undefined,
            tenant_type: (values.tenant_type || "individual") as TenantType,
            status: "prospect" as TenantStatus,
            email: values.email as string,
            phone: values.phone as string | undefined,
            address: values.address as string | undefined,
            date_of_birth: values.date_of_birth as string | undefined,
            place_of_birth: values.place_of_birth as string | undefined,
            nationality: values.nationality as string | undefined,
            profession: values.profession as string | undefined,
            employer: values.employer as string | undefined,
            monthly_income: values.monthly_income as number | undefined,
            guarantor_name: values.guarantor_name as string | undefined,
            guarantor_contact: values.guarantor_contact as string | undefined,
            notes: values.notes as string | undefined,
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
                    "address.country": "France",
                }}
            />
        </div>
    )
}
