"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"

export default function CookiesPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">
                <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8">Politique des Cookies</h1>

                    <div className="prose prose-indigo max-w-none text-gray-600 space-y-6">
                        <p>
                            Cette politique explique comment AImmo utilise les cookies et technologies similaires.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">1. Qu'est-ce qu'un cookie ?</h2>
                        <p>
                            Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez notre site.
                            Il nous permet de reconnaître votre appareil et de mémoriser vos préférences.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">2. Cookies que nous utilisons</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Essentiels :</strong> Nécessaires au fonctionnement du site (authentification, sécurité).</li>
                            <li><strong>Analytiques :</strong> Nous aident à comprendre comment vous utilisez le site pour l'améliorer.</li>
                            <li><strong>Fonctionnels :</strong> Permettent de mémoriser vos choix (langue, devise).</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900">3. Gestion des cookies</h2>
                        <p>
                            Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur.
                            Notez que le blocage de certains cookies peut affecter la fonctionnalité de notre service.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
