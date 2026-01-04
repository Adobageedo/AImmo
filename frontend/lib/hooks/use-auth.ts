"use client"

import { useAuthStore } from "@/lib/store/auth-store"
import { authService } from "@/lib/services/auth-service"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { LoginCredentials, SignupCredentials } from "@/lib/types/auth"

/**
 * Custom hook for authentication operations
 * Provides login, signup, logout, and session management
 */
export function useAuth() {
    const router = useRouter()
    const {
        user,
        organization,
        currentOrganizationId,
        accessToken,
        setUser,
        setOrganization,
        setAccessToken,
        logout: clearAuth,
        isAuthenticated,
    } = useAuthStore()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Login with email and password
     */
    const login = useCallback(async (credentials: LoginCredentials) => {
        setLoading(true)
        setError(null)

        try {
            const result = await authService.login(credentials)

            if (!result.success) {
                setError(result.error || "Une erreur est survenue")
                return false
            }

            // Get session for access token
            const { data: sessionData } = await authService.getSession()

            if (!sessionData.session) {
                setError("Session non créée")
                return false
            }

            // Update auth store
            if (result.user) {
                setUser({
                    id: result.user.id,
                    email: result.user.email,
                })
            }

            setAccessToken(sessionData.session.access_token)

            if (result.organization) {
                setOrganization(result.organization)
            }

            return true
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue")
            return false
        } finally {
            setLoading(false)
        }
    }, [setUser, setAccessToken, setOrganization])

    /**
     * Sign up with email and password
     */
    const signup = useCallback(async (credentials: SignupCredentials) => {
        setLoading(true)
        setError(null)

        const result = await authService.signup(credentials)

        setLoading(false)

        if (!result.success) {
            setError(result.error || "Une erreur est survenue")
            return false
        }

        return true
    }, [])

    /**
     * Logout the current user
     */
    const logout = useCallback(async () => {
        setLoading(true)
        await authService.logout()
        clearAuth()
        router.push("/auth/login")
        setLoading(false)
    }, [clearAuth, router])

    /**
     * Request password reset email
     */
    const resetPassword = useCallback(async (email: string) => {
        setLoading(true)
        setError(null)

        const result = await authService.resetPassword(email)

        setLoading(false)

        if (!result.success) {
            setError(result.error || "Une erreur est survenue")
            return false
        }

        return true
    }, [])

    /**
     * Clear any authentication errors
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        // State
        user,
        organization,
        currentOrganizationId,
        accessToken,
        isAuthenticated: isAuthenticated(),
        loading,
        error,

        // Actions
        login,
        signup,
        logout,
        resetPassword,
        clearError,
    }
}
