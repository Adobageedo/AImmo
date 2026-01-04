"use client"

import { CheckCircle2, Bell } from "lucide-react"

interface NewsletterSubscribeButtonProps {
    isSubscribed: boolean
    onToggle: () => Promise<boolean>
    loading?: boolean
    size?: "sm" | "md" | "lg"
}

export function NewsletterSubscribeButton({
    isSubscribed,
    onToggle,
    loading = false,
    size = "md",
}: NewsletterSubscribeButtonProps) {
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    }

    return (
        <button
            onClick={onToggle}
            disabled={loading}
            className={`
                ${sizeClasses[size]}
                rounded-lg font-medium transition-colors
                flex items-center space-x-2
                ${
                    isSubscribed
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                }
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                w-full justify-center
            `}
        >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    <span>Chargement...</span>
                </>
            ) : isSubscribed ? (
                <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Abonné</span>
                </>
            ) : (
                <>
                    <Bell className="h-4 w-4" />
                    <span>S'abonner</span>
                </>
            )}
        </button>
    )
}
