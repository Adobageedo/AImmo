"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { DEBOUNCE } from "@/lib/constants/app"

interface UseSearchOptions {
    debounceMs?: number
    minLength?: number
    onSearch?: (query: string) => void
}

/**
 * Custom hook for search functionality with debouncing
 */
export function useSearch<T>(
    searchFn: (query: string) => Promise<T[]> | T[],
    options: UseSearchOptions = {}
) {
    const {
        debounceMs = DEBOUNCE.search,
        minLength = 0,
        onSearch
    } = options

    const [query, setQuery] = useState("")
    const [results, setResults] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    const search = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < minLength) {
            setResults([])
            return
        }

        setLoading(true)
        setError(null)

        try {
            const data = await searchFn(searchQuery)
            setResults(data)
            onSearch?.(searchQuery)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed")
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [searchFn, minLength, onSearch])

    const handleQueryChange = useCallback((newQuery: string) => {
        setQuery(newQuery)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            search(newQuery)
        }, debounceMs)
    }, [debounceMs, search])

    const clear = useCallback(() => {
        setQuery("")
        setResults([])
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return {
        query,
        results,
        loading,
        error,
        setQuery: handleQueryChange,
        clear,
        search,
    }
}
