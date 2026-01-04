"use client"

import { CheckCircle2, Circle } from "lucide-react"

interface NewsletterStatusBadgeProps {
    isSubscribed: boolean
}

export function NewsletterStatusBadge({ isSubscribed }: NewsletterStatusBadgeProps) {
    return (
        <div
            className={`
                inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                ${
                    isSubscribed
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                }
            `}
        >
            {isSubscribed ? (
                <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Abonné</span>
                </>
            ) : (
                <>
                    <Circle className="h-3 w-3" />
                    <span>Non abonné</span>
                </>
            )}
        </div>
    )
}
