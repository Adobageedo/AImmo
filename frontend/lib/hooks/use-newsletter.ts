"use client"

import { useState, useCallback, useEffect } from "react"
import { newsletterService } from "@/lib/services/newsletter-service"
import { useAuthStore } from "@/lib/store/auth-store"
import type {
    Newsletter,
    NewsletterPreview,
    NewsletterFilters,
    NewsletterSubscription,
    NewsletterCategory,
    NewsletterFrequency,
    SubscriptionUpdateRequest,
} from "@/lib/types/newsletter"

interface UseNewsletterOptions {
    autoLoad?: boolean
    loadLatest?: boolean
}

/**
 * Custom hook for newsletter operations
 * Provides newsletter listing, subscription management, and history
 */
export function useNewsletter(options: UseNewsletterOptions = {}) {
    const { autoLoad = false, loadLatest = false } = options
    const { currentOrganizationId } = useAuthStore()

    const [newsletters, setNewsletters] = useState<NewsletterPreview[]>([])
    const [latestNewsletter, setLatestNewsletter] = useState<Newsletter | null>(null)
    const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<NewsletterFilters>({})

    /**
     * Load newsletter list
     */
    const loadNewsletters = useCallback(async (newFilters?: NewsletterFilters) => {
        setLoading(true)
        setError(null)

        try {
            const filtersToUse = newFilters || filters
            const list = await newsletterService.listNewsletters(filtersToUse)
            setNewsletters(list)
            if (newFilters) {
                setFilters(newFilters)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load newsletters")
        } finally {
            setLoading(false)
        }
    }, [filters])

    /**
     * Load the latest newsletter
     */
    const loadLatestNewsletter = useCallback(async () => {
        try {
            const latest = await newsletterService.getLatestNewsletter()
            setLatestNewsletter(latest)
            return latest
        } catch (err) {
            console.error("Failed to load latest newsletter:", err)
            return null
        }
    }, [])

    /**
     * Load a specific newsletter by ID
     */
    const loadNewsletter = useCallback(async (newsletterId: string) => {
        setLoading(true)
        setError(null)

        try {
            const newsletter = await newsletterService.getNewsletter(newsletterId)
            setCurrentNewsletter(newsletter)
            return newsletter
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load newsletter")
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Load newsletter history
     */
    const loadHistory = useCallback(async (limit: number = 10, offset: number = 0) => {
        if (!currentOrganizationId) return { newsletters: [], total: 0 }

        try {
            return await newsletterService.getNewsletterHistory(currentOrganizationId, limit, offset)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load history")
            return { newsletters: [], total: 0 }
        }
    }, [currentOrganizationId])

    /**
     * Filter by category
     */
    const filterByCategory = useCallback((categories: NewsletterCategory[]) => {
        loadNewsletters({ ...filters, categories })
    }, [filters, loadNewsletters])

    /**
     * Search newsletters
     */
    const searchNewsletters = useCallback((search: string) => {
        loadNewsletters({ ...filters, search })
    }, [filters, loadNewsletters])

    /**
     * Clear filters
     */
    const clearFilters = useCallback(() => {
        loadNewsletters({})
    }, [loadNewsletters])

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad) {
            loadNewsletters()
        }
        if (loadLatest) {
            loadLatestNewsletter()
        }
    }, [autoLoad, loadLatest, loadNewsletters, loadLatestNewsletter])

    return {
        // State
        newsletters,
        latestNewsletter,
        currentNewsletter,
        loading,
        error,
        filters,

        // Actions
        loadNewsletters,
        loadLatestNewsletter,
        loadNewsletter,
        loadHistory,
        filterByCategory,
        searchNewsletters,
        clearFilters,
        clearError,
        setFilters,
    }
}

/**
 * Hook for managing newsletter subscription
 */
export function useNewsletterSubscription() {
    const { currentOrganizationId } = useAuthStore()
    const [subscription, setSubscription] = useState<NewsletterSubscription | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Load subscription status
     */
    const loadSubscription = useCallback(async () => {
        if (!currentOrganizationId) return

        setLoading(true)
        setError(null)

        try {
            const sub = await newsletterService.getSubscription(currentOrganizationId)
            setSubscription(sub)
        } catch (err) {
            // If no subscription exists, that's okay
            if (err instanceof Error && err.message.includes("404")) {
                setSubscription(null)
            } else {
                setError(err instanceof Error ? err.message : "Failed to load subscription")
            }
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId])

    /**
     * Update subscription
     */
    const updateSubscription = useCallback(async (
        update: SubscriptionUpdateRequest
    ): Promise<boolean> => {
        if (!currentOrganizationId) return false

        setLoading(true)
        try {
            const updated = await newsletterService.updateSubscription(currentOrganizationId, update)
            setSubscription(updated)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update subscription")
            return false
        } finally {
            setLoading(false)
        }
    }, [currentOrganizationId])

    /**
     * Subscribe to newsletter
     */
    const subscribe = useCallback(async (): Promise<boolean> => {
        return updateSubscription({ is_subscribed: true })
    }, [updateSubscription])

    /**
     * Unsubscribe from newsletter
     */
    const unsubscribe = useCallback(async (reason?: string): Promise<boolean> => {
        return updateSubscription({
            is_subscribed: false,
            unsubscribe_reason: reason,
        })
    }, [updateSubscription])

    /**
     * Update category preferences
     */
    const updateCategories = useCallback(async (
        categories: NewsletterCategory[]
    ): Promise<boolean> => {
        return updateSubscription({ categories })
    }, [updateSubscription])

    /**
     * Update frequency preference
     */
    const updateFrequency = useCallback(async (
        frequency: NewsletterFrequency
    ): Promise<boolean> => {
        return updateSubscription({ frequency })
    }, [updateSubscription])

    /**
     * Toggle a specific category
     */
    const toggleCategory = useCallback(async (category: NewsletterCategory): Promise<boolean> => {
        if (!subscription) return false

        const currentCategories = subscription.categories || []
        const hasCategory = currentCategories.includes(category)
        const newCategories = hasCategory
            ? currentCategories.filter(c => c !== category)
            : [...currentCategories, category]

        return updateCategories(newCategories)
    }, [subscription, updateCategories])

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Auto-load on mount
    useEffect(() => {
        loadSubscription()
    }, [loadSubscription])

    // Computed
    const isSubscribed = subscription?.is_subscribed ?? false

    return {
        // State
        subscription,
        loading,
        error,
        isSubscribed,

        // Actions
        loadSubscription,
        updateSubscription,
        subscribe,
        unsubscribe,
        updateCategories,
        updateFrequency,
        toggleCategory,
        clearError,
    }
}
