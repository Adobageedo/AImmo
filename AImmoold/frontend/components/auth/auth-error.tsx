"use client"

import { AlertCircle } from "lucide-react"

interface AuthErrorProps {
    message: string | null
}

export function AuthError({ message }: AuthErrorProps) {
    if (!message) return null

    return (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    )
}
