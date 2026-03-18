"use client"

import { ReactNode } from 'react'
import { useSessionTimeout } from '@/lib/hooks/use-session-timeout'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Activer la gestion du timeout de session
  useSessionTimeout()

  return <>{children}</>
}
