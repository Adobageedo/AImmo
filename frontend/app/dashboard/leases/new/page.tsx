/**
 * New Lease Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, FilePlus, Loader2 } from "lucide-react"
import Link from "next/link"
import { EntityForm, EntityFormSection } from "@/components/entity"
import { useLeases } from "@/lib/hooks/use-leases"
import { useProperties } from "@/lib/hooks/use-properties"
import { useTenants } from "@/lib/hooks/use-tenants"
import { useAuthStore } from "@/lib/store/auth-store"
import type {
    LeaseCreateRequest,
    LeaseType,
    LeaseStatus,
    PaymentFrequency,
    Property,
    Tenant,
} from "@/lib/types/entity"

function NewLeasePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { currentOrganizationId } = useAuthStore()
    const { createItem, saving, error, generateReference } = useLeases({ autoLoad: false })
    const { items: properties, loadItems: loadProperties } = useProperties({ autoLoad: false })
    const { items: tenants, loadItems: loadTenants, getFullName } = useTenants({ autoLoad: false })

    // Pre-selected from query params
    const preselectedPropertyId = searchParams.get("property_id")
    const preselectedTenantId = searchParams.get("tenant_id")

    // Load properties and tenants
    useEffect(() => {
        loadProperties()
        loadTenants()
    }, [loadProperties, loadTenants])

    // Build form sections with dynamic options
    const leaseFormSections: EntityFormSection[] = [
        {
            id: "parties",
            title: "Parties au contrat",
            fields: [
                {
                    key: "property_id",
                    label: "Propriété",
                    type: "select",
                    required: true,
                    options: properties.map(p => ({
                        label: `${p.name} - ${p.address?.city || ""}`,
                        value: p.id,
                    })),
                    hint: "Sélectionnez le bien à louer",
                },
                {
                    key: "tenant_id",
                    label: "Locataire",
                    type: "select",
                    required: true,
                    options: tenants.map(t => ({
                        label: getFullName(t),
                        value: t.id,
                    })),
                    hint: "Sélectionnez le locataire",
                },
            ],
        },
        {
            id: "contract",
            title: "Informations du contrat",
            fields: [
                {
                    key: "reference",
                    label: "Référence du bail",
                    type: "text",
                    placeholder: "BAIL-2024-XXXX",
                    hint: "Laissez vide pour génération automatique",
                },
                {
                    key: "lease_type",
                    label: "Type de bail",
                    type: "select",
                    required: true,
                    options: [
                        { label: "Location vide", value: "unfurnished" },
                        { label: "Location meublée", value: "furnished" },
                        { label: "Bail commercial", value: "commercial" },
                        { label: "Bail professionnel", value: "professional" },
                        { label: "Location saisonnière", value: "seasonal" },
                        { label: "Bail étudiant", value: "student" },
                        { label: "Bail mobilité", value: "mobility" },
                    ],
                },
                {
                    key: "start_date",
                    label: "Date de début",
                    type: "date",
                    required: true,
                },
                {
                    key: "end_date",
                    label: "Date de fin",
                    type: "date",
                    hint: "Optionnel pour les baux à durée indéterminée",
                },
                {
                    key: "duration_months",
                    label: "Durée (mois)",
                    type: "number",
                    required: true,
                    min: 1,
                    max: 120,
                    placeholder: "12",
                },
            ],
        },
        {
            id: "financial",
            title: "Conditions financières",
            fields: [
                {
                    key: "rent_amount",
                    label: "Loyer mensuel (hors charges)",
                    type: "currency",
                    required: true,
                    placeholder: "800",
                },
                {
                    key: "charges_amount",
                    label: "Charges mensuelles",
                    type: "currency",
                    required: true,
                    placeholder: "100",
                },
                {
                    key: "deposit_amount",
                    label: "Dépôt de garantie",
                    type: "currency",
                    required: true,
                    placeholder: "800",
                    hint: "Généralement 1 mois de loyer hors charges pour vide, 2 mois pour meublé",
                },
                {
                    key: "payment_frequency",
                    label: "Fréquence de paiement",
                    type: "select",
                    options: [
                        { label: "Mensuel", value: "monthly" },
                        { label: "Trimestriel", value: "quarterly" },
                        { label: "Annuel", value: "annually" },
                    ],
                },
                {
                    key: "payment_day",
                    label: "Jour de paiement",
                    type: "number",
                    min: 1,
                    max: 28,
                    placeholder: "5",
                    hint: "Jour du mois pour le paiement du loyer",
                },
            ],
        },
        {
            id: "revision",
            title: "Révision du loyer",
            description: "Conditions de révision annuelle du loyer",
            fields: [
                {
                    key: "rent_revision_date",
                    label: "Date de révision",
                    type: "date",
                    hint: "Date anniversaire de révision du loyer",
                },
                {
                    key: "rent_revision_index",
                    label: "Indice de révision",
                    type: "select",
                    options: [
                        { label: "IRL (Indice de Référence des Loyers)", value: "IRL" },
                        { label: "ICC (Indice du Coût de la Construction)", value: "ICC" },
                        { label: "ILAT (Indice des Loyers des Activités Tertiaires)", value: "ILAT" },
                        { label: "ILC (Indice des Loyers Commerciaux)", value: "ILC" },
                    ],
                },
            ],
        },
        {
            id: "insurance",
            title: "Assurance",
            fields: [
                {
                    key: "insurance_required",
                    label: "Assurance requise",
                    type: "checkbox",
                    placeholder: "Le locataire doit fournir une attestation d'assurance",
                },
            ],
        },
        {
            id: "clauses",
            title: "Clauses particulières",
            fields: [
                {
                    key: "special_clauses",
                    label: "Clauses particulières",
                    type: "textarea",
                    placeholder: "Conditions spécifiques du bail...",
                    fullWidth: true,
                    rows: 4,
                },
                {
                    key: "notes",
                    label: "Notes privées",
                    type: "textarea",
                    placeholder: "Notes internes (non visibles par le locataire)...",
                    fullWidth: true,
                    rows: 3,
                },
            ],
        },
    ]

    // Handle form submit
    const handleSubmit = useCallback(async (values: Record<string, unknown>) => {
        if (!currentOrganizationId) {
            throw new Error("Aucune organisation sélectionnée")
        }

        // Generate reference if not provided
        let reference = values.reference as string | undefined
        if (!reference) {
            const property = properties.find(p => p.id === values.property_id)
            const tenant = tenants.find(t => t.id === values.tenant_id)
            if (property && tenant) {
                reference = generateReference(property.name, getFullName(tenant))
            }
        }

        // Transform form values
        const leaseData: LeaseCreateRequest = {
            reference,
            property_id: values.property_id as string,
            tenant_id: values.tenant_id as string,
            lease_type: values.lease_type as LeaseType,
            start_date: values.start_date as string,
            end_date: values.end_date as string | undefined,
            duration_months: values.duration_months as number,
            rent_amount: values.rent_amount as number,
            charges_amount: values.charges_amount as number,
            deposit_amount: values.deposit_amount as number,
            payment_frequency: (values.payment_frequency || "monthly") as PaymentFrequency,
            payment_day: (values.payment_day || 5) as number,
            rent_revision_date: values.rent_revision_date as string | undefined,
            rent_revision_index: values.rent_revision_index as string | undefined,
            insurance_required: values.insurance_required as boolean | undefined,
            special_clauses: values.special_clauses as string | undefined,
            notes: values.notes as string | undefined,
            organization_id: currentOrganizationId,
        }

        const created = await createItem(leaseData)
        if (created) {
            router.push(`/dashboard/leases/${created.id}`)
        }
    }, [currentOrganizationId, createItem, router, properties, tenants, generateReference, getFullName])

    // Handle cancel
    const handleCancel = useCallback(() => {
        router.push("/dashboard/leases")
    }, [router])

    // Calculate default end date based on duration
    const getDefaultEndDate = (startDate: string, months: number) => {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + months)
        return date.toISOString().split("T")[0]
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/leases"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour aux baux
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <FilePlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nouveau bail</h1>
                        <p className="text-gray-500">Créez un nouveau contrat de location</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <EntityForm
                sections={leaseFormSections}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="Créer le bail"
                loading={saving}
                error={error}
                initialValues={{
                    property_id: preselectedPropertyId || undefined,
                    tenant_id: preselectedTenantId || undefined,
                    lease_type: "unfurnished",
                    payment_frequency: "monthly",
                    payment_day: 5,
                    duration_months: 12,
                    insurance_required: true,
                }}
            />
        </div>
    )
}

// Wrap in Suspense for Next.js 15 compatibility
export default function NewLeasePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        }>
            <NewLeasePageContent />
        </Suspense>
    )
}
