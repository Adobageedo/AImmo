import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, FileText, Users, TrendingUp, Clock, Calendar } from 'lucide-react'
import { StatCard, ActionCard, PageHeader } from '@/components/ui'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
          value="0"
          description="Biens gérés"
          icon={Building2}
          href="/dashboard/properties"
          trend={{ value: "+0% ce mois", positive: true }}
        />
        <StatCard
          title="Documents"
          value="0"
          description="Fichiers stockés"
          icon={FileText}
          href="/dashboard/documents"
        />
        <StatCard
          title="Locataires"
          value="0"
          description="Baux actifs"
          icon={Users}
          href="/dashboard/tenants"
        />
        <StatCard
          title="Revenus"
          value="€ 0"
          description="Ce mois-ci"
          icon={TrendingUp}
          href="/dashboard/finances"
          trend={{ value: "+0% vs dernier mois", positive: true }}
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
