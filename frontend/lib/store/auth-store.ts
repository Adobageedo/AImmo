import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organization } from '@/lib/types/auth'

interface AuthState {
  user: User | null
  organization: Organization | null
  currentOrganizationId: string | null
  accessToken: string | null

  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void

  // Computed getters
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      currentOrganizationId: null,
      accessToken: null,

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
        accessToken: null
      }),

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
