"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthCard, FormField, AuthError } from "@/components/auth"
import { useAuth } from "@/lib/hooks"
import { Loader2 } from "lucide-react"

import { propertyService } from "@/lib/services/property-service"
import { useAuthStore } from "@/lib/store/auth-store"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { login, loading, error, clearError } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

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
