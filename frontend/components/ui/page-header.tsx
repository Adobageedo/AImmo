"use client"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode // For action buttons
    className?: string
}

export function PageHeader({
    title,
    description,
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
            className
        )}>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {description && (
                    <p className="text-gray-500 mt-1">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 shrink-0">
                    {children}
                </div>
            )}
        </div>
    )
}
