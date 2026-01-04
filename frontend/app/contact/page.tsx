"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, MapPin, Phone } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNavbar />

            <main className="flex-1 bg-gray-50">
                <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* Info */}
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Contactez-nous</h1>
                            <p className="mt-6 text-lg text-gray-600">
                                Une question sur nos services ? Besoin d'une démo personnalisée ?
                                Notre équipe est à votre écoute pour vous accompagner.
                            </p>

                            <div className="mt-10 space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                                        <Mail className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Email</h3>
                                        <p className="mt-1 text-gray-600">contact@aimmo.ai</p>
                                        <p className="text-gray-600">support@aimmo.ai</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                                        <Phone className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Téléphone</h3>
                                        <p className="mt-1 text-gray-600">+33 1 23 45 67 89</p>
                                        <p className="text-sm text-gray-500">Du Lundi au Vendredi, 9h-18h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                                        <MapPin className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Bureaux</h3>
                                        <p className="mt-1 text-gray-600">
                                            123 Avenue des Champs-Élysées<br />
                                            75008 Paris, France
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <Card className="shadow-lg">
                            <CardContent className="p-8">
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">
                                                Prénom
                                            </label>
                                            <div className="mt-2">
                                                <Input type="text" id="first-name" />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                                                Nom
                                            </label>
                                            <div className="mt-2">
                                                <Input type="text" id="last-name" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                            Email
                                        </label>
                                        <div className="mt-2">
                                            <Input type="email" id="email" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">
                                            Message
                                        </label>
                                        <div className="mt-2">
                                            <textarea
                                                id="message"
                                                rows={4}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Envoyer le message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
