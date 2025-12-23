"use client"

import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart } from "lucide-react"

export default function FinancesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Finance"
                description="Suivi de vos revenus locatifs et dépenses"
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Revenus Mensuels"
                    value="45 250 €"
                    icon={DollarSign}
                    trend={{ value: "+2.5%", positive: true }}
                    description="vs mois dernier"
                />
                <StatCard
                    title="Dépenses"
                    value="12 400 €"
                    icon={CreditCard}
                    trend={{ value: "-4.1%", positive: true }}
                    description="vs mois dernier"
                />
                <StatCard
                    title="Résultat Net"
                    value="32 850 €"
                    icon={Wallet}
                    trend={{ value: "+5.2%", positive: true }}
                    description="vs mois dernier"
                />
                <StatCard
                    title="Taux de Rendement"
                    value="4.8%"
                    icon={TrendingUp}
                    trend={{ value: "+0.2%", positive: true }}
                    description="Annualisé"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Flux de Trésorerie</CardTitle>
                        <CardDescription>Vue d'ensemble des 6 derniers mois</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed text-gray-400">
                            <PieChart className="h-8 w-8 mr-2" />
                            <span>Graphique à venir</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Dernières Transactions</CardTitle>
                        <CardDescription>Entrées et sorties récentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EmptyState
                            title="Aucune transaction récente"
                            description="Les transactions apparaîtront ici une fois que vous aurez connecté vos comptes bancaires."
                            icon={CreditCard}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
