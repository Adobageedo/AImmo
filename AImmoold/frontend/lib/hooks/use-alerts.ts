"use client"

import { useState, useCallback, useEffect } from "react"
import { alertsService } from "@/lib/services/alerts-service"
import { useAuthStore } from "@/lib/store/auth-store"
import {
    AlertStatus,
    AlertType,
    AlertPriority,
} from "@/lib/types/alerts"
import type {
    Alert,
    AlertCreateRequest,
    AlertUpdateRequest,
    AlertFilters,
    AlertStats,
    AlertPreferences,
} from "@/lib/types/alerts"

interface UseAlertsOptions {
    autoLoad?: boolean
    filters?: AlertFilters
    pollInterval?: number // in milliseconds
}

/**
 * Custom hook for alert operations
 * Provides CRUD operations, statistics, and real-time polling
 */
export function useAlerts(options: UseAlertsOptions = {}) {
    const { autoLoad = false, filters: initialFilters, pollInterval } = options
    const { currentOrganizationId } = useAuthStore()

    const [alerts, setAlerts] = useState<Alert[]>([])
    const [stats, setStats] = useState<AlertStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pendingCount, setPendingCount] = useState(0)
    const [filters, setFilters] = useState<AlertFilters>(initialFilters || {})

    /**
     * Load alerts with current filters
     */
    const loadAlerts = useCallback(async (newFilters?: AlertFilters) => {
        if (!currentOrganizationId) {
            setError("No organization selected")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const filtersToUse = newFilters || filters
            const alertList = await alertsService.listAlerts(currentOrganizationId, filtersToUse)
            setAlerts(alertList)
            if (newFilters) {
                setFilters(newFilters)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load alerts")
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId, filters])

    /**
     * Load alert statistics
     */
    const loadStats = useCallback(async () => {
        if (!currentOrganizationId) return

        try {
            const alertStats = await alertsService.getAlertStats(currentOrganizationId)
            setStats(alertStats)
        } catch (err) {
            console.error("Failed to load alert stats:", err)
        }
    }, [currentOrganizationId])

    /**
     * Load pending alerts count
     */
    const loadPendingCount = useCallback(async () => {
        if (!currentOrganizationId) return

        try {
            const count = await alertsService.getPendingCount(currentOrganizationId)
            setPendingCount(count)
        } catch (err) {
            console.error("Failed to load pending count:", err)
        }
    }, [currentOrganizationId])

    /**
     * Create a new alert
     */
    const createAlert = useCallback(async (request: AlertCreateRequest): Promise<Alert | null> => {
        if (!currentOrganizationId) return null

        try {
            const newAlert = await alertsService.createAlert(currentOrganizationId, request)
            setAlerts(prev => [newAlert, ...prev])
            setPendingCount(prev => prev + 1)
            return newAlert
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create alert")
            return null
        }
    }, [currentOrganizationId])

    /**
     * Update an alert
     */
    const updateAlert = useCallback(async (
        alertId: string,
        update: AlertUpdateRequest
    ): Promise<Alert | null> => {
        if (!currentOrganizationId) return null

        try {
            const updated = await alertsService.updateAlert(alertId, currentOrganizationId, update)
            setAlerts(prev => prev.map(a => a.id === alertId ? updated : a))

            // Update pending count if status changed
            if (update.status === AlertStatus.RESOLVED || update.status === AlertStatus.DISMISSED) {
                setPendingCount(prev => Math.max(0, prev - 1))
            }

            return updated
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update alert")
            return null
        }
    }, [currentOrganizationId])

    /**
     * Acknowledge an alert
     */
    const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
        const result = await updateAlert(alertId, { status: AlertStatus.ACKNOWLEDGED })
        return result !== null
    }, [updateAlert])

    /**
     * Resolve an alert
     */
    const resolveAlert = useCallback(async (alertId: string): Promise<boolean> => {
        const result = await updateAlert(alertId, { status: AlertStatus.RESOLVED })
        return result !== null
    }, [updateAlert])

    /**
     * Dismiss an alert
     */
    const dismissAlert = useCallback(async (alertId: string): Promise<boolean> => {
        const result = await updateAlert(alertId, { status: AlertStatus.DISMISSED })
        return result !== null
    }, [updateAlert])

    /**
     * Snooze an alert
     */
    const snoozeAlert = useCallback(async (alertId: string, until: Date): Promise<boolean> => {
        const result = await updateAlert(alertId, {
            status: AlertStatus.SNOOZED,
            snooze_until: until.toISOString(),
        })
        return result !== null
    }, [updateAlert])

    /**
     * Delete an alert
     */
    const deleteAlert = useCallback(async (alertId: string): Promise<boolean> => {
        if (!currentOrganizationId) return false

        try {
            await alertsService.deleteAlert(alertId, currentOrganizationId)
            setAlerts(prev => prev.filter(a => a.id !== alertId))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete alert")
            return false
        }
    }, [currentOrganizationId])

    /**
     * Bulk update alerts
     */
    const bulkUpdate = useCallback(async (
        alertIds: string[],
        update: AlertUpdateRequest
    ): Promise<{ updated: number; failed: number }> => {
        if (!currentOrganizationId) return { updated: 0, failed: alertIds.length }

        try {
            const result = await alertsService.bulkUpdateAlerts(currentOrganizationId, alertIds, update)
            await loadAlerts() // Reload to get updated state
            return result
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to bulk update alerts")
            return { updated: 0, failed: alertIds.length }
        }
    }, [currentOrganizationId, loadAlerts])

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    /**
     * Filter helpers
     */
    const filterByType = useCallback((types: AlertType[]) => {
        loadAlerts({ ...filters, types })
    }, [filters, loadAlerts])

    const filterByPriority = useCallback((priorities: AlertPriority[]) => {
        loadAlerts({ ...filters, priorities })
    }, [filters, loadAlerts])

    const filterByStatus = useCallback((statuses: AlertStatus[]) => {
        loadAlerts({ ...filters, statuses })
    }, [filters, loadAlerts])

    const clearFilters = useCallback(() => {
        loadAlerts({})
    }, [loadAlerts])

    // Auto-load on mount if enabled
    useEffect(() => {
        if (autoLoad && currentOrganizationId) {
            loadAlerts()
            loadStats()
            loadPendingCount()
        }
    }, [autoLoad, currentOrganizationId, loadAlerts, loadStats, loadPendingCount])

    // Polling for real-time updates
    useEffect(() => {
        if (!pollInterval || !currentOrganizationId) return

        const interval = setInterval(() => {
            loadPendingCount()
        }, pollInterval)

        return () => clearInterval(interval)
    }, [pollInterval, currentOrganizationId, loadPendingCount])

    // Computed values
    const urgentAlerts = alerts.filter(a => a.priority === "urgent" && a.status === "pending")
    const unresolvedAlerts = alerts.filter(a =>
        a.status !== "resolved" && a.status !== "dismissed"
    )

    return {
        // State
        alerts,
        stats,
        loading,
        error,
        pendingCount,
        filters,

        // Computed
        urgentAlerts,
        unresolvedAlerts,

        // Actions
        loadAlerts,
        loadStats,
        loadPendingCount,
        createAlert,
        updateAlert,
        acknowledgeAlert,
        resolveAlert,
        dismissAlert,
        snoozeAlert,
        deleteAlert,
        bulkUpdate,
        clearError,

        // Filters
        filterByType,
        filterByPriority,
        filterByStatus,
        clearFilters,
        setFilters,
    }
}

/**
 * Hook for managing alert preferences
 */
export function useAlertPreferences() {
    const { currentOrganizationId } = useAuthStore()
    const [preferences, setPreferences] = useState<AlertPreferences | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadPreferences = useCallback(async () => {
        if (!currentOrganizationId) return

        setLoading(true)
        try {
            const prefs = await alertsService.getPreferences(currentOrganizationId)
            setPreferences(prefs)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load preferences")
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId])

    const updatePreferences = useCallback(async (
        updates: Partial<AlertPreferences>
    ): Promise<boolean> => {
        if (!currentOrganizationId) return false

        try {
            const updated = await alertsService.updatePreferences(currentOrganizationId, updates)
            setPreferences(updated)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update preferences")
            return false
        }
    }, [currentOrganizationId])

    useEffect(() => {
        loadPreferences()
    }, [loadPreferences])

    return {
        preferences,
        loading,
        error,
        loadPreferences,
        updatePreferences,
    }
}
