import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth-store"
import type {
    User,
    Organization,
    LoginCredentials,
    SignupCredentials,
    AuthResponse
} from "@/lib/types/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class AuthService {
    private supabase = createClient()

    /**
     * Sign in with email and password using Supabase directly
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            })

            if (authError) {
                return {
                    success: false,
                    error: this.translateError(authError.message)
                }
            }

            if (!authData.session) {
                return {
                    success: false,
                    error: "Session non créée"
                }
            }

            const user: User = {
                id: authData.user.id,
                email: authData.user.email || credentials.email,
                fullName: authData.user.user_metadata?.full_name,
                avatarUrl: authData.user.user_metadata?.avatar_url,
            }

            // Fetch organization from backend (Asset Manager 1:1)
            const organization = await this.fetchUserOrganization(authData.session.access_token)

            // Set auth store state
            const store = useAuthStore.getState()
            store.setUser(user)
            store.setOrganization(organization)
            store.setAccessToken(authData.session.access_token)

            return {
                success: true,
                user,
                organization, // Return single org in response
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Une erreur est survenue",
            }
        }
    }

    /**
     * Sign up with email and password
     * Note: Signup requires backend for organization creation
     */
    async signup(credentials: SignupCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    organization_name: credentials.organizationName || "Mon Organisation",
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                return {
                    success: false,
                    error: data.detail || "Erreur lors de l'inscription",
                }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Une erreur est survenue",
            }
        }
    }

    /**
     * Sign out the current user
     */
    async logout(): Promise<void> {
        await this.supabase.auth.signOut()
        useAuthStore.getState().logout()
    }

    /**
     * Request password reset email
     */
    async resetPassword(email: string): Promise<AuthResponse> {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
                return { success: false, error: this.translateError(error.message) }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Une erreur est survenue",
            }
        }
    }

    /**
     * Update user password
     */
    async updatePassword(password: string): Promise<AuthResponse> {
        try {
            const { error } = await this.supabase.auth.updateUser({ password })

            if (error) {
                return { success: false, error: this.translateError(error.message) }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Une erreur est survenue",
            }
        }
    }

    /**
     * Get current session
     */
    async getSession() {
        return this.supabase.auth.getSession()
    }

    /**
     * Fetch user organization from backend (Singular 1:1)
     */
    private async fetchUserOrganization(accessToken: string): Promise<Organization | null> {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) {
                console.warn("Failed to fetch organizations")
                return null
            }

            const data = await response.json()
            const orgs = data.organizations || []

            if (orgs.length > 0) {
                const org = orgs[0] // Take the first one (1:1 enforcement)
                return {
                    id: org.organizations?.id || org.organization_id,
                    name: org.organizations?.name || "Organisation",
                    role: org.roles?.name || "user",
                }
            }

            return null
        } catch (error) {
            console.error("Error fetching organization:", error)
            return null
        }
    }

    /**
     * Translate Supabase error messages to French
     */
    private translateError(message: string): string {
        const translations: Record<string, string> = {
            "Invalid login credentials": "Email ou mot de passe incorrect",
            "Email not confirmed": "Veuillez confirmer votre email",
            "User already registered": "Un compte existe déjà avec cet email",
            "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
            "Email rate limit exceeded": "Trop de tentatives, veuillez réessayer plus tard",
        }
        return translations[message] || message
    }
}

export const authService = new AuthService()
