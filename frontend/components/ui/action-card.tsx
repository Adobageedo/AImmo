"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface ActionCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    gradient?: string
    className?: string
}

const defaultGradients = [
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "bg-gradient-to-br from-emerald-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-pink-600",
    "bg-gradient-to-br from-blue-500 to-cyan-600",
]

export function ActionCard({
    title,
    description,
    icon: Icon,
    href,
    gradient = defaultGradients[0],
    className,
}: ActionCardProps) {
    return (
        <Link href={href}>
            <div className={cn(
                "relative overflow-hidden rounded-xl p-6 text-white transition-all hover:scale-[1.02] hover:shadow-lg",
                gradient,
                className
            )}>
                <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-sm text-white/80">{description}</p>
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
            </div>
        </Link>
    )
}
