"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle } from "lucide-react"

export default function SupportPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1 bg-gray-50">
                <div className="bg-indigo-600 py-16 px-6 text-center">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">Centre d'aide</h1>
                    <p className="mt-4 text-indigo-100">Comment pouvons-nous vous aider aujourd'hui ?</p>
                </div>

                <div className="mx-auto max-w-3xl px-6 py-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Questions Fréquentes</h2>

                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-2">Comment importer mes documents ?</h3>
                            <p className="text-gray-600">Vous pouvez glisser-déposer vos PDF directement dans l'onglet "Documents" de votre tableau de bord. Notre IA les traitera automatiquement.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-2">La signature électronique est-elle légale ?</h3>
                            <p className="text-gray-600">Oui, nous utilisons un partenaire certifié eIDAS pour garantir la validité juridique de toutes les signatures effectuées sur la plateforme.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-2">Puis-je exporter mes données comptables ?</h3>
                            <p className="text-gray-600">Absolument. Vous pouvez générer des exports aux formats Excel, CSV ou PDF compatibles avec la plupart des logiciels comptables.</p>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Vous ne trouvez pas votre réponse ?</h3>
                        <div className="flex justify-center gap-4">
                            <Button>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Chatter avec le support
                            </Button>
                            <Button variant="outline">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                Ouvrir un ticket
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
