"use client"

// KpiCard Component - Phase 7: Portfolio Dashboard MVP
// Carte KPI avec BEM styling pour le dashboard

import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { KpiVariant } from "@/lib/types/dashboard"

interface KpiCardProps {
    title: string
    value: string | number
    unit?: string
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        period?: string
        positive?: boolean
    }
    variant?: KpiVariant
    href?: string
    className?: string
    loading?: boolean
}

const variantStyles: Record<KpiVariant, string> = {
    default: "dashboard__kpi-card--default",
    highlight: "dashboard__kpi-card--highlight",
    warning: "dashboard__kpi-card--warning",
    success: "dashboard__kpi-card--success",
    danger: "dashboard__kpi-card--danger",
}

export function KpiCard({
    title,
    value,
    unit,
    description,
    icon: Icon,
    trend,
    variant = "default",
    href,
    className,
    loading = false,
}: KpiCardProps) {
    const content = (
        <div
            className={cn(
                "dashboard__kpi-card",
                variantStyles[variant],
                href && "dashboard__kpi-card--clickable",
                loading && "dashboard__kpi-card--loading",
                className
            )}
        >
            {/* Header with icon */}
            <div className="dashboard__kpi-card-header">
                <span className="dashboard__kpi-card-title">{title}</span>
                {Icon && (
                    <div className="dashboard__kpi-card-icon">
                        <Icon className="dashboard__kpi-card-icon-svg" />
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="dashboard__kpi-card-content">
                {loading ? (
                    <div className="dashboard__kpi-card-skeleton" />
                ) : (
                    <div className="dashboard__kpi-card-value-wrapper">
                        <span className="dashboard__kpi-card-value">{value}</span>
                        {unit && <span className="dashboard__kpi-card-unit">{unit}</span>}
                    </div>
                )}

                {description && (
                    <p className="dashboard__kpi-card-description">{description}</p>
                )}
            </div>

            {/* Trend indicator */}
            {trend && !loading && (
                <div
                    className={cn(
                        "dashboard__kpi-card-trend",
                        trend.positive
                            ? "dashboard__kpi-card-trend--positive"
                            : "dashboard__kpi-card-trend--negative"
                    )}
                >
                    {trend.positive ? (
                        <TrendingUp className="dashboard__kpi-card-trend-icon" />
                    ) : (
                        <TrendingDown className="dashboard__kpi-card-trend-icon" />
                    )}
                    <span className="dashboard__kpi-card-trend-value">
                        {trend.positive ? "+" : "-"}
                        {Math.abs(trend.value)}%
                    </span>
                    {trend.period && (
                        <span className="dashboard__kpi-card-trend-period">
                            {trend.period}
                        </span>
                    )}
                </div>
            )}

            {/* Link indicator */}
            {href && (
                <ArrowUpRight className="dashboard__kpi-card-arrow" />
            )}

            {/* Decorative gradient bar */}
            <div className="dashboard__kpi-card-accent" />
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="dashboard__kpi-card-link">
                {content}
            </Link>
        )
    }

    return content
}

// Mini KPI Card for compact views
interface MiniKpiCardProps {
    label: string
    value: string | number
    color?: string
}

export function MiniKpiCard({ label, value, color }: MiniKpiCardProps) {
    return (
        <div className="dashboard__kpi-card-mini">
            <div
                className="dashboard__kpi-card-mini-indicator"
                style={{ backgroundColor: color }}
            />
            <div className="dashboard__kpi-card-mini-content">
                <span className="dashboard__kpi-card-mini-value">{value}</span>
                <span className="dashboard__kpi-card-mini-label">{label}</span>
            </div>
        </div>
    )
}

export default KpiCard
