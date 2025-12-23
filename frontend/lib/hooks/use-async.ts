"use client"

import { useState, useCallback } from "react"

type AsyncFunction<T, Args extends any[]> = (...args: Args) => Promise<T>

interface UseAsyncState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

/**
 * Custom hook for handling async operations with loading/error states
 */
export function useAsync<T, Args extends any[] = []>(
    asyncFunction: AsyncFunction<T, Args>
) {
    const [state, setState] = useState<UseAsyncState<T>>({
        data: null,
        loading: false,
        error: null,
    })

    const execute = useCallback(async (...args: Args): Promise<T | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const result = await asyncFunction(...args)
            setState({ data: result, loading: false, error: null })
            return result
        } catch (err) {
            const error = err instanceof Error ? err.message : "An error occurred"
            setState(prev => ({ ...prev, loading: false, error }))
            return null
        }
    }, [asyncFunction])

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null })
    }, [])

    return {
        ...state,
        execute,
        reset,
        isLoading: state.loading,
        isError: !!state.error,
        isSuccess: !!state.data && !state.error,
    }
}
