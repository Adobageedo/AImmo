"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase } from "lucide-react"

const positions = [
    {
        title: "Senior Full Stack Developer",
        department: "Engineering",
        location: "Paris / Remote",
        type: "CDI"
    },
    {
        title: "AI Research Scientist",
        department: "Data Science",
        location: "Paris",
        type: "CDI"
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Remote",
        type: "Freelance"
    },
    {
        title: "Customer Success Manager",
        department: "Sales",
        location: "Paris",
        type: "CDI"
    }
]

export default function CareersPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />

            <main className="flex-1">
                <section className="bg-indigo-900 px-6 py-24 sm:py-32 lg:px-8 text-white">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Rejoignez l'aventure</h1>
                        <p className="mt-6 text-lg leading-8 text-indigo-200">
                            Nous construisons le futur de la gestion immobilière avec l'IA.
                            Venez résoudre des problèmes complexes avec une équipe passionnée.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-4xl px-6 py-24">
                    <h2 className="text-2xl font-bold mb-10 text-gray-900">Postes ouverts</h2>
                    <div className="space-y-4">
                        {positions.map((pos, index) => (
                            <div key={index} className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-md">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                                        {pos.title}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="h-4 w-4" />
                                            {pos.department}
                                        </span>
                                        <span>•</span>
                                        <span>{pos.location}</span>
                                        <span>•</span>
                                        <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{pos.type}</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="shrink-0">
                                    Postuler <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
