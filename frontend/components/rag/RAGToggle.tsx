"use client"

import React from "react"
import { SourceType } from "@/lib/types/document"
import { SourceToggle as SourceToggleType } from "@/lib/types/rag"
import styles from "@/styles/rag.module.css"

/**
 * RAG Toggle Component - BEM Methodology
 * Toggle individuel pour activer/désactiver une source
 */

interface RAGToggleProps {
    label: string
    icon?: string
    count?: number
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export function RAGToggle({
    label,
    icon,
    count,
    checked,
    onChange,
    disabled = false,
    className = "",
}: RAGToggleProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked)
    }

    const toggleClasses = [
        styles["rag-toggle"],
        checked && styles["rag-toggle--active"],
        disabled && styles["rag-toggle--disabled"],
        className,
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <div className={toggleClasses}>
            <div className={styles["rag-toggle__content"]}>
                {icon && <span className={styles["rag-toggle__icon"]}>{icon}</span>}
                <label className={styles["rag-toggle__label"]}>{label}</label>
                {typeof count === "number" && (
                    <span className={styles["rag-toggle__count"]}>{count}</span>
                )}
            </div>
            <div className={styles["rag-toggle__switch"]}>
                <input
                    type="checkbox"
                    className={styles["rag-toggle__input"]}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                />
                <span className={styles["rag-toggle__slider"]} />
            </div>
        </div>
    )
}

/**
 * RAG Toggle Group - Groupe de toggles pour les sources
 */

interface RAGToggleGroupProps {
    title?: string
    toggles: SourceToggleType[]
    onToggle: (sourceType: SourceType) => void
    onSelectAll?: () => void
    onDeselectAll?: () => void
    layout?: "list" | "grid"
    className?: string
}

export function RAGToggleGroup({
    title,
    toggles,
    onToggle,
    onSelectAll,
    onDeselectAll,
    layout = "list",
    className = "",
}: RAGToggleGroupProps) {
    const groupClasses = [
        styles["rag-toggle-group"],
        layout === "grid" && styles["rag-toggle-group--grid"],
        className,
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <div className={groupClasses}>
            {(title || onSelectAll || onDeselectAll) && (
                <div className={styles["rag-toggle-group__header"]}>
                    {title && <span className={styles["rag-toggle-group__title"]}>{title}</span>}
                    <div className={styles["rag-toggle-group__actions"]}>
                        {onSelectAll && (
                            <button
                                type="button"
                                className={styles["rag-toggle-group__action"]}
                                onClick={onSelectAll}
                            >
                                Tout sélectionner
                            </button>
                        )}
                        {onDeselectAll && (
                            <button
                                type="button"
                                className={styles["rag-toggle-group__action"]}
                                onClick={onDeselectAll}
                            >
                                Tout désélectionner
                            </button>
                        )}
                    </div>
                </div>
            )}
            {toggles.map((toggle) => (
                <RAGToggle
                    key={toggle.source_type}
                    label={toggle.label}
                    icon={toggle.icon}
                    count={toggle.count}
                    checked={toggle.enabled}
                    onChange={() => onToggle(toggle.source_type)}
                />
            ))}
        </div>
    )
}

/**
 * Source Badge - Badge coloré pour afficher le type de source
 */

interface SourceBadgeProps {
    sourceType: SourceType
    showIcon?: boolean
    className?: string
}

const SOURCE_CONFIG: Record<SourceType, { label: string; icon: string }> = {
    [SourceType.DOCUMENTS]: { label: "Documents", icon: "📄" },
    [SourceType.LEASES]: { label: "Baux", icon: "📋" },
    [SourceType.PROPERTIES]: { label: "Propriétés", icon: "🏠" },
    [SourceType.TENANTS]: { label: "Locataires", icon: "👤" },
    [SourceType.KPI]: { label: "KPI", icon: "📊" },
    [SourceType.OWNERS]: { label: "Propriétaires", icon: "👥" },
}

export function SourceBadge({
    sourceType,
    showIcon = true,
    className = "",
}: SourceBadgeProps) {
    const config = SOURCE_CONFIG[sourceType]
    const badgeClasses = [
        styles["rag-source-badge"],
        styles[`rag-source-badge--${sourceType}`],
        className,
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <span className={badgeClasses}>
            {showIcon && config.icon}
            {config.label}
        </span>
    )
}

export default RAGToggle
