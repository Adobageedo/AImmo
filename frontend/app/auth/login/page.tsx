"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthCard, FormField, AuthError } from "@/components/auth"
import { useAuth } from "@/lib/hooks"
import { Loader2, AlertCircle } from "lucide-react"

import { propertyService } from "@/lib/services/property-service"
import { useAuthStore } from "@/lib/store/auth-store"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading, error, clearError } = useAuth()
  
  // Gérer les messages de redirection
  const [sessionMessage, setSessionMessage] = useState("")
  
  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason === 'session_expired') {
      setSessionMessage("Votre session a expiré. Veuillez vous reconnecter.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSessionMessage("") // Effacer le message d'expiration

    const success = await login({ email, password })

    if (success) {
      // Check for onboarding status (empty properties)
      try {
        const { currentOrganizationId } = useAuthStore.getState()
        if (currentOrganizationId) {
          const properties = await propertyService.listProperties(currentOrganizationId)
          if (properties.length === 0) {
            router.push("/onboarding")
            return
          }
        }
      } catch (err) {
        console.error("Failed to check onboarding status", err)
      }

      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous à votre compte AImmo"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthError message={error} />
        
        {sessionMessage && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">{sessionMessage}</p>
          </div>
        )}

        <FormField
          id="email"
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={setEmail}
          required
          disabled={loading}
        />

        <FormField
          id="password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          required
          disabled={loading}
        />

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>

        <div className="text-center text-sm pt-4 border-t border-gray-100">
          <span className="text-gray-500">Pas encore de compte ? </span>
          <Link
            href="/auth/signup"
            className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            S&apos;inscrire
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}
