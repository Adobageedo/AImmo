"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"

export default function LegalPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">
                <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8">Mentions Légales</h1>

                    <div className="prose prose-indigo max-w-none text-gray-600 space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Éditeur du site</h2>
                        <p>
                            Le site AImmo est édité par la société AImmo SAS, au capital de 10 000 euros.<br />
                            Immatriculée au RCS de Paris sous le numéro 123 456 789.<br />
                            Siège social : 123 Avenue des Champs-Élysées, 75008 Paris, France.<br />
                            N° TVA Intracommunautaire : FR 12 123456789.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">Directeur de la publication</h2>
                        <p>
                            Monsieur Jean Directeur
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">Hébergement</h2>
                        <p>
                            Le site est hébergé par Vercel Inc.<br />
                            340 S Lemon Ave #4133<br />
                            Walnut, CA 91789<br />
                            États-Unis
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">Propriété intellectuelle</h2>
                        <p>
                            L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.
                            Tous les droits de reproduction sont réservés.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
