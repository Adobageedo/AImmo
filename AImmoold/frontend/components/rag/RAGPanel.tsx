"use client"

import React from "react"
import styles from "@/styles/rag.module.css"

/**
 * RAG Document Exclusion - Gestion de l'exclusion d'un document du RAG
 */

interface DocumentExclusionProps {
    documentId: string
    title: string
    isExcluded: boolean
    onToggle: () => void
    fileIcon?: string
    className?: string
}

export function DocumentExclusion({
    documentId,
    title,
    isExcluded,
    onToggle,
    fileIcon = "📄",
    className = "",
}: DocumentExclusionProps) {
    const containerClasses = [
        styles["rag-exclusion"],
        isExcluded && styles["rag-exclusion--excluded"],
        className,
    ]
        .filter(Boolean)
        .join(" ")

    const buttonClasses = [
        styles["rag-exclusion__button"],
        isExcluded && styles["rag-exclusion__button--danger"],
    ]
        .filter(Boolean)
        .join(" ")

    const statusClasses = [
        styles["rag-exclusion__status"],
        isExcluded && styles["rag-exclusion__status--excluded"],
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <div className={containerClasses}>
            <span className={styles["rag-exclusion__icon"]}>{fileIcon}</span>
            <div className={styles["rag-exclusion__info"]}>
                <div className={styles["rag-exclusion__title"]}>{title}</div>
                <div className={statusClasses}>
                    {isExcluded ? "Exclu du RAG" : "Inclus dans le RAG"}
                </div>
            </div>
            <button type="button" className={buttonClasses} onClick={onToggle}>
                {isExcluded ? "Inclure" : "Exclure"}
            </button>
        </div>
    )
}

/**
 * RAG Stats - Affichage des statistiques RAG
 */

interface RAGStatsCardProps {
    totalChunks: number
    documentsIndexed: number
    documentsExcluded: number
    lastUpdate?: string
    className?: string
}

export function RAGStatsCard({
    totalChunks,
    documentsIndexed,
    documentsExcluded,
    lastUpdate,
    className = "",
}: RAGStatsCardProps) {
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return "Jamais"
        const date = new Date(dateStr)
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className={`${styles["rag-stats"]} ${className}`}>
            <div className={styles["rag-stats__item"]}>
                <div className={styles["rag-stats__value"]}>{totalChunks.toLocaleString()}</div>
                <div className={styles["rag-stats__label"]}>Chunks</div>
            </div>
            <div className={styles["rag-stats__item"]}>
                <div className={styles["rag-stats__value"]}>{documentsIndexed}</div>
                <div className={styles["rag-stats__label"]}>Documents</div>
            </div>
            <div className={styles["rag-stats__item"]}>
                <div className={styles["rag-stats__value"]}>{documentsExcluded}</div>
                <div className={styles["rag-stats__label"]}>Exclus</div>
            </div>
            <div className={styles["rag-stats__item"]}>
                <div className={styles["rag-stats__value"]} style={{ fontSize: "0.875rem" }}>
                    {formatDate(lastUpdate)}
                </div>
                <div className={styles["rag-stats__label"]}>Dernière MAJ</div>
            </div>
        </div>
    )
}

/**
 * RAG Panel - Panneau modal/sidebar pour les contrôles RAG
 */

interface RAGPanelProps {
    title: string
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    footer?: React.ReactNode
    className?: string
}

export function RAGPanel({
    title,
    isOpen,
    onClose,
    children,
    footer,
    className = "",
}: RAGPanelProps) {
    if (!isOpen) return null

    return (
        <div className={`${styles["rag-panel"]} ${className}`}>
            <div className={styles["rag-panel__header"]}>
                <h3 className={styles["rag-panel__title"]}>{title}</h3>
                <button
                    type="button"
                    className={styles["rag-panel__close"]}
                    onClick={onClose}
                    aria-label="Fermer"
                >
                    ✕
                </button>
            </div>
            <div className={styles["rag-panel__content"]}>{children}</div>
            {footer && <div className={styles["rag-panel__footer"]}>{footer}</div>}
        </div>
    )
}

/**
 * RAG Container - Wrapper avec support dark mode
 */

interface RAGContainerProps {
    children: React.ReactNode
    darkMode?: boolean
    className?: string
}

export function RAGContainer({
    children,
    darkMode = false,
    className = "",
}: RAGContainerProps) {
    const containerClasses = [
        styles["rag-container"],
        darkMode && styles["rag-container--dark"],
        className,
    ]
        .filter(Boolean)
        .join(" ")

    return <div className={containerClasses}>{children}</div>
}

export default DocumentExclusion
