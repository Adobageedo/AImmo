"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, FileText, UserPlus, Home, DollarSign } from "lucide-react"

// Mock data for activity feed
const activities = [
    {
        id: 1,
        type: "payment",
        title: "Paiement reçu",
        description: "Loyer de Mars - Appartement 4B (Jean Dupont)",
        date: "Aujourd'hui, 10:30",
        amount: "+850 €",
        icon: DollarSign,
        color: "bg-green-100 text-green-600",
    },
    {
        id: 2,
        type: "lease",
        title: "Nouveau bail signé",
        description: "Studio Centre-Ville - Marie Martin",
        date: "Hier, 14:15",
        icon: FileText,
        color: "bg-blue-100 text-blue-600",
    },
    {
        id: 3,
        type: "maintenance",
        title: "Intervention planifiée",
        description: "Plomberie - Résidence Les Fleurs",
        date: "21 Mars 2025, 09:00",
        icon: Calendar,
        color: "bg-orange-100 text-orange-600",
    },
    {
        id: 4,
        type: "new_tenant",
        title: "Nouveau dossier locataire",
        description: "Pierre Durant - T2 Gambetta",
        date: "20 Mars 2025, 11:45",
        icon: UserPlus,
        color: "bg-purple-100 text-purple-600",
    },
    {
        id: 5,
        type: "property",
        title: "Mise à jour propriété",
        description: "Ajout de documents techniques - Villa des Roses",
        date: "19 Mars 2025, 16:20",
        icon: Home,
        color: "bg-gray-100 text-gray-600",
    },
]

export default function ActivityPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Activité"
                description="Historique des événements récents de votre portefeuille"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        Fil d'actualité
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l border-gray-200 ml-3 space-y-8 py-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative pl-8">
                                <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${activity.color}`}>
                                    <activity.icon className="h-4 w-4" />
                                </span>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">{activity.title}</h3>
                                        <p className="text-sm text-gray-500">{activity.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <time className="text-xs text-gray-400">{activity.date}</time>
                                        {activity.amount && (
                                            <span className="text-sm font-medium text-green-600">{activity.amount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
