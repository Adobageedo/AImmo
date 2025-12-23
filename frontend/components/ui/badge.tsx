"use client"

import { cn } from "@/lib/utils"

interface BadgeProps {
    children: React.ReactNode
    variant?: "default" | "secondary" | "success" | "warning" | "error" | "outline"
    size?: "sm" | "md"
    className?: string
}

const variantStyles = {
    default: "bg-indigo-100 text-indigo-700 border-indigo-200",
    secondary: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    error: "bg-red-100 text-red-700 border-red-200",
    outline: "bg-transparent text-gray-700 border-gray-300",
}

const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
}

export function Badge({
    children,
    variant = "default",
    size = "sm",
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-medium rounded-full border",
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            {children}
        </span>
    )
}
