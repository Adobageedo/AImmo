/**
 * EntityList - Generic reusable list component for all entities
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
    Search,
    ChevronRight,
    Filter,
    Grid3X3,
    List,
    ChevronLeft,
    ChevronDown,
    MoreVertical,
    Loader2,
    Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import styles from "@/styles/entity.module.css"

// ============================================
// TYPES
// ============================================

export interface EntityListColumn<T> {
    key: keyof T | string
    label: string
    render?: (entity: T) => React.ReactNode
    sortable?: boolean
    width?: string
    align?: "left" | "center" | "right"
    hideOnMobile?: boolean
}

export interface EntityListAction<T> {
    key: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: (entity: T) => void
    variant?: "default" | "danger"
    condition?: (entity: T) => boolean
}

export interface EntityListProps<T extends { id: string }> {
    // Data
    items: T[]
    loading?: boolean
    error?: string | null

    // Display
    title?: string
    subtitle?: string
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: React.ComponentType<{ className?: string }>

    // Item rendering
    getTitle: (item: T) => string
    getSubtitle?: (item: T) => string
    getIcon?: (item: T) => React.ComponentType<{ className?: string }>
    getAvatar?: (item: T) => string // Returns initials
    getAvatarColor?: (item: T) => string // CSS gradient
    getStatus?: (item: T) => { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
    getBadges?: (item: T) => Array<{ label: string; variant?: "default" | "success" | "warning" | "error" | "secondary" }>
    getMeta?: (item: T) => Array<{ icon?: React.ComponentType<{ className?: string }>; value: string }>
    getStats?: (item: T) => Array<{ value: string; label: string; variant?: "default" | "highlight" | "success" | "warning" | "error" }>

    // Selection & Navigation
    selectedId?: string | null
    onSelect?: (item: T) => void
    onDoubleClick?: (item: T) => void
    highlightIds?: string[]

    // Columns (for table view)
    columns?: EntityListColumn<T>[]

    // Actions
    actions?: EntityListAction<T>[]
    primaryAction?: {
        label: string
        icon?: React.ComponentType<{ className?: string }>
        onClick: () => void
    }

    // Search & Filter
    searchPlaceholder?: string
    onSearch?: (query: string) => void
    searchValue?: string
    filterComponent?: React.ReactNode

    // Sorting
    sortOptions?: Array<{ label: string; value: string }>
    sortValue?: string
    onSortChange?: (value: string) => void

    // Pagination
    page?: number
    totalPages?: number
    totalItems?: number
    pageSize?: number
    onPageChange?: (page: number) => void

    // View Mode
    viewMode?: "list" | "grid" | "table"
    onViewModeChange?: (mode: "list" | "grid" | "table") => void
    showViewToggle?: boolean

    // Styling
    className?: string
    itemClassName?: string
}

// ============================================
// COMPONENT
// ============================================

export function EntityList<T extends { id: string }>({
    items,
    loading = false,
    error,
    title,
    subtitle,
    emptyTitle = "Aucun élément",
    emptyDescription = "Commencez par ajouter un nouvel élément",
    emptyIcon: EmptyIcon,
    getTitle,
    getSubtitle,
    getIcon,
    getAvatar,
    getAvatarColor,
    getStatus,
    getBadges,
    getMeta,
    getStats,
    selectedId,
    onSelect,
    onDoubleClick,
    highlightIds = [],
    columns,
    actions,
    primaryAction,
    searchPlaceholder = "Rechercher...",
    onSearch,
    searchValue = "",
    filterComponent,
    sortOptions,
    sortValue,
    onSortChange,
    page = 1,
    totalPages = 1,
    totalItems,
    onPageChange,
    viewMode = "list",
    onViewModeChange,
    showViewToggle = true,
    className,
    itemClassName,
}: EntityListProps<T>) {
    const [internalSearch, setInternalSearch] = useState(searchValue)
    const [showFilters, setShowFilters] = useState(false)

    // Handle search
    const handleSearch = useCallback((value: string) => {
        setInternalSearch(value)
        onSearch?.(value)
    }, [onSearch])

    // Filtered & sorted items (if client-side)
    const displayItems = useMemo(() => {
        let result = [...items]

        // Client-side search if no onSearch provided
        if (internalSearch && !onSearch) {
            const query = internalSearch.toLowerCase()
            result = result.filter(item => {
                const title = getTitle(item).toLowerCase()
                const subtitle = getSubtitle?.(item)?.toLowerCase() || ""
                return title.includes(query) || subtitle.includes(query)
            })
        }

        return result
    }, [items, internalSearch, onSearch, getTitle, getSubtitle])

    // Render loading state
    if (loading && items.length === 0) {
        return (
            <div className={styles["entity-loading"]}>
                <Loader2 className={styles["entity-loading__spinner"]} />
                <span className={styles["entity-loading__text"]}>Chargement...</span>
            </div>
        )
    }

    // Render error state
    if (error) {
        return (
            <div className={styles["entity-empty"]}>
                <div className={styles["entity-empty__title"]}>Erreur</div>
                <div className={styles["entity-empty__description"]}>{error}</div>
                <Button onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
        )
    }

    // Render empty state
    if (!loading && displayItems.length === 0) {
        return (
            <div className={className}>
                {/* Header */}
                {(title || primaryAction) && (
                    <div className={styles["entity-list__header"]}>
                        <div>
                            {title && <h2 className={styles["entity-list__title"]}>{title}</h2>}
                            {subtitle && <p className={styles["entity-list__subtitle"]}>{subtitle}</p>}
                        </div>
                        {primaryAction && (
                            <Button onClick={primaryAction.onClick}>
                                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                                {primaryAction.label}
                            </Button>
                        )}
                    </div>
                )}

                <div className={styles["entity-empty"]}>
                    {EmptyIcon && (
                        <div className={styles["entity-empty__icon"]}>
                            <EmptyIcon className="h-8 w-8" />
                        </div>
                    )}
                    <div className={styles["entity-empty__title"]}>{emptyTitle}</div>
                    <div className={styles["entity-empty__description"]}>{emptyDescription}</div>
                    {primaryAction && (
                        <Button onClick={primaryAction.onClick}>
                            <Plus className="h-4 w-4 mr-2" />
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            {/* Header */}
            {(title || primaryAction || onSearch || showViewToggle) && (
                <div className={styles["entity-list__header"]}>
                    <div>
                        {title && <h2 className={styles["entity-list__title"]}>{title}</h2>}
                        {subtitle && <p className={styles["entity-list__subtitle"]}>{subtitle}</p>}
                    </div>
                    <div className={styles["entity-list__actions"]}>
                        {totalItems !== undefined && (
                            <span className={styles["entity-list__count"]}>
                                {totalItems} résultat{totalItems > 1 ? "s" : ""}
                            </span>
                        )}
                        {showViewToggle && onViewModeChange && (
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => onViewModeChange("list")}
                                    className={`p-2 ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onViewModeChange("grid")}
                                    className={`p-2 ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {filterComponent && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filtres
                                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                            </Button>
                        )}
                        {primaryAction && (
                            <Button onClick={primaryAction.onClick}>
                                {primaryAction.icon ? (
                                    <primaryAction.icon className="h-4 w-4 mr-2" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                {primaryAction.label}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Filters Row */}
            {(onSearch || filterComponent || sortOptions) && (
                <div className={styles["entity-list__filters"]}>
                    {onSearch !== undefined && (
                        <div className={styles["entity-list__search"]}>
                            <Search className={styles["entity-list__search-icon"]} />
                            <input
                                type="text"
                                value={internalSearch}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className={styles["entity-list__search-input"]}
                            />
                        </div>
                    )}

                    {sortOptions && (
                        <div className={styles["entity-list__filter-group"]}>
                            <label className={styles["entity-list__filter-label"]}>Trier par</label>
                            <select
                                value={sortValue}
                                onChange={(e) => onSortChange?.(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {showFilters && filterComponent && (
                        <div className="w-full mt-3 pt-3 border-t border-gray-200">
                            {filterComponent}
                        </div>
                    )}
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="flex items-center justify-center py-4 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Chargement...
                </div>
            )}

            {/* List */}
            <div className={`${styles["entity-list"]} ${viewMode === "grid" ? styles["entity-list--grid"] : ""}`}>
                {displayItems.map((item) => {
                    const Icon = getIcon?.(item)
                    const avatar = getAvatar?.(item)
                    const status = getStatus?.(item)
                    const badges = getBadges?.(item) || []
                    const meta = getMeta?.(item) || []
                    const stats = getStats?.(item) || []
                    const isSelected = selectedId === item.id
                    const isHighlighted = highlightIds.includes(item.id)

                    return (
                        <div
                            key={item.id}
                            className={`
                ${styles["entity-list__item"]}
                ${isSelected ? styles["entity-list__item--selected"] : ""}
                ${isHighlighted ? styles["entity-list__item--highlight"] : ""}
                ${itemClassName || ""}
              `}
                            onClick={() => onSelect?.(item)}
                            onDoubleClick={() => onDoubleClick?.(item)}
                        >
                            {/* Icon or Avatar */}
                            {Icon && (
                                <div className={styles["entity-list__item-icon"]}>
                                    <Icon />
                                </div>
                            )}
                            {avatar && !Icon && (
                                <div
                                    className={styles["entity-list__item-avatar"]}
                                    style={getAvatarColor ? { background: getAvatarColor(item) } : undefined}
                                >
                                    {avatar}
                                </div>
                            )}

                            {/* Content */}
                            <div className={styles["entity-list__item-content"]}>
                                <div className={styles["entity-list__item-header"]}>
                                    <span className={styles["entity-list__item-title"]}>
                                        {getTitle(item)}
                                    </span>
                                    {status && (
                                        <Badge variant={status.variant} className={styles["entity-list__item-badge"]}>
                                            {status.label}
                                        </Badge>
                                    )}
                                    {badges.map((badge, idx) => (
                                        <Badge key={idx} variant={badge.variant || "default"} className={styles["entity-list__item-badge"]}>
                                            {badge.label}
                                        </Badge>
                                    ))}
                                </div>

                                {getSubtitle && (
                                    <div className={styles["entity-list__item-subtitle"]}>
                                        {getSubtitle(item)}
                                    </div>
                                )}

                                {meta.length > 0 && (
                                    <div className={styles["entity-list__item-meta"]}>
                                        {meta.map((m, idx) => (
                                            <span key={idx} className={styles["entity-list__item-meta-item"]}>
                                                {m.icon && <m.icon />}
                                                {m.value}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            {stats.length > 0 && (
                                <div className={styles["entity-list__item-stats"]}>
                                    {stats.map((stat, idx) => (
                                        <div key={idx} className={styles["entity-list__item-stat"]}>
                                            <span className={`
                        ${styles["entity-list__item-stat-value"]}
                        ${stat.variant ? styles[`entity-list__item-stat-value--${stat.variant}`] : ""}
                      `}>
                                                {stat.value}
                                            </span>
                                            <span className={styles["entity-list__item-stat-label"]}>
                                                {stat.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            {actions && actions.length > 0 && (
                                <div className={styles["entity-list__item-actions"]}>
                                    {actions.filter(a => !a.condition || a.condition(item)).slice(0, 2).map(action => (
                                        <button
                                            key={action.key}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                action.onClick(item)
                                            }}
                                            className={styles["entity-list__item-action"]}
                                            title={action.label}
                                        >
                                            {action.icon ? <action.icon className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <ChevronRight className={styles["entity-list__item-chevron"]} />
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && onPageChange && (
                <div className={styles["entity-list__pagination"]}>
                    <span className={styles["entity-list__pagination-info"]}>
                        Page {page} sur {totalPages}
                        {totalItems !== undefined && ` • ${totalItems} éléments`}
                    </span>
                    <div className={styles["entity-list__pagination-controls"]}>
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className={styles["entity-list__pagination-btn"]}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (page <= 3) {
                                pageNum = i + 1
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = page - 2 + i
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`
                    ${styles["entity-list__pagination-btn"]}
                    ${page === pageNum ? styles["entity-list__pagination-btn--active"] : ""}
                  `}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className={styles["entity-list__pagination-btn"]}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EntityList
