"use client"

import { useState, useCallback, useEffect } from "react"
import { newsletterService } from "@/lib/services/newsletterService"
import type {
    Newsletter,
    NewsletterEdition,
    NewsletterSubscription,
} from "@/lib/types/newsletter"

interface UseNewsletterOptions {
    autoLoad?: boolean
    newsletterId?: string
}

export function useNewsletter(options: UseNewsletterOptions = {}) {
    const { autoLoad = false, newsletterId } = options

    const [newsletters, setNewsletters] = useState<Newsletter[]>([])
    const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null)
    const [lastEdition, setLastEdition] = useState<NewsletterEdition | null>(null)
    const [editions, setEditions] = useState<NewsletterEdition[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [subscribing, setSubscribing] = useState(false)

    const loadNewsletters = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const list = await newsletterService.getNewsletters()
            setNewsletters(list)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load newsletters")
        } finally {
            setLoading(false)
        }
    }, [])

    const loadNewsletter = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const newsletter = await newsletterService.getNewsletterById(id)
            setCurrentNewsletter(newsletter)
            return newsletter
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load newsletter")
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const loadLastEdition = useCallback(async (id: string) => {
        try {
            const edition = await newsletterService.getLastEdition(id)
            setLastEdition(edition)
            return edition
        } catch (err) {
            console.error("No last edition found:", err)
            return null
        }
    }, [])

    const loadEditions = useCallback(async (id: string, limit: number = 10) => {
        try {
            const editionsList = await newsletterService.getEditions(id, limit)
            setEditions(editionsList)
            return editionsList
        } catch (err) {
            console.error("Failed to load editions:", err)
            return []
        }
    }, [])

    const subscribe = useCallback(async (id: string) => {
        setSubscribing(true)
        setError(null)

        try {
            await newsletterService.subscribe(id)
            await loadNewsletters()
            if (currentNewsletter?.id === id) {
                await loadNewsletter(id)
            }
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to subscribe")
            return false
        } finally {
            setSubscribing(false)
        }
    }, [currentNewsletter, loadNewsletters, loadNewsletter])

    const unsubscribe = useCallback(async (id: string) => {
        setSubscribing(true)
        setError(null)

        try {
            await newsletterService.unsubscribe(id)
            await loadNewsletters()
            if (currentNewsletter?.id === id) {
                await loadNewsletter(id)
            }
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unsubscribe")
            return false
        } finally {
            setSubscribing(false)
        }
    }, [currentNewsletter, loadNewsletters, loadNewsletter])

    useEffect(() => {
        if (autoLoad) {
            loadNewsletters()
        }
        if (newsletterId) {
            loadNewsletter(newsletterId)
            loadLastEdition(newsletterId)
            loadEditions(newsletterId)
        }
    }, [autoLoad, newsletterId, loadNewsletters, loadNewsletter, loadLastEdition, loadEditions])

    return {
        newsletters,
        currentNewsletter,
        lastEdition,
        editions,
        loading,
        error,
        subscribing,
        loadNewsletters,
        loadNewsletter,
        loadLastEdition,
        loadEditions,
        subscribe,
        unsubscribe,
    }
}

