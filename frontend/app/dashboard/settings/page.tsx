"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Building, User as UserIcon, LogOut, Check, Building2, HelpCircle } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { authService } from "@/lib/services/auth-service"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const router = useRouter()
    const {
        user,
        organization,
        logout
    } = useAuthStore()

    const [isLoading, setIsLoading] = useState(false)

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            await authService.logout()
            router.push("/auth/login")
        } catch (error) {
            console.error("Logout failed", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Paramètres"
                description="Gérez votre profil et vote espace de travail"
            />

            <div className="grid gap-6 md:grid-cols-2">

                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Profil Utilisateur</CardTitle>
                        </div>
                        <CardDescription>Vos informations personnelles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input value={user?.email || ""} disabled readOnly className="bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nom Complet</label>
                            <Input value={user?.fullName || ""} disabled readOnly className="bg-gray-50" />
                        </div>

                        <div className="pt-4">
                            <Button variant="destructive" onClick={handleLogout} disabled={isLoading} className="w-full sm:w-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Se déconnecter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Settings (Single View) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <CardTitle>Organisation (Asset Manager)</CardTitle>
                        </div>
                        <CardDescription>
                            Votre espace de travail unique
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {organization ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-4">
                                    <div className="bg-indigo-100 p-2 rounded-full">
                                        <Building className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-indigo-900">{organization.name}</h4>
                                        <p className="text-sm text-indigo-700">Rôle : {organization.role}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>En tant qu'Asset Manager, vous gérez un portefeuille unique de biens et de baux sous cette entité.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 border border-dashed rounded-lg">
                                <p className="text-muted-foreground">Aucune organisation liée.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
