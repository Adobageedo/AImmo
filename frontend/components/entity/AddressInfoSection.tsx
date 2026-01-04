import React from "react"
import { MapPin } from "lucide-react"

export interface AddressField {
    label: string
    value: string
}

export interface AddressInfoSectionProps {
    address?: string
    city?: string
    postalCode?: string
    country?: string
    additionalFields?: AddressField[]
}

export function AddressInfoSection({
    address,
    city,
    postalCode,
    country,
    additionalFields = [],
}: AddressInfoSectionProps) {
    // Build address fields
    const fields: AddressField[] = [
        ...(address ? [{ label: "Adresse", value: address }] : []),
        ...(city ? [{ label: "Ville", value: city }] : []),
        ...(postalCode ? [{ label: "Code postal", value: postalCode }] : []),
        ...(country ? [{ label: "Pays", value: country }] : []),
        ...additionalFields,
    ]

    return {
        id: "address",
        title: "Adresse",
        icon: MapPin,
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((field, idx) => (
                    <div key={idx} className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 mb-1">
                            {field.label}
                        </span>
                        <span className="text-gray-900">{field.value}</span>
                    </div>
                ))}
            </div>
        ),
    }
}
