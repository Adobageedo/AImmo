"use client"

// Chart Component - Phase 7: Portfolio Dashboard MVP
// Graphiques pour le dashboard avec support multi-types

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { ChartDataPoint, ChartType } from "@/lib/types/dashboard"

interface ChartProps {
    type: ChartType
    data: ChartDataPoint[]
    title?: string
    height?: number
    showLegend?: boolean
    showLabels?: boolean
    animated?: boolean
    className?: string
}

export function Chart({
    type,
    data,
    title,
    height = 200,
    showLegend = true,
    showLabels = true,
    animated = true,
    className,
}: ChartProps) {
    const total = useMemo(
        () => data.reduce((sum, d) => sum + d.value, 0),
        [data]
    )

    const maxValue = useMemo(
        () => Math.max(...data.map((d) => d.value)),
        [data]
    )

    return (
        <div className={cn("dashboard__chart", className)}>
            {title && <h3 className="dashboard__chart-title">{title}</h3>}

            <div className="dashboard__chart-container" style={{ height }}>
                {type === "bar" && (
                    <BarChart
                        data={data}
                        maxValue={maxValue}
                        showLabels={showLabels}
                        animated={animated}
                    />
                )}
                {type === "pie" && (
                    <PieChart data={data} total={total} animated={animated} />
                )}
                {type === "doughnut" && (
                    <DoughnutChart data={data} total={total} animated={animated} />
                )}
                {type === "line" && (
                    <LineChart data={data} maxValue={maxValue} animated={animated} />
                )}
            </div>

            {showLegend && data.length > 0 && (
                <div className="dashboard__chart-legend">
                    {data.map((item, index) => (
                        <div key={index} className="dashboard__chart-legend-item">
                            <span
                                className="dashboard__chart-legend-color"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="dashboard__chart-legend-label">{item.label}</span>
                            <span className="dashboard__chart-legend-value">
                                {item.value}
                                {item.percentage !== undefined && (
                                    <span className="dashboard__chart-legend-percentage">
                                        ({item.percentage}%)
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Bar Chart
function BarChart({
    data,
    maxValue,
    showLabels,
    animated,
}: {
    data: ChartDataPoint[]
    maxValue: number
    showLabels: boolean
    animated: boolean
}) {
    return (
        <div className="dashboard__chart-bar">
            {data.map((item, index) => {
                const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                return (
                    <div key={index} className="dashboard__chart-bar-item">
                        <div className="dashboard__chart-bar-wrapper">
                            <div
                                className={cn(
                                    "dashboard__chart-bar-fill",
                                    animated && "dashboard__chart-bar-fill--animated"
                                )}
                                style={{
                                    height: `${heightPercent}%`,
                                    backgroundColor: item.color,
                                    animationDelay: `${index * 100}ms`,
                                }}
                            />
                        </div>
                        {showLabels && (
                            <>
                                <span className="dashboard__chart-bar-value">{item.value}</span>
                                <span className="dashboard__chart-bar-label">{item.label}</span>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// Pie Chart (using SVG)
function PieChart({
    data,
    total,
    animated,
}: {
    data: ChartDataPoint[]
    total: number
    animated: boolean
}) {
    const slices = useMemo(() => {
        let cumulativePercent = 0
        return data.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0
            const slice = {
                ...item,
                percent,
                offset: cumulativePercent,
            }
            cumulativePercent += percent
            return slice
        })
    }, [data, total])

    return (
        <svg viewBox="0 0 100 100" className="dashboard__chart-pie">
            {slices.map((slice, index) => {
                const strokeDasharray = `${slice.percent} ${100 - slice.percent}`
                const strokeDashoffset = 25 - slice.offset
                return (
                    <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className={cn(animated && "dashboard__chart-pie-slice--animated")}
                        style={{ animationDelay: `${index * 150}ms` }}
                    />
                )
            })}
        </svg>
    )
}

// Doughnut Chart (Pie with center hole)
function DoughnutChart({
    data,
    total,
    animated,
}: {
    data: ChartDataPoint[]
    total: number
    animated: boolean
}) {
    const slices = useMemo(() => {
        let cumulativePercent = 0
        return data.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0
            const slice = {
                ...item,
                percent,
                offset: cumulativePercent,
            }
            cumulativePercent += percent
            return slice
        })
    }, [data, total])

    return (
        <div className="dashboard__chart-doughnut">
            <svg viewBox="0 0 100 100" className="dashboard__chart-doughnut-svg">
                {slices.map((slice, index) => {
                    const strokeDasharray = `${slice.percent} ${100 - slice.percent}`
                    const strokeDashoffset = 25 - slice.offset
                    return (
                        <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className={cn(animated && "dashboard__chart-doughnut-slice--animated")}
                            style={{ animationDelay: `${index * 150}ms` }}
                        />
                    )
                })}
            </svg>
            <div className="dashboard__chart-doughnut-center">
                <span className="dashboard__chart-doughnut-total">{total}</span>
                <span className="dashboard__chart-doughnut-label">Total</span>
            </div>
        </div>
    )
}

// Line Chart
function LineChart({
    data,
    maxValue,
    animated,
}: {
    data: ChartDataPoint[]
    maxValue: number
    animated: boolean
}) {
    const points = useMemo(() => {
        const width = 100
        const height = 100
        const padding = 10
        const effectiveWidth = width - padding * 2
        const effectiveHeight = height - padding * 2

        return data.map((item, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * effectiveWidth
            const y =
                maxValue > 0
                    ? padding + effectiveHeight - (item.value / maxValue) * effectiveHeight
                    : padding + effectiveHeight
            return { x, y, ...item }
        })
    }, [data, maxValue])

    const pathD = useMemo(() => {
        if (points.length === 0) return ""
        return points
            .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
            .join(" ")
    }, [points])

    const areaD = useMemo(() => {
        if (points.length === 0) return ""
        const first = points[0]
        const last = points[points.length - 1]
        return `${pathD} L ${last.x} 100 L ${first.x} 100 Z`
    }, [pathD, points])

    return (
        <svg viewBox="0 0 100 100" className="dashboard__chart-line">
            {/* Area fill */}
            <path
                d={areaD}
                className={cn(
                    "dashboard__chart-line-area",
                    animated && "dashboard__chart-line-area--animated"
                )}
            />
            {/* Line */}
            <path
                d={pathD}
                className={cn(
                    "dashboard__chart-line-path",
                    animated && "dashboard__chart-line-path--animated"
                )}
            />
            {/* Points */}
            {points.map((point, index) => (
                <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    className="dashboard__chart-line-point"
                    style={{ animationDelay: `${index * 100}ms` }}
                />
            ))}
        </svg>
    )
}

// Progress Ring Chart (for single value display)
interface ProgressRingProps {
    value: number // 0-100
    size?: number
    strokeWidth?: number
    color?: string
    label?: string
    className?: string
}

export function ProgressRing({
    value,
    size = 120,
    strokeWidth = 10,
    color = "#6366f1",
    label,
    className,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
        <div className={cn("dashboard__progress-ring", className)}>
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="dashboard__progress-ring-bg"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="dashboard__progress-ring-progress"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
            </svg>
            <div className="dashboard__progress-ring-content">
                <span className="dashboard__progress-ring-value">{value}%</span>
                {label && (
                    <span className="dashboard__progress-ring-label">{label}</span>
                )}
            </div>
        </div>
    )
}

export default Chart
