"use client"

import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"

type AlertVariant = "info" | "success" | "warning" | "error"

interface AlertProps {
    variant?: AlertVariant
    title?: string
    children: React.ReactNode
    onClose?: () => void
    className?: string
}

const variantStyles: Record<AlertVariant, {
    container: string
    icon: string
    iconComponent: typeof AlertCircle
}> = {
    info: {
        container: "bg-blue-50 border-blue-200 text-blue-800",
        icon: "text-blue-500",
        iconComponent: Info,
    },
    success: {
        container: "bg-green-50 border-green-200 text-green-800",
        icon: "text-green-500",
        iconComponent: CheckCircle,
    },
    warning: {
        container: "bg-yellow-50 border-yellow-200 text-yellow-800",
        icon: "text-yellow-500",
        iconComponent: AlertTriangle,
    },
    error: {
        container: "bg-red-50 border-red-200 text-red-800",
        icon: "text-red-500",
        iconComponent: AlertCircle,
    },
}

export function Alert({
    variant = "info",
    title,
    children,
    onClose,
    className,
}: AlertProps) {
    const styles = variantStyles[variant]
    const Icon = styles.iconComponent

    return (
        <div
            className={cn(
                "relative flex gap-3 rounded-lg border p-4",
                styles.container,
                className
            )}
            role="alert"
        >
            <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", styles.icon)} />
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="font-semibold mb-1">{title}</h4>
                )}
                <div className="text-sm">{children}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                    aria-label="Fermer"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
