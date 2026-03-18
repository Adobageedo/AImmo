import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organization } from '@/lib/types/auth'

interface AuthState {
  user: User | null
  organization: Organization | null
  currentOrganizationId: string | null
  accessToken: string | null
  lastActivity: number | null  // Timestamp de la dernière activité

  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
  updateLastActivity: () => void
  checkSessionTimeout: () => boolean

  // Computed getters
  isAuthenticated: () => boolean
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes en millisecondes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      currentOrganizationId: null,
      accessToken: null,
      lastActivity: null,

      setUser: (user) => set({ user }),

      setOrganization: (organization) => set({
        organization,
        currentOrganizationId: organization?.id || null
      }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => set({
        user: null,
        organization: null,
        currentOrganizationId: null,
        accessToken: null,
        lastActivity: null
      }),

      updateLastActivity: () => set({ lastActivity: Date.now() }),

      checkSessionTimeout: () => {
        const state = get()
        const now = Date.now()
        
        if (!state.lastActivity) {
          // Si pas de dernière activité, initialiser
          set({ lastActivity: now })
          return false
        }

        const timeSinceLastActivity = now - state.lastActivity
        
        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          // Session expirée, déconnecter
          state.logout()
          return true
        }
        
        // Mettre à jour la dernière activité
        set({ lastActivity: now })
        return false
      },

      isAuthenticated: () => {
        const state = get()
        return !!state.user && !!state.accessToken
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
