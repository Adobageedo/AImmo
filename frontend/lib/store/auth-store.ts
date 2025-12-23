import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Organization {
  id: string
  name: string
  description?: string
  role?: string
}

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  organizations: Organization[]
  currentOrganizationId: string | null
  accessToken: string | null
  setUser: (user: User | null) => void
  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrganization: (orgId: string) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'auth-storage',
    }
  )
)
