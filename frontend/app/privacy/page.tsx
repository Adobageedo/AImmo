"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">
                <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-8">Politique de Confidentialité</h1>

                    <div className="prose prose-indigo max-w-none text-gray-600 space-y-6">
                        <p>Dernière mise à jour : 23 Mars 2025</p>

                        <h2 className="text-xl font-semibold text-gray-900">1. Collecte des informations</h2>
                        <p>
                            Nous collectons les informations que vous nous fournissez directement lorsque vous utilisez nos services, notamment lors de la création d'un compte,
                            de l'importation de documents ou de la communication avec notre support. Ces informations peuvent inclure votre nom, adresse email,
                            coordonnées bancaires et les détails de vos propriétés.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">2. Utilisation des données</h2>
                        <p>
                            Nous utilisons vos données pour fournir, maintenir et améliorer nos services, notamment pour l'analyse automatique de documents (OCR),
                            la gestion des baux et la communication avec vos locataires.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">3. Sécurité</h2>
                        <p>
                            La sécurité de vos données est notre priorité. Nous utilisons des protocoles de chiffrement avancés pour protéger vos informations personnelles
                            et financières lors de leur transmission et de leur stockage.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900">4. Vos droits</h2>
                        <p>
                            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
                            Vous pouvez exercer ces droits en nous contactant à privacy@aimmo.ai.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
