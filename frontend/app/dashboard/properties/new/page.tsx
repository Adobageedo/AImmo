/**
 * New Property Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { EntityForm, EntityFormSection } from "@/components/entity"
import { useProperties } from "@/lib/hooks/use-properties"
import { useAuthStore } from "@/lib/store/auth-store"
import type { PropertyCreateRequest, PropertyType, PropertyStatus } from "@/lib/types/entity"

const propertyFormSections: EntityFormSection[] = [
    {
        id: "general",
        title: "Informations générales",
        fields: [
            {
                key: "name",
                label: "Nom du bien",
                type: "text",
                placeholder: "Ex: Appartement Paris 11ème",
                required: true,
            },
            {
                key: "property_type",
                label: "Type de bien",
                type: "select",
                required: true,
                options: [
                    { label: "Appartement", value: "apartment" },
                    { label: "Maison", value: "house" },
                    { label: "Studio", value: "studio" },
                    { label: "Local commercial", value: "commercial" },
                    { label: "Parking", value: "parking" },
                    { label: "Box/Cave", value: "storage" },
                    { label: "Terrain", value: "land" },
                    { label: "Autre", value: "other" },
                ],
            },
            {
                key: "status",
                label: "Statut",
                type: "select",
                options: [
                    { label: "Disponible", value: "available" },
                    { label: "Loué", value: "rented" },
                    { label: "En travaux", value: "under_renovation" },
                    { label: "En vente", value: "for_sale" },
                ],
            },
            {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Description du bien...",
                fullWidth: true,
                rows: 3,
            },
        ],
    },
    {
        id: "address",
        title: "Adresse",
        fields: [
            {
                key: "address",
                label: "Rue",
                type: "text",
                placeholder: "123 rue de la Paix",
                required: true,
            },
            {
                key: "postal_code",
                label: "Code postal",
                type: "text",
                placeholder: "75000",
                required: true,
            },
            {
                key: "city",
                label: "Ville",
                type: "text",
                placeholder: "Paris",
                required: true,
            },
            {
                key: "country",
                label: "Pays",
                type: "text",
                placeholder: "France",
            },
        ],
    },
    {
        id: "characteristics",
        title: "Caractéristiques",
        fields: [
            {
                key: "surface_area",
                label: "Surface (m²)",
                type: "number",
                placeholder: "50",
                required: true,
                min: 1,
                max: 10000,
                suffix: "m²",
            },
            {
                key: "rooms",
                label: "Nombre de pièces",
                type: "number",
                placeholder: "3",
                min: 1,
                max: 50,
            },
            {
                key: "bedrooms",
                label: "Chambres",
                type: "number",
                placeholder: "2",
                min: 0,
                max: 20,
            },
            {
                key: "bathrooms",
                label: "Salles de bain",
                type: "number",
                placeholder: "1",
                min: 0,
                max: 10,
            },
            {
                key: "construction_year",
                label: "Année de construction",
                type: "number",
                placeholder: "1990",
                min: 1800,
                max: new Date().getFullYear(),
            },
            {
                key: "energy_class",
                label: "Classe énergie (DPE)",
                type: "select",
                options: [
                    { label: "A", value: "A" },
                    { label: "B", value: "B" },
                    { label: "C", value: "C" },
                    { label: "D", value: "D" },
                    { label: "E", value: "E" },
                    { label: "F", value: "F" },
                    { label: "G", value: "G" },
                ],
            },
            {
                key: "ges_class",
                label: "Classe GES",
                type: "select",
                options: [
                    { label: "A", value: "A" },
                    { label: "B", value: "B" },
                    { label: "C", value: "C" },
                    { label: "D", value: "D" },
                    { label: "E", value: "E" },
                    { label: "F", value: "F" },
                    { label: "G", value: "G" },
                ],
            },
        ],
    },
    {
        id: "amenities",
        title: "Équipements",
        fields: [
            {
                key: "has_parking",
                label: "Parking",
                type: "checkbox",
                placeholder: "Ce bien dispose d'un parking",
            },
            {
                key: "has_cellar",
                label: "Cave",
                type: "checkbox",
                placeholder: "Ce bien dispose d'une cave",
            },
            {
                key: "has_balcony",
                label: "Balcon/Terrasse",
                type: "checkbox",
                placeholder: "Ce bien dispose d'un balcon ou d'une terrasse",
            },
            {
                key: "has_garden",
                label: "Jardin",
                type: "checkbox",
                placeholder: "Ce bien dispose d'un jardin",
            },
        ],
    },
    {
        id: "financial",
        title: "Données financières",
        description: "Ces informations sont optionnelles mais permettent de calculer le rendement",
        fields: [
            {
                key: "purchase_price",
                label: "Prix d'achat",
                type: "currency",
                placeholder: "250000",
            },
            {
                key: "purchase_date",
                label: "Date d'achat",
                type: "date",
            },
            {
                key: "current_value",
                label: "Valeur actuelle estimée",
                type: "currency",
                placeholder: "275000",
            },
            {
                key: "monthly_charges",
                label: "Charges mensuelles",
                type: "currency",
                placeholder: "150",
                hint: "Charges de copropriété, assurance, etc.",
            },
            {
                key: "property_tax",
                label: "Taxe foncière annuelle",
                type: "currency",
                placeholder: "1200",
            },
        ],
    },
]

export default function NewPropertyPage() {
    const router = useRouter()
    const { currentOrganizationId } = useAuthStore()
    const { createItem, saving, error } = useProperties({ autoLoad: false })

    // Handle form submit
    const handleSubmit = useCallback(async (values: Record<string, unknown>) => {
        if (!currentOrganizationId) {
            throw new Error("Aucune organisation sélectionnée")
        }

        // Transform flat form values to nested structure
        const propertyData: PropertyCreateRequest = {
            name: values.name as string,
            description: values.description as string | undefined,
            property_type: (values.property_type || "other") as PropertyType,
            status: (values.status || "available") as PropertyStatus,
            address: values.address as string,
            postal_code: values.postal_code as string,
            city: values.city as string,
            country: (values.country as string) || "France",
            surface_area: values.surface_area as number,
            rooms: values.rooms as number | undefined,
            bedrooms: values.bedrooms as number | undefined,
            bathrooms: values.bathrooms as number | undefined,
            has_parking: values.has_parking as boolean | undefined,
            has_cellar: values.has_cellar as boolean | undefined,
            has_balcony: values.has_balcony as boolean | undefined,
            has_garden: values.has_garden as boolean | undefined,
            construction_year: values.construction_year as number | undefined,
            purchase_price: values.purchase_price as number | undefined,
            purchase_date: values.purchase_date as string | undefined,
            current_value: values.current_value as number | undefined,
            monthly_charges: values.monthly_charges as number | undefined,
            property_tax: values.property_tax as number | undefined,
            organization_id: currentOrganizationId,
        }

        const created = await createItem(propertyData)
        if (created) {
            router.push(`/dashboard/properties/${created.id}`)
        }
    }, [currentOrganizationId, createItem, router])

    // Handle cancel
    const handleCancel = useCallback(() => {
        router.push("/dashboard/properties")
    }, [router])

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/properties"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour aux propriétés
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nouvelle propriété</h1>
                        <p className="text-gray-500">Ajoutez un nouveau bien à votre patrimoine</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <EntityForm
                sections={propertyFormSections}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="Créer la propriété"
                loading={saving}
                error={error}
                initialValues={{
                    status: "available",
                    country: "France",
                }}
            />
        </div>
    )
}
