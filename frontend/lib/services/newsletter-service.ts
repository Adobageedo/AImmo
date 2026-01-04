import {
    Newsletter,
    NewsletterFilters,
    NewsletterPreview,
    NewsletterSubscription,
    SubscriptionUpdateRequest,
    SubscriberStats,
} from "@/lib/types/newsletter"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

/**
 * Service for managing newsletters and subscriptions
 */
class NewsletterService {
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
     * List all newsletters with optional filters
     */
    async listNewsletters(filters?: NewsletterFilters): Promise<NewsletterPreview[]> {
        const params = new URLSearchParams()

        if (filters?.categories?.length) {
            filters.categories.forEach(c => params.append("categories", c))
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
        if (filters?.search) {
            params.append("search", filters.search)
        }

        const response = await fetch(`${API_URL}/newsletters?${params.toString()}`, {
            headers: this.getAuthHeader(),
        })

        if (!response.ok) {
            throw new Error("Failed to fetch newsletters")
        }

        return response.json()
    }

    /**
     * Get a newsletter by ID
     */
    async getNewsletter(newsletterId: string): Promise<Newsletter> {
        const response = await fetch(`${API_URL}/newsletters/${newsletterId}`, {
            headers: this.getAuthHeader(),
        })

        if (!response.ok) {
            throw new Error("Failed to fetch newsletter")
        }

        return response.json()
    }

    /**
     * Get the latest newsletter
     */
    async getLatestNewsletter(): Promise<Newsletter | null> {
        const response = await fetch(`${API_URL}/newsletters/latest`, {
            headers: this.getAuthHeader(),
        })

        if (response.status === 404) {
            return null
        }

        if (!response.ok) {
            throw new Error("Failed to fetch latest newsletter")
        }

        return response.json()
    }

    /**
     * Get newsletter history for a user
     */
    async getNewsletterHistory(
        organizationId: string,
        limit: number = 10,
        offset: number = 0
    ): Promise<{ newsletters: NewsletterPreview[]; total: number }> {
        const params = new URLSearchParams({
            organization_id: organizationId,
            limit: limit.toString(),
            offset: offset.toString(),
        })

        const response = await fetch(
            `${API_URL}/newsletters/history?${params.toString()}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch newsletter history")
        }

        return response.json()
    }

    /**
     * Get user subscription
     */
    async getSubscription(organizationId: string): Promise<NewsletterSubscription> {
        const response = await fetch(
            `${API_URL}/newsletters/subscription?organization_id=${organizationId}`,
            {
                headers: this.getAuthHeader(),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch subscription")
        }

        return response.json()
    }

    /**
     * Update subscription (opt-in/opt-out)
     */
    async updateSubscription(
        organizationId: string,
        update: SubscriptionUpdateRequest
    ): Promise<NewsletterSubscription> {
        const response = await fetch(
            `${API_URL}/newsletters/subscription?organization_id=${organizationId}`,
            {
                method: "PUT",
                headers: this.getAuthHeader(),
                body: JSON.stringify(update),
            }
        )

        if (!response.ok) {
            throw new Error("Failed to update subscription")
        }

        return response.json()
    }

    /**
     * Subscribe to newsletter
     */
    async subscribe(organizationId: string): Promise<NewsletterSubscription> {
        return this.updateSubscription(organizationId, { is_subscribed: true })
    }

    /**
     * Unsubscribe from newsletter
     */
    async unsubscribe(
        organizationId: string,
        reason?: string
    ): Promise<NewsletterSubscription> {
        return this.updateSubscription(organizationId, {
            is_subscribed: false,
            unsubscribe_reason: reason,
        })
    }

    /**
     * Get subscriber stats (admin)
     */
    async getSubscriberStats(): Promise<SubscriberStats> {
        const response = await fetch(`${API_URL}/newsletters/stats/subscribers`, {
            headers: this.getAuthHeader(),
        })

        if (!response.ok) {
            throw new Error("Failed to fetch subscriber stats")
        }

        return response.json()
    }

    /**
     * Track newsletter open
     */
    async trackOpen(newsletterId: string, subscriptionId: string): Promise<void> {
        await fetch(`${API_URL}/newsletters/${newsletterId}/track/open`, {
            method: "POST",
            headers: this.getAuthHeader(),
            body: JSON.stringify({ subscription_id: subscriptionId }),
        })
    }

    /**
     * Track newsletter click
     */
    async trackClick(
        newsletterId: string,
        subscriptionId: string,
        linkUrl: string
    ): Promise<void> {
        await fetch(`${API_URL}/newsletters/${newsletterId}/track/click`, {
            method: "POST",
            headers: this.getAuthHeader(),
            body: JSON.stringify({
                subscription_id: subscriptionId,
                link_url: linkUrl,
            }),
        })
    }
}

export const newsletterService = new NewsletterService()
