"use client"

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'

const SESSION_CHECK_INTERVAL = 60 * 1000 // Vérifier toutes les minutes
const WARNING_TIMEOUT = 25 * 60 * 1000 // Avertissement après 25 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000 // Timeout après 30 minutes

export function useSessionTimeout() {
  const router = useRouter()
  const { 
    isAuthenticated, 
    checkSessionTimeout, 
    updateLastActivity,
    logout 
  } = useAuthStore()

  // Fonction pour gérer l'activité utilisateur
  const handleUserActivity = useCallback(() => {
    if (isAuthenticated()) {
      updateLastActivity()
    }
  }, [isAuthenticated, updateLastActivity])

  // Fonction pour vérifier et gérer l'expiration
  const checkAndHandleTimeout = useCallback(() => {
    if (!isAuthenticated()) return

    const isExpired = checkSessionTimeout()
    
    if (isExpired) {
      // Rediriger vers login avec message
      router.push('/auth/login?reason=session_expired')
      return true
    }

    return false
  }, [isAuthenticated, checkSessionTimeout, router])

  // Effet pour écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!isAuthenticated()) return

    // Événements qui indiquent une activité utilisateur
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Ajouter les écouteurs d'événements
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Nettoyer les écouteurs
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [isAuthenticated, handleUserActivity])

  // Effet pour vérifier périodiquement l'expiration
  useEffect(() => {
    if (!isAuthenticated()) return

    // Vérification immédiate au montage
    checkAndHandleTimeout()

    // Configurer la vérification périodique
    const interval = setInterval(checkAndHandleTimeout, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated, checkAndHandleTimeout])

  // Effet pour configurer un avertissement avant expiration
  useEffect(() => {
    if (!isAuthenticated()) return

    const state = useAuthStore.getState()
    if (!state.lastActivity) return

    const timeUntilWarning = WARNING_TIMEOUT - (Date.now() - state.lastActivity)
    
    if (timeUntilWarning <= 0) return

    const warningTimeout = setTimeout(() => {
      // Afficher un avertissement (optionnel)
      const shouldExtend = window.confirm(
        "Votre session va expirer dans 5 minutes. Voulez-vous la prolonger ?"
      )
      
      if (shouldExtend) {
        updateLastActivity()
      } else {
        logout()
        router.push('/auth/login?reason=session_expired')
      }
    }, timeUntilWarning)

    return () => clearTimeout(warningTimeout)
  }, [isAuthenticated, updateLastActivity, logout, router])

  // Mettre à jour l'activité lors du focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated()) {
        checkAndHandleTimeout()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated()) {
        checkAndHandleTimeout()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, checkAndHandleTimeout])

  return {
    checkSessionTimeout: checkAndHandleTimeout,
    updateLastActivity: handleUserActivity
  }
}
