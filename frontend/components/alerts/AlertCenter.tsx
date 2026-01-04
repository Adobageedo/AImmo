"use client"

import React, { useMemo, useState } from "react"
import {
    Bell,
    AlertTriangle,
    Calendar,
    TrendingUp,
    FileWarning,
    Wrench,
    Home,
    Shield,
    Tag,
    Check,
    X,
    Clock,
    ChevronRight,
    Filter,
    CheckCircle,
    XCircle,
    AlertCircle,
    DollarSign,
    RefreshCw,
} from "lucide-react"
import { useAlerts } from "@/lib/hooks/use-alerts"
import {
    Alert,
    AlertType,
    AlertPriority,
    AlertStatus
} from "@/lib/types/alerts"
import styles from "@/styles/alerts.module.css"

// ================================
// Alert Type Icons
// ================================
const alertTypeIcons: Record<AlertType, React.ReactNode> = {
    [AlertType.UNPAID]: <DollarSign className="w-6 h-6" />,
    [AlertType.RENEWAL]: <RefreshCw className="w-6 h-6" />,
    [AlertType.INDEXATION]: <TrendingUp className="w-6 h-6" />,
    [AlertType.DOCUMENT]: <FileWarning className="w-6 h-6" />,
    [AlertType.MAINTENANCE]: <Wrench className="w-6 h-6" />,
    [AlertType.VACANCY]: <Home className="w-6 h-6" />,
    [AlertType.INSURANCE]: <Shield className="w-6 h-6" />,
    [AlertType.CUSTOM]: <Tag className="w-6 h-6" />,
}

const alertTypeLabels: Record<AlertType, string> = {
    [AlertType.UNPAID]: "Impayé",
    [AlertType.RENEWAL]: "Renouvellement",
    [AlertType.INDEXATION]: "Indexation",
    [AlertType.DOCUMENT]: "Document",
    [AlertType.MAINTENANCE]: "Maintenance",
    [AlertType.VACANCY]: "Vacance",
    [AlertType.INSURANCE]: "Assurance",
    [AlertType.CUSTOM]: "Personnalisé",
}

const priorityLabels: Record<AlertPriority, string> = {
    [AlertPriority.LOW]: "Basse",
    [AlertPriority.MEDIUM]: "Moyenne",
    [AlertPriority.HIGH]: "Haute",
    [AlertPriority.URGENT]: "Urgente",
}

// ================================
// Alert Item Component
// ================================
interface AlertItemProps {
    alert: Alert
    onAcknowledge: (id: string) => void
    onResolve: (id: string) => void
    onDismiss: (id: string) => void
    onSnooze: (id: string) => void
    onClick?: (alert: Alert) => void
}

export function AlertItem({
    alert,
    onAcknowledge,
    onResolve,
    onDismiss,
    onSnooze,
    onClick,
}: AlertItemProps) {
    const priorityClass = `${styles["alert-item"]} ${styles[`alert-item--${alert.priority}`]} ${styles[`alert-item--${alert.status}`] || ""}`
    const iconClass = `${styles["alert-item__icon"]} ${styles[`alert-item__icon--${alert.type}`]}`
    const priorityBadgeClass = `${styles["alert-item__priority"]} ${styles[`alert-item__priority--${alert.priority}`]}`

    const formattedDate = useMemo(() => {
        if (!alert.due_date) return null
        const date = new Date(alert.due_date)
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
        })
    }, [alert.due_date])

    const formattedAmount = useMemo(() => {
        if (!alert.amount) return null
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(alert.amount)
    }, [alert.amount])

    return (
        <div
            className={priorityClass}
            onClick={() => onClick?.(alert)}
        >
            {/* Icon */}
            <div className={iconClass}>
                {alertTypeIcons[alert.type]}
            </div>

            {/* Content */}
            <div className={styles["alert-item__content"]}>
                <div className={styles["alert-item__header"]}>
                    <h4 className={styles["alert-item__title"]}>{alert.title}</h4>
                    <span className={priorityBadgeClass}>
                        {priorityLabels[alert.priority]}
                    </span>
                </div>

                <p className={styles["alert-item__message"]}>{alert.message}</p>

                <div className={styles["alert-item__meta"]}>
                    {/* Type */}
                    <span className={styles["alert-item__meta-item"]}>
                        <Tag className="w-3.5 h-3.5" />
                        {alertTypeLabels[alert.type]}
                    </span>

                    {/* Due Date */}
                    {formattedDate && (
                        <span className={styles["alert-item__meta-item"]}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate}
                        </span>
                    )}

                    {/* Amount */}
                    {formattedAmount && (
                        <span className={`${styles["alert-item__meta-item"]} ${styles["alert-item__amount"]}`}>
                            {formattedAmount}
                        </span>
                    )}

                    {/* Reference */}
                    {alert.reference && (
                        <a
                            href={alert.action_url || "#"}
                            className={styles["alert-item__reference"]}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {alert.reference.entity_name}
                            <ChevronRight className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>

            {/* Actions */}
            {alert.status !== AlertStatus.RESOLVED && alert.status !== AlertStatus.DISMISSED && (
                <div className={styles["alert-item__actions"]}>
                    <button
                        className={`${styles["alert-item__action-btn"]} ${styles["alert-item__action-btn--resolve"]}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onResolve(alert.id)
                        }}
                        title="Marquer comme résolu"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                    <button
                        className={`${styles["alert-item__action-btn"]} ${styles["alert-item__action-btn--snooze"]}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onSnooze(alert.id)
                        }}
                        title="Reporter"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                    <button
                        className={`${styles["alert-item__action-btn"]} ${styles["alert-item__action-btn--dismiss"]}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onDismiss(alert.id)
                        }}
                        title="Ignorer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}

// ================================
// Alert Stats Component
// ================================
interface AlertStatsProps {
    urgent: number
    pending: number
    today: number
    resolved: number
}

export function AlertStats({ urgent, pending, today, resolved }: AlertStatsProps) {
    return (
        <div className={styles["alert-stats"]}>
            <div className={`${styles["alert-stats__card"]} ${styles["alert-stats__card--urgent"]}`}>
                <div className={styles["alert-stats__value"]}>{urgent}</div>
                <div className={styles["alert-stats__label"]}>Urgentes</div>
                <AlertTriangle className={styles["alert-stats__icon"]} />
            </div>
            <div className={`${styles["alert-stats__card"]} ${styles["alert-stats__card--pending"]}`}>
                <div className={styles["alert-stats__value"]}>{pending}</div>
                <div className={styles["alert-stats__label"]}>En attente</div>
                <Clock className={styles["alert-stats__icon"]} />
            </div>
            <div className={`${styles["alert-stats__card"]} ${styles["alert-stats__card--today"]}`}>
                <div className={styles["alert-stats__value"]}>{today}</div>
                <div className={styles["alert-stats__label"]}>Aujourd&apos;hui</div>
                <Calendar className={styles["alert-stats__icon"]} />
            </div>
            <div className={`${styles["alert-stats__card"]} ${styles["alert-stats__card--resolved"]}`}>
                <div className={styles["alert-stats__value"]}>{resolved}</div>
                <div className={styles["alert-stats__label"]}>Résolues</div>
                <CheckCircle className={styles["alert-stats__icon"]} />
            </div>
        </div>
    )
}

// ================================
// Alert Filter Chips
// ================================
interface AlertFiltersProps {
    activeTypes: AlertType[]
    activePriorities: AlertPriority[]
    activeStatuses: AlertStatus[]
    onTypeChange: (types: AlertType[]) => void
    onPriorityChange: (priorities: AlertPriority[]) => void
    onStatusChange: (statuses: AlertStatus[]) => void
    onClear: () => void
}

export function AlertFilters({
    activeTypes,
    activePriorities,
    activeStatuses,
    onTypeChange,
    onPriorityChange,
    onStatusChange,
    onClear,
}: AlertFiltersProps) {
    const hasFilters = activeTypes.length > 0 || activePriorities.length > 0 || activeStatuses.length > 0

    const toggleType = (type: AlertType) => {
        if (activeTypes.includes(type)) {
            onTypeChange(activeTypes.filter(t => t !== type))
        } else {
            onTypeChange([...activeTypes, type])
        }
    }

    const togglePriority = (priority: AlertPriority) => {
        if (activePriorities.includes(priority)) {
            onPriorityChange(activePriorities.filter(p => p !== priority))
        } else {
            onPriorityChange([...activePriorities, priority])
        }
    }

    return (
        <div className={styles["alert-filters"]}>
            <div className={styles["alert-filters__row"]}>
                <div className={styles["alert-filters__group"]}>
                    <span className={styles["alert-filters__label"]}>Type:</span>
                    {Object.values(AlertType).slice(0, 4).map(type => (
                        <button
                            key={type}
                            className={`${styles["alert-filters__chip"]} ${activeTypes.includes(type) ? styles["alert-filters__chip--active"] : ""}`}
                            onClick={() => toggleType(type)}
                        >
                            {alertTypeLabels[type]}
                        </button>
                    ))}
                </div>

                <div className={styles["alert-filters__group"]}>
                    <span className={styles["alert-filters__label"]}>Priorité:</span>
                    {Object.values(AlertPriority).map(priority => (
                        <button
                            key={priority}
                            className={`${styles["alert-filters__chip"]} ${activePriorities.includes(priority) ? styles["alert-filters__chip--active"] : ""}`}
                            onClick={() => togglePriority(priority)}
                        >
                            {priorityLabels[priority]}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button className={styles["alert-filters__clear"]} onClick={onClear}>
                        Effacer les filtres
                    </button>
                )}
            </div>
        </div>
    )
}

// ================================
// Alert Bell (Header Component)
// ================================
interface AlertBellProps {
    count: number
    onClick: () => void
}

export function AlertBell({ count, onClick }: AlertBellProps) {
    return (
        <div className={styles["alert-bell"]}>
            <button className={styles["alert-bell__button"]} onClick={onClick}>
                <Bell className="w-5 h-5" />
                {count > 0 && (
                    <span className={styles["alert-bell__badge"]}>
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>
        </div>
    )
}

// ================================
// Empty State
// ================================
function AlertsEmptyState() {
    return (
        <div className={styles["alert-list__empty"]}>
            <div className={styles["alert-list__empty-icon"]}>
                <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className={styles["alert-list__empty-title"]}>
                Aucune alerte
            </h3>
            <p className={styles["alert-list__empty-text"]}>
                Tout est en ordre ! Vous n&apos;avez pas d&apos;alertes en attente.
            </p>
        </div>
    )
}

// ================================
// Main Alert Center Component
// ================================
interface AlertCenterProps {
    className?: string
}

export function AlertCenter({ className = "" }: AlertCenterProps) {
    const {
        alerts,
        loading,
        error,
        pendingCount,
        stats,
        urgentAlerts,
        loadAlerts,
        resolveAlert,
        dismissAlert,
        snoozeAlert,
        acknowledgeAlert,
        filterByType,
        filterByPriority,
        filterByStatus,
        clearFilters,
        filters,
    } = useAlerts({ autoLoad: true })

    const [showFilters, setShowFilters] = useState(false)

    // Calculate today's alerts
    const todayAlerts = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return alerts.filter(a => {
            const created = new Date(a.created_at)
            created.setHours(0, 0, 0, 0)
            return created.getTime() === today.getTime()
        })
    }, [alerts])

    // Calculate resolved alerts
    const resolvedAlerts = useMemo(() => {
        return alerts.filter(a => a.status === AlertStatus.RESOLVED)
    }, [alerts])

    // Handle snooze
    const handleSnooze = async (alertId: string) => {
        // Default snooze to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        await snoozeAlert(alertId, tomorrow)
    }

    // Group alerts by priority
    const groupedAlerts = useMemo(() => {
        const unresolved = alerts.filter(a =>
            a.status !== AlertStatus.RESOLVED && a.status !== AlertStatus.DISMISSED
        )
        return {
            urgent: unresolved.filter(a => a.priority === AlertPriority.URGENT),
            high: unresolved.filter(a => a.priority === AlertPriority.HIGH),
            medium: unresolved.filter(a => a.priority === AlertPriority.MEDIUM),
            low: unresolved.filter(a => a.priority === AlertPriority.LOW),
        }
    }, [alerts])

    return (
        <div className={`${styles["alert-center"]} ${className}`}>
            {/* Header */}
            <div className={styles["alert-center__header"]}>
                <div>
                    <h1 className={styles["alert-center__title"]}>
                        Centre d&apos;Alertes
                    </h1>
                </div>
                <div className={styles["alert-center__actions"]}>
                    {pendingCount > 0 && (
                        <span className={styles["alert-center__badge"]}>
                            {pendingCount}
                        </span>
                    )}
                    <button
                        className={`${styles["alert-center__filter-btn"]} ${showFilters ? styles["alert-center__filter-btn--active"] : ""}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                        Filtrer
                    </button>
                </div>
            </div>

            {/* Stats */}
            <AlertStats
                urgent={urgentAlerts.length}
                pending={pendingCount}
                today={todayAlerts.length}
                resolved={resolvedAlerts.length}
            />

            {/* Filters */}
            {showFilters && (
                <AlertFilters
                    activeTypes={filters.types || []}
                    activePriorities={filters.priorities || []}
                    activeStatuses={filters.statuses || []}
                    onTypeChange={filterByType}
                    onPriorityChange={filterByPriority}
                    onStatusChange={filterByStatus}
                    onClear={clearFilters}
                />
            )}

            {/* Error State */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            )}

            {/* Alert List */}
            {!loading && alerts.length === 0 && <AlertsEmptyState />}

            {!loading && alerts.length > 0 && (
                <div className={`${styles["alert-list"]} ${styles["alert-list--grouped"]}`}>
                    {/* Urgent Alerts */}
                    {groupedAlerts.urgent.length > 0 && (
                        <div className={styles["alert-list__group"]}>
                            <div className={styles["alert-list__group-title"]}>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Urgentes ({groupedAlerts.urgent.length})
                            </div>
                            {groupedAlerts.urgent.map(alert => (
                                <AlertItem
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={acknowledgeAlert}
                                    onResolve={resolveAlert}
                                    onDismiss={dismissAlert}
                                    onSnooze={handleSnooze}
                                />
                            ))}
                        </div>
                    )}

                    {/* High Priority */}
                    {groupedAlerts.high.length > 0 && (
                        <div className={styles["alert-list__group"]}>
                            <div className={styles["alert-list__group-title"]}>
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Priorité haute ({groupedAlerts.high.length})
                            </div>
                            {groupedAlerts.high.map(alert => (
                                <AlertItem
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={acknowledgeAlert}
                                    onResolve={resolveAlert}
                                    onDismiss={dismissAlert}
                                    onSnooze={handleSnooze}
                                />
                            ))}
                        </div>
                    )}

                    {/* Medium Priority */}
                    {groupedAlerts.medium.length > 0 && (
                        <div className={styles["alert-list__group"]}>
                            <div className={styles["alert-list__group-title"]}>
                                Priorité moyenne ({groupedAlerts.medium.length})
                            </div>
                            {groupedAlerts.medium.map(alert => (
                                <AlertItem
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={acknowledgeAlert}
                                    onResolve={resolveAlert}
                                    onDismiss={dismissAlert}
                                    onSnooze={handleSnooze}
                                />
                            ))}
                        </div>
                    )}

                    {/* Low Priority */}
                    {groupedAlerts.low.length > 0 && (
                        <div className={styles["alert-list__group"]}>
                            <div className={styles["alert-list__group-title"]}>
                                Priorité basse ({groupedAlerts.low.length})
                            </div>
                            {groupedAlerts.low.map(alert => (
                                <AlertItem
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={acknowledgeAlert}
                                    onResolve={resolveAlert}
                                    onDismiss={dismissAlert}
                                    onSnooze={handleSnooze}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AlertCenter
