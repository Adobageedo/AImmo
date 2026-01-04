import {
    Alert,
    AlertCreateRequest,
    AlertUpdateRequest,
    AlertFilters,
    AlertStats,
    AlertStatus,
    AlertPreferences,
} from "@/lib/types/alerts"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

/**
 * Service for managing alerts
 */
class AlertsService {
    private getAuthHeader(): HeadersInit {
        const token = useAuthStore.getState().accessToken
        if (!token) {
            throw new Error("Not authenticated")
        }
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    }

    /**
     * List alerts with optional filters
     */
    async listAlerts(
        organizationId: string,
        filters?: AlertFilters
    ): Promise<Alert[]> {
        const params = new URLSearchParams({
            organization_id: organizationId,
        })

        if (filters?.types?.length) {
            filters.types.forEach(t => params.append("types", t))
        }
        if (filters?.priorities?.length) {
            filters.priorities.forEach(p => params.append("priorities", p))
        }
        if (filters?.statuses?.length) {
            filters.statuses.forEach(s => params.append("statuses", s))
        }
        if (filters?.from_date) {
            params.append("from_date", filters.from_date)
        }
        if (filters?.to_date) {
            params.append("to_date", filters.to_date)
        }
        if (filters?.property_id) {
            params.append("property_id", filters.property_id)
        }
        if (filters?.lease_id) {
            params.append("lease_id", filters.lease_id)
        }
        if (filters?.tenant_id) {
            params.append("tenant_id", filters.tenant_id)
        }

        const response = await fetch(`${API_URL}/alerts?${params.toString()}`, {
            headers: this.getAuthHeader(),
        })

        if (!response.ok) {
            throw new Error("Failed to fetch alerts")
        }

        return response.json()
    }

    /**
     * Get a single alert by ID
     */
    async getAlert(alertId: string, organizationId: string): Promise<Alert> {
        const response = await fetch(
            `${API_URL}/alerts/${alertId}?organization_id=${organizationId}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch alert")
        }

        return response.json()
    }

    /**
     * Create a new alert
     */
    async createAlert(
        organizationId: string,
        request: AlertCreateRequest
    ): Promise<Alert> {
        const response = await fetch(`${API_URL}/alerts`, {
            method: "POST",
            headers: this.getAuthHeader(),
            body: JSON.stringify({
                organization_id: organizationId,
                ...request,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || "Failed to create alert")
        }

        return response.json()
    }

    /**
     * Update an alert (status, priority, snooze)
     */
    async updateAlert(
        alertId: string,
        organizationId: string,
        update: AlertUpdateRequest
    ): Promise<Alert> {
        const response = await fetch(
            `${API_URL}/alerts/${alertId}?organization_id=${organizationId}`,
            {
                method: "PATCH",
                headers: this.getAuthHeader(),
                body: JSON.stringify(update),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to update alert")
        }

        return response.json()
    }

    /**
     * Mark alert as acknowledged
     */
    async acknowledgeAlert(alertId: string, organizationId: string): Promise<Alert> {
        return this.updateAlert(alertId, organizationId, {
            status: AlertStatus.ACKNOWLEDGED,
        })
    }

    /**
     * Mark alert as resolved
     */
    async resolveAlert(alertId: string, organizationId: string): Promise<Alert> {
        return this.updateAlert(alertId, organizationId, {
            status: AlertStatus.RESOLVED,
        })
    }

    /**
     * Dismiss an alert
     */
    async dismissAlert(alertId: string, organizationId: string): Promise<Alert> {
        return this.updateAlert(alertId, organizationId, {
            status: AlertStatus.DISMISSED,
        })
    }

    /**
     * Snooze alert until a specific date
     */
    async snoozeAlert(
        alertId: string,
        organizationId: string,
        snoozeUntil: string
    ): Promise<Alert> {
        return this.updateAlert(alertId, organizationId, {
            status: AlertStatus.SNOOZED,
            snooze_until: snoozeUntil,
        })
    }

    /**
     * Bulk update alerts (mark multiple as resolved/dismissed)
     */
    async bulkUpdateAlerts(
        organizationId: string,
        alertIds: string[],
        update: AlertUpdateRequest
    ): Promise<{ updated: number; failed: number }> {
        const response = await fetch(`${API_URL}/alerts/bulk`, {
            method: "PATCH",
            headers: this.getAuthHeader(),
            body: JSON.stringify({
                organization_id: organizationId,
                alert_ids: alertIds,
                ...update,
            }),
        })

        if (!response.ok) {
            throw new Error("Failed to bulk update alerts")
        }

        return response.json()
    }

    /**
     * Delete an alert
     */
    async deleteAlert(alertId: string, organizationId: string): Promise<void> {
        const response = await fetch(
            `${API_URL}/alerts/${alertId}?organization_id=${organizationId}`,
            {
                method: "DELETE",
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to delete alert")
        }
    }

    /**
     * Get alert statistics
     */
    async getAlertStats(organizationId: string): Promise<AlertStats> {
        const response = await fetch(
            `${API_URL}/alerts/stats?organization_id=${organizationId}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch alert stats")
        }

        return response.json()
    }

    /**
     * Get pending alerts count (for badge)
     */
    async getPendingCount(organizationId: string): Promise<number> {
        const response = await fetch(
            `${API_URL}/alerts/pending-count?organization_id=${organizationId}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch pending count")
        }

        const data = await response.json()
        return data.count
    }

    /**
     * Get user alert preferences
     */
    async getPreferences(organizationId: string): Promise<AlertPreferences> {
        const response = await fetch(
            `${API_URL}/alerts/preferences?organization_id=${organizationId}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch alert preferences")
        }

        return response.json()
    }

    /**
     * Update user alert preferences
     */
    async updatePreferences(
        organizationId: string,
        preferences: Partial<AlertPreferences>
    ): Promise<AlertPreferences> {
        const response = await fetch(
            `${API_URL}/alerts/preferences?organization_id=${organizationId}`,
            {
                method: "PUT",
                headers: this.getAuthHeader(),
                body: JSON.stringify(preferences),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to update alert preferences")
        }

        return response.json()
    }
}

export const alertsService = new AlertsService()
