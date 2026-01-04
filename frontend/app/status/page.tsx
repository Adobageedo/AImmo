"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { CheckCircle } from "lucide-react"

const systems = [
    { name: "API Backend", status: "operational" },
    { name: "Interface Dashboard", status: "operational" },
    { name: "Moteur OCR", status: "operational" },
    { name: "Service de Chat / RAG", status: "operational" },
    { name: "Stockage de fichiers", status: "operational" },
    { name: "Emails transactionnels", status: "operational" },
]

export default function StatusPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1 bg-gray-50">
                <div className="mx-auto max-w-4xl px-6 py-24">
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                        <div className="bg-green-500 p-6 flex items-center justify-center text-white">
                            <CheckCircle className="h-8 w-8 mr-3" />
                            <h1 className="text-2xl font-bold">Tous les systèmes sont opérationnels</h1>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4">
                                {systems.map((sys, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100">
                                        <span className="font-medium text-gray-900">{sys.name}</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Opérationnel
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Dernière mise à jour : il y a 2 minutes
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    )
}
