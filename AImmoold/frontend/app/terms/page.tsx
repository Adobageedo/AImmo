"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">
                <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8">Conditions Générales d'Utilisation</h1>

                    <div className="prose prose-indigo max-w-none text-gray-600 space-y-6">
                        <p>En vigueur au : 23 Mars 2025</p>

                        <h2 className="text-xl font-semibold text-gray-900">1. Acceptation des conditions</h2>
                        <p>
                            En accédant à AImmo et en utilisant nos services, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation.
                            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">2. Description du service</h2>
                        <p>
                            AImmo fournit une plateforme de gestion immobilière assistée par intelligence artificielle.
                            Nous nous réservons le droit de modifier ou d'interrompre le service à tout moment, avec ou sans préavis.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">3. Inscription et compte</h2>
                        <p>
                            Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos identifiants
                            et de toutes les activités qui se produisent sous votre compte.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">4. Responsabilité</h2>
                        <p>
                            Bien que nous nous efforcions de fournir des informations précises (notamment via nos outils d'IA), AImmo ne peut être tenu responsable
                            des erreurs ou omissions. Les informations juridiques et financières fournies le sont à titre informatif uniquement.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
