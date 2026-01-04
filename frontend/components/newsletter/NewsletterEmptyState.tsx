"use client"

import { Mail } from "lucide-react"

export function NewsletterEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune newsletter disponible
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
                Il n'y a pas de newsletters disponibles pour le moment. Revenez plus tard !
            </p>
        </div>
    )
}
