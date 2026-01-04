"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import Link from "next/link"

const posts = [
    {
        title: "L'IA au service de la gestion locative",
        excerpt: "Comment l'intelligence artificielle révolutionne le quotidien des propriétaires bailleurs en automatisant les tâches répétitives.",
        date: "23 Mars 2025",
        category: "Technologie",
        readTime: "5 min",
        image: "bg-indigo-100" // Placeholder functionality
    },
    {
        title: "Comprendre la nouvelle loi sur l'encadrement des loyers",
        excerpt: "Tout ce que vous devez savoir sur les dernières évolutions législatives et leur impact sur vos investissements.",
        date: "20 Mars 2025",
        category: "Législation",
        readTime: "8 min",
        image: "bg-purple-100"
    },
    {
        title: "Optimiser sa fiscalité immobilière en 2025",
        excerpt: "Guide complet sur les dispositifs de défiscalisation actuels et les meilleures stratégies pour réduire vos impôts.",
        date: "15 Mars 2025",
        category: "Finance",
        readTime: "10 min",
        image: "bg-blue-100"
    }
]

export default function BlogPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />

            <main className="flex-1 bg-gray-50">
                <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Blog AImmo</h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Actualités, conseils et analyses pour les professionnels de l'immobilier.
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-6 py-16 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <Link href="#" key={index} className="group">
                                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                                    <div className={`h-48 w-full ${post.image} flex items-center justify-center`}>
                                        <span className="text-gray-400">Image</span>
                                    </div>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="secondary">{post.category}</Badge>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {post.date}
                                            </div>
                                        </div>
                                        <CardTitle className="group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {post.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-3">
                                            {post.excerpt}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs font-medium text-gray-500">{post.readTime} de lecture</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
