"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg"
    className?: string
    text?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin text-indigo-600", sizeClasses[size])} />
            {text && <span className="text-gray-600">{text}</span>}
        </div>
    )
}

interface LoadingOverlayProps {
    text?: string
}

export function LoadingOverlay({ text = "Chargement..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 font-medium">{text}</p>
            </div>
        </div>
    )
}

interface PageLoaderProps {
    text?: string
}

export function PageLoader({ text = "Chargement..." }: PageLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500">{text}</p>
        </div>
    )
}
