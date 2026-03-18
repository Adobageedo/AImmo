"use client"

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { Clock, AlertTriangle } from 'lucide-react'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000 // 5 minutes avant expiration

export function SessionIndicator() {
  const { isAuthenticated, lastActivity } = useAuthStore()
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (!isAuthenticated() || !lastActivity) return

    const updateTimer = () => {
      const now = Date.now()
      const elapsed = now - lastActivity
      const remaining = Math.max(0, SESSION_TIMEOUT - elapsed)
      
      setTimeRemaining(remaining)
      setIsWarning(remaining <= WARNING_THRESHOLD && remaining > 0)
    }

    // Mettre à jour immédiatement
    updateTimer()

    // Mettre à jour chaque seconde
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity])

  if (!isAuthenticated() || timeRemaining === null || timeRemaining === 0) {
    return null
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isWarning 
        ? 'bg-red-100 text-red-800 border border-red-200' 
        : 'bg-gray-100 text-gray-700 border border-gray-200'
    }`}>
      {isWarning ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>
        Session: {formatTime(timeRemaining)}
      </span>
    </div>
  )
}
