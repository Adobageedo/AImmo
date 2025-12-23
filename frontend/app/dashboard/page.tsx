'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, Users, TrendingUp, Clock, Calendar } from 'lucide-react'
import { StatCard, ActionCard, PageHeader } from '@/components/ui'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth-store'
import { useProperties } from '@/lib/hooks/use-properties'
import { useTenants } from '@/lib/hooks/use-tenants'

export default function DashboardPage() {
  const router = useRouter()
  const { user, organization } = useAuthStore()
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalDocuments: 0,
    totalTenants: 0,
    totalRevenue: 0,
    revenueChange: 0,
  })

  // Fetch properties with lease data
  const { items: properties, loading: propertiesLoading } = useProperties({ autoLoad: true })
  
  // Fetch tenants
  const { items: tenants, loading: tenantsLoading } = useTenants({ autoLoad: true })

  // Calculate stats from properties
  useEffect(() => {
    if (properties && properties.length > 0) {
      const totalRevenue = properties.reduce((sum, prop) => {
        return sum + (parseFloat(prop.monthly_rent as any) || 0)
      }, 0)

      setStats({
        totalProperties: properties.length,
        totalDocuments: 0, // TODO: fetch from documents API
        totalTenants: tenants?.length || 0,
        totalRevenue,
        revenueChange: 0, // TODO: calculate from historical data
      })
    }
  }, [properties, tenants])

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <PageHeader
        title="Bonjour 👋"
        description="Voici un aperçu de votre activité immobilière"
      >
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Propriétés"
          value={stats.totalProperties.toString()}
          description="Biens gérés"
          icon={Building2}
          href="/dashboard/properties"
          trend={{ value: `+${stats.totalProperties} ce mois`, positive: true }}
        />
        <StatCard
          title="Documents"
          value={stats.totalDocuments.toString()}
          description="Fichiers stockés"
          icon={FileText}
          href="/dashboard/documents"
        />
        <StatCard
          title="Locataires"
          value={stats.totalTenants.toString()}
          description="Baux actifs"
          icon={Users}
          href="/dashboard/tenants"
        />
        <StatCard
          title="Revenus"
          value={formatCurrency(stats.totalRevenue)}
          description="Ce mois-ci"
          icon={TrendingUp}
          trend={{ 
            value: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}% vs dernier mois`, 
            positive: stats.revenueChange >= 0 
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Ajouter un document"
            description="Téléverser un nouveau fichier"
            icon={FileText}
            href="/dashboard/documents"
            gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          />
          <ActionCard
            title="Nouvelle propriété"
            description="Ajouter un bien immobilier"
            icon={Building2}
            href="/dashboard/properties/new"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <ActionCard
            title="Analyser un bail"
            description="Extraire les données d'un contrat"
            icon={FileText}
            href="/dashboard/documents"
            gradient="bg-gradient-to-br from-orange-500 to-pink-600"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
            <Link href="/dashboard/activity" className="text-sm text-indigo-600 hover:text-indigo-700">
              Voir tout
            </Link>
          </div>
          <EmptyState
            icon={Clock}
            title="Aucune activité récente"
            description="Commencez par ajouter un document ou une propriété"
          />
        </div>

        {/* Upcoming Events */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Échéances à venir</h2>
          <EmptyState
            icon={Calendar}
            title="Aucune échéance"
            description="Vos prochaines dates importantes apparaîtront ici"
          />
        </div>
      </div>
    </div>
  )
}
