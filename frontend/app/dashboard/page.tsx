'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, Users, TrendingUp, Clock, Calendar, FileCode } from 'lucide-react'
import { StatCard, ActionCard, PageHeader } from '@/components/ui'
import { UploadDialogEnhanced } from '@/components/documents/upload-dialog-enhanced'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth-store'
import { useProperties } from '@/lib/hooks/use-properties'
import { useTenants } from '@/lib/hooks/use-tenants'
import { DocumentType } from '@/lib/types/document'
import { DocumentProvider } from '@/lib/contexts/document-context'

export default function DashboardPage() {
  const router = useRouter()
  const { user, organization } = useAuthStore()
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalLeases: 0,
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

      // Count properties with active leases
      const totalLeases = properties.filter(prop => prop.status === 'rented' || prop.current_tenant_id).length

      setStats({
        totalProperties: properties.length,
        totalLeases,
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
    <DocumentProvider>
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
          title="Baux"
          value={stats.totalLeases.toString()}
          description="Baux actifs"
          icon={FileCode}
          href="/dashboard/leases"
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
          <UploadDialogEnhanced
            defaultFolder="/Leases"
            defaultDocumentType={DocumentType.BAIL}
            trigger={
              <div className="relative overflow-hidden rounded-xl p-6 text-white transition-all hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-orange-500 to-pink-600 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Analyser un bail</p>
                    <p className="text-sm text-white/80">Extraire les données d'un contrat</p>
                  </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
              </div>
            }
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
    </DocumentProvider>
  )
}
