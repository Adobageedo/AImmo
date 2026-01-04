"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Book, Code, FileText, Lightbulb } from "lucide-react"
import Link from "next/link"

const sections = [
    {
        title: "Guide de démarrage",
        description: "Apprenez les bases d'AImmo et configurez votre compte en quelques minutes.",
        icon: Lightbulb,
        href: "#"
    },
    {
        title: "Gestion des biens",
        description: "Comment ajouter, modifier et gérer vos propriétés locatives.",
        icon: FileText,
        href: "#"
    },
    {
        title: "Comptabilité",
        description: "Tout savoir sur le suivi des loyers, charges et rapports financiers.",
        icon: Book,
        href: "#"
    },
    {
        title: "API Developpeur",
        description: "Intégrez AImmo dans vos propres outils et workflows.",
        icon: Code,
        href: "/api"
    }
]

export default function DocsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <main className="flex-1 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Documentation</h1>
                        <p className="mt-6 text-lg text-gray-600">
                            Explorez nos guides et tutoriels pour tirer le meilleur parti d'AImmo.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {sections.map((section, idx) => (
                            <Link key={idx} href={section.href} className="group block p-8 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-gray-50 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                        <section.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{section.title}</h3>
                                </div>
                                <p className="text-gray-600">{section.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
