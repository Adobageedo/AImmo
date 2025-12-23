"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthCard, FormField, AuthError } from "@/components/auth"
import { useAuth } from "@/lib/hooks"
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [success, setSuccess] = useState(false)
    const { resetPassword, loading, error, clearError } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        const result = await resetPassword(email)

        if (result) {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <AuthCard
                title="Email envoyé"
                description="Vérifiez votre boîte de réception"
            >
                <div className="space-y-6 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">
                        Si un compte existe avec l&apos;email <strong>{email}</strong>,
                        vous recevrez un lien pour réinitialiser votre mot de passe.
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
            title="Mot de passe oublié"
            description="Entrez votre email pour recevoir un lien de réinitialisation"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                        </>
                    ) : (
                        "Envoyer le lien"
                    )}
                </Button>

                <div className="text-center pt-4">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Retour à la connexion
                    </Link>
                </div>
            </form>
        </AuthCard>
    )
}
