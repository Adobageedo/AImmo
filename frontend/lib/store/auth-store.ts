import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organization } from '@/lib/types/auth'

interface AuthState {
  user: User | null
  organizations: Organization[]
  currentOrganizationId: string | null
  accessToken: string | null

  // Actions
  setUser: (user: User | null) => void
  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrganization: (orgId: string) => void
  setAccessToken: (token: string | null) => void
  logout: () => void

  // Computed getters
  getCurrentOrganization: () => Organization | undefined
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organizations: [],
      currentOrganizationId: null,
      accessToken: null,

      setUser: (user) => set({ user }),

      setOrganizations: (organizations) => set({ organizations }),

      setCurrentOrganization: (currentOrganizationId) => set({ currentOrganizationId }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => set({
        user: null,
        organizations: [],
        currentOrganizationId: null,
        accessToken: null
      }),

      getCurrentOrganization: () => {
        const state = get()
        return state.organizations.find(org => org.id === state.currentOrganizationId)
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
