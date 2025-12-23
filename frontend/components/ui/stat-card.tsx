import { cn } from "@/lib/utils"
import { LucideIcon, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    href?: string
    trend?: {
        value: string
        positive?: boolean
    }
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    href,
    trend,
    className,
}: StatCardProps) {
    const content = (
        <div className={cn(
            "relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm",
            href && "transition-all hover:shadow-md hover:border-indigo-200 group",
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {description && (
                        <p className="text-sm text-gray-500">{description}</p>
                    )}
                </div>
                {Icon && (
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50",
                        href && "group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors"
                    )}>
                        <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                )}
            </div>
            {trend && (
                <div className={cn(
                    "mt-4 inline-flex items-center text-sm font-medium",
                    trend.positive ? "text-green-600" : "text-red-600"
                )}>
                    <span>{trend.value}</span>
                </div>
            )}
            {href && (
                <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            )}
        </div>
    )

    if (href) {
        return <Link href={href} className="block">{content}</Link>
    }

    return content
}
