"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Code2, Terminal, Lock } from "lucide-react"

export default function ApiPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1">
                <div className="bg-slate-900 text-white py-24 px-6 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-2 text-indigo-400 mb-6 font-mono text-sm">
                                    <Code2 className="h-5 w-5" />
                                    <span>DEVELOPER API</span>
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                                    Construisez avec AImmo
                                </h1>
                                <p className="text-lg text-slate-300 mb-8">
                                    Accédez programmatiquement à toutes vos données immobilières.
                                    Intégrez notre OCR, nos analyses et notre gestion locative directement dans vos applications.
                                </p>
                                <div className="flex gap-4">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">Lire la documentation</Button>
                                    <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">Obtenir une clé API</Button>
                                </div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 font-mono text-sm overflow-hidden shadow-2xl">
                                <div className="flex gap-2 mb-4">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                </div>
                                <div className="space-y-2 text-slate-300">
                                    <p><span className="text-purple-400">curl</span> -X POST https://api.aimmo.ai/v1/properties \</p>
                                    <p className="pl-4">-H <span className="text-green-400">"Authorization: Bearer YOUR_API_KEY"</span> \</p>
                                    <p className="pl-4">-H <span className="text-green-400">"Content-Type: application/json"</span> \</p>
                                    <p className="pl-4">-d <span className="text-yellow-400">{"{"}</span></p>
                                    <p className="pl-8 text-yellow-400">"name": "Résidence Les Fleurs",</p>
                                    <p className="pl-8 text-yellow-400">"address": "12 rue de la Paix, 75001 Paris",</p>
                                    <p className="pl-8 text-yellow-400">"units": 12</p>
                                    <p className="pl-4 text-yellow-400">{"}"}'</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-24 px-6 lg:px-8 bg-white">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-6">
                                <Terminal className="h-8 w-8 text-indigo-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">RESTful API</h3>
                                <p className="text-gray-600">Une API standard, prévisible et facile à utiliser avec des réponses JSON.</p>
                            </div>
                            <div className="p-6">
                                <Lock className="h-8 w-8 text-indigo-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Sécurisée</h3>
                                <p className="text-gray-600">Authentification OAuth2 et chiffrement de bout en bout pour protéger vos données.</p>
                            </div>
                            <div className="p-6">
                                <Code2 className="h-8 w-8 text-indigo-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">SDK Client</h3>
                                <p className="text-gray-600">Bibliothèques officielles pour Node.js, Python et PHP pour démarrer rapidement.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
