/**
 * EntityDetail - Generic reusable detail component for all entities
 * Phase 6 - Business UI Foundation
 */

"use client"

import React from "react"
import Link from "next/link"
import {
    ChevronRight,
    Edit,
    Trash2,
    ArrowLeft,
    Loader2,
    Calendar,
    Clock,
    ExternalLink,
    FileText,
    Check,
    AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import styles from "@/styles/entity.module.css"

// ============================================
// TYPES
// ============================================

export interface EntityDetailStat {
    label: string
    value: string | number
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "highlight" | "success" | "warning" | "error"
    trend?: {
        value: string
        positive: boolean
    }
}

export interface EntityDetailInfoItem {
    label: string
    value: React.ReactNode
    highlight?: boolean
    empty?: boolean
}

export interface EntityDetailSection {
    id: string
    title: string
    icon?: React.ComponentType<{ className?: string }>
    action?: {
        label: string
        onClick?: () => void
        href?: string
    }
    content: React.ReactNode
}

export interface EntityDetailRelatedItem {
    id: string
    title: string
    subtitle?: string
    icon?: React.ComponentType<{ className?: string }>
    href?: string
    onClick?: () => void
}

export interface EntityDetailTimelineItem {
    id: string
    title: string
    date: string
    description?: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "success" | "warning" | "error"
}

export interface EntityDetailProps {
    // Header
    title: string
    subtitle?: string
    icon?: React.ComponentType<{ className?: string }>
    avatar?: string
    avatarColor?: string
    status?: { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    badges?: Array<{ label: string; variant?: "default" | "success" | "warning" | "error" | "secondary" }>
    meta?: Array<{ icon?: React.ComponentType<{ className?: string }>; value: string }>

    // Navigation
    backHref?: string
    backLabel?: string
    onBack?: () => void

    // Actions
    onEdit?: () => void
    onDelete?: () => void
    editHref?: string
    customActions?: React.ReactNode

    // Content
    stats?: EntityDetailStat[]
    infoItems?: EntityDetailInfoItem[]
    sections?: EntityDetailSection[]
    relatedItems?: EntityDetailRelatedItem[]
    timeline?: EntityDetailTimelineItem[]

    // Documents
    documents?: Array<{
        id: string
        title: string
        name?: string
        type?: string
        date?: string
        href?: string
        onClick?: () => void
    }>
    onAddDocument?: () => void

    // State
    loading?: boolean
    error?: string | null

    // Dates
    createdAt?: string
    updatedAt?: string

    // Styling
    className?: string
    children?: React.ReactNode
}

// ============================================
// HELPER COMPONENTS
// ============================================

const InfoGrid: React.FC<{ items: EntityDetailInfoItem[] }> = ({ items }) => (
    <div className={styles["entity-detail__info-grid"]}>
        {items.map((item, idx) => (
            <div key={idx} className={styles["entity-detail__info-item"]}>
                <span className={styles["entity-detail__info-label"]}>{item.label}</span>
                <span className={`
          ${styles["entity-detail__info-value"]}
          ${item.highlight ? styles["entity-detail__info-value--highlight"] : ""}
          ${item.empty ? styles["entity-detail__info-value--empty"] : ""}
        `}>
                    {item.empty ? "Non renseigné" : item.value}
                </span>
            </div>
        ))}
    </div>
)

const StatsRow: React.FC<{ stats: EntityDetailStat[] }> = ({ stats }) => (
    <div className={styles["entity-detail__stats"]}>
        {stats.map((stat, idx) => (
            <div key={idx} className={styles["entity-detail__stat"]}>
                {stat.icon && (
                    <stat.icon className={styles["entity-detail__stat-icon"]} />
                )}
                <div className={`
          ${styles["entity-detail__stat-value"]}
          ${stat.variant ? styles[`entity-detail__stat-value--${stat.variant}`] : ""}
        `}>
                    {stat.value}
                </div>
                <div className={styles["entity-detail__stat-label"]}>{stat.label}</div>
                {stat.trend && (
                    <div className={`
            ${styles["entity-detail__stat-trend"]}
            ${stat.trend.positive
                            ? styles["entity-detail__stat-trend--positive"]
                            : styles["entity-detail__stat-trend--negative"]
                        }
          `}>
                        {stat.trend.positive ? "↑" : "↓"} {stat.trend.value}
                    </div>
                )}
            </div>
        ))}
    </div>
)

const RelatedList: React.FC<{ items: EntityDetailRelatedItem[] }> = ({ items }) => (
    <div className={styles["entity-detail__related"]}>
        {items.map((item) => {
            const content = (
                <>
                    {item.icon && (
                        <div className={styles["entity-detail__related-icon"]}>
                            <item.icon />
                        </div>
                    )}
                    <div className={styles["entity-detail__related-content"]}>
                        <div className={styles["entity-detail__related-title"]}>{item.title}</div>
                        {item.subtitle && (
                            <div className={styles["entity-detail__related-subtitle"]}>{item.subtitle}</div>
                        )}
                    </div>
                    <ChevronRight className={styles["entity-detail__related-chevron"]} />
                </>
            )

            if (item.href) {
                return (
                    <Link key={item.id} href={item.href} className={styles["entity-detail__related-item"]}>
                        {content}
                    </Link>
                )
            }

            return (
                <div
                    key={item.id}
                    className={styles["entity-detail__related-item"]}
                    onClick={item.onClick}
                >
                    {content}
                </div>
            )
        })}
    </div>
)

const Timeline: React.FC<{ items: EntityDetailTimelineItem[] }> = ({ items }) => (
    <div className={styles["entity-detail__timeline"]}>
        {items.map((item) => (
            <div key={item.id} className={styles["entity-detail__timeline-item"]}>
                <div className={`
          ${styles["entity-detail__timeline-dot"]}
          ${item.variant ? styles[`entity-detail__timeline-dot--${item.variant}`] : ""}
        `}>
                    {item.icon ? (
                        <item.icon />
                    ) : item.variant === "success" ? (
                        <Check />
                    ) : item.variant === "error" ? (
                        <AlertCircle />
                    ) : (
                        <Clock />
                    )}
                </div>
                <div className={styles["entity-detail__timeline-content"]}>
                    <div className={styles["entity-detail__timeline-title"]}>{item.title}</div>
                    <div className={styles["entity-detail__timeline-date"]}>{item.date}</div>
                    {item.description && (
                        <div className={styles["entity-detail__timeline-description"]}>{item.description}</div>
                    )}
                </div>
            </div>
        ))}
    </div>
)

// ============================================
// MAIN COMPONENT
// ============================================

export function EntityDetail({
    title,
    subtitle,
    icon: Icon,
    avatar,
    avatarColor,
    status,
    badges = [],
    meta = [],
    backHref,
    backLabel = "Retour",
    onBack,
    onEdit,
    onDelete,
    editHref,
    customActions,
    stats,
    infoItems,
    sections,
    relatedItems,
    timeline,
    documents,
    onAddDocument,
    loading,
    error,
    createdAt,
    updatedAt,
    className,
    children,
}: EntityDetailProps) {
    // Loading state
    if (loading) {
        return (
            <div className={styles["entity-loading"]}>
                <Loader2 className={styles["entity-loading__spinner"]} />
                <span className={styles["entity-loading__text"]}>Chargement...</span>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className={styles["entity-empty"]}>
                <div className={styles["entity-empty__icon"]}>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className={styles["entity-empty__title"]}>Erreur</div>
                <div className={styles["entity-empty__description"]}>{error}</div>
                {onBack && (
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {backLabel}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className={`${styles["entity-detail"]} ${className || ""}`}>
            {/* Back Navigation */}
            {(backHref || onBack) && (
                <div className="mb-4">
                    {backHref ? (
                        <Link
                            href={backHref}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            {backLabel}
                        </Link>
                    ) : (
                        <button
                            onClick={onBack}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            {backLabel}
                        </button>
                    )}
                </div>
            )}

            {/* Header */}
            <div className={styles["entity-detail__header"]}>
                <div className={styles["entity-detail__header-main"]}>
                    {/* Icon or Avatar */}
                    {Icon && (
                        <div className={styles["entity-detail__header-icon"]}>
                            <Icon />
                        </div>
                    )}
                    {avatar && !Icon && (
                        <div
                            className={styles["entity-detail__header-avatar"]}
                            style={avatarColor ? { background: avatarColor } : undefined}
                        >
                            {avatar}
                        </div>
                    )}

                    {/* Content */}
                    <div className={styles["entity-detail__header-content"]}>
                        <div className={styles["entity-detail__header-title-row"]}>
                            <h1 className={styles["entity-detail__header-title"]}>{title}</h1>
                            {status && (
                                <Badge variant={status.variant}>{status.label}</Badge>
                            )}
                            {badges.map((badge, idx) => (
                                <Badge key={idx} variant={badge.variant || "default"}>{badge.label}</Badge>
                            ))}
                        </div>

                        {subtitle && (
                            <p className={styles["entity-detail__header-subtitle"]}>{subtitle}</p>
                        )}

                        {/* Meta info */}
                        {(meta.length > 0 || createdAt || updatedAt) && (
                            <div className={styles["entity-detail__header-meta"]}>
                                {meta.map((m, idx) => (
                                    <span key={idx} className={styles["entity-detail__header-meta-item"]}>
                                        {m.icon && <m.icon />}
                                        {m.value}
                                    </span>
                                ))}
                                {createdAt && (
                                    <span className={styles["entity-detail__header-meta-item"]}>
                                        <Calendar />
                                        Créé le {new Date(createdAt).toLocaleDateString("fr-FR")}
                                    </span>
                                )}
                                {updatedAt && (
                                    <span className={styles["entity-detail__header-meta-item"]}>
                                        <Clock />
                                        Modifié le {new Date(updatedAt).toLocaleDateString("fr-FR")}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className={styles["entity-detail__header-actions"]}>
                    {customActions}
                    {editHref ? (
                        <Link href={editHref}>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                            </Button>
                        </Link>
                    ) : onEdit && (
                        <Button variant="outline" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="destructive" onClick={onDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            {stats && stats.length > 0 && <StatsRow stats={stats} />}

            {/* Info Items */}
            {infoItems && infoItems.length > 0 && (
                <div className={styles["entity-detail__section"]}>
                    <div className={styles["entity-detail__section-header"]}>
                        <h3 className={styles["entity-detail__section-title"]}>Informations</h3>
                    </div>
                    <div className={styles["entity-detail__section-content"]}>
                        <InfoGrid items={infoItems} />
                    </div>
                </div>
            )}

            {/* Custom Sections */}
            {sections?.map((section) => (
                <div key={section.id} className={styles["entity-detail__section"]}>
                    <div className={styles["entity-detail__section-header"]}>
                        <h3 className={styles["entity-detail__section-title"]}>
                            {section.icon && <section.icon className="inline h-5 w-5 mr-2" />}
                            {section.title}
                        </h3>
                        {section.action && (
                            section.action.href ? (
                                <Link href={section.action.href} className={styles["entity-detail__section-action"]}>
                                    {section.action.label}
                                    <ExternalLink className="inline h-3 w-3 ml-1" />
                                </Link>
                            ) : (
                                <button
                                    onClick={section.action.onClick}
                                    className={styles["entity-detail__section-action"]}
                                >
                                    {section.action.label}
                                </button>
                            )
                        )}
                    </div>
                    <div className={styles["entity-detail__section-content"]}>
                        {section.content}
                    </div>
                </div>
            ))}

            {/* Related Items */}
            {relatedItems && relatedItems.length > 0 && (
                <div className={styles["entity-detail__section"]}>
                    <div className={styles["entity-detail__section-header"]}>
                        <h3 className={styles["entity-detail__section-title"]}>Éléments liés</h3>
                    </div>
                    <div className={styles["entity-detail__section-content"]}>
                        <RelatedList items={relatedItems} />
                    </div>
                </div>
            )}

            {/* Documents */}
            {documents && (
                <div className={styles["entity-detail__section"]}>
                    <div className={styles["entity-detail__section-header"]}>
                        <h3 className={styles["entity-detail__section-title"]}>Documents</h3>
                        {onAddDocument && (
                            <button onClick={onAddDocument} className={styles["entity-detail__section-action"]}>
                                Ajouter un document
                            </button>
                        )}
                    </div>
                    <div className={styles["entity-detail__section-content"]}>
                        {documents.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>Aucun document associé</p>
                            </div>
                        ) : (
                            <RelatedList
                                items={documents.map(doc => ({
                                    id: doc.id,
                                    title: doc.type || 'Document',
                                    subtitle: [doc.title].filter(Boolean).join(" • "),
                                    icon: FileText,
                                    href: doc.href,
                                    onClick: doc.onClick,
                                }))}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Timeline */}
            {timeline && timeline.length > 0 && (
                <div className={styles["entity-detail__section"]}>
                    <div className={styles["entity-detail__section-header"]}>
                        <h3 className={styles["entity-detail__section-title"]}>Historique</h3>
                    </div>
                    <div className={styles["entity-detail__section-content"]}>
                        <Timeline items={timeline} />
                    </div>
                </div>
            )}

            {/* Custom children */}
            {children}
        </div>
    )
}

export default EntityDetail
