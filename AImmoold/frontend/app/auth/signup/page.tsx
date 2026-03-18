"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthCard, FormField, AuthError } from "@/components/auth"
import { useAuth } from "@/lib/hooks"
import { Loader2, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [success, setSuccess] = useState(false)
  const { signup, loading, error, clearError } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const result = await signup({
      email,
      password,
      organizationName: organizationName || undefined,
    })

    if (result) {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Vérifiez votre email"
        description={`Un email de confirmation a été envoyé à ${email}`}
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
          </p>

          <Link href="/auth/login">
            <Button className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Créer un compte"
      description="Créez votre compte AImmo gratuitement"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <AuthError message={error} />

        <FormField
          id="organizationName"
          label="Nom de votre organisation"
          type="text"
          placeholder="Mon Agence Immobilière"
          value={organizationName}
          onChange={setOrganizationName}
          disabled={loading}
          hint="Optionnel - vous pourrez le modifier plus tard"
        />

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
          minLength={6}
          disabled={loading}
          hint="Minimum 6 caractères"
        />

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer un compte"
          )}
        </Button>

        <div className="text-center text-sm pt-4 border-t border-gray-100">
          <span className="text-gray-500">Déjà un compte ? </span>
          <Link
            href="/auth/login"
            className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}
