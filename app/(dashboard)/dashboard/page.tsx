'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileText, Users, TrendingUp, Clock, Calendar, FileCode, AlertCircle, Home, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { LoadingPage } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/calculations"

interface DashboardData {
  stats: {
    totalProperties: number
    totalLeases: number
    activeLeases: number
    totalTenants: number
    totalOwners: number
    totalMonthlyRevenue: number
    propertyStatusStats: Record<string, number>
  }
  expiringLeases: any[]
  recentActivity: {
    properties: any[]
    leases: any[]
  }
}

export default function DashboardEnhancedPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchDashboardData()
    }
  }, [currentOrganization?.id])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizations/${currentOrganization?.id}/dashboard`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setDashboardData(result.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du dashboard",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (loading || !dashboardData) {
    return <LoadingPage />
  }

  const { stats, expiringLeases, recentActivity } = dashboardData

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bonjour 👋</h1>
        <p className="text-muted-foreground">Voici un aperçu de votre activité immobilière</p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.propertyStatusStats.rented || 0} loué(s) · {stats.propertyStatusStats.available || 0} disponible(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baux</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeases}</div>
            <p className="text-xs text-muted-foreground">{stats.totalLeases} total · {stats.activeLeases} actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locataires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">Locataires actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Revenus mensuels récurrents</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push('/documents')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ajouter un document
              </CardTitle>
              <CardDescription>Téléverser un nouveau fichier</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push('/properties')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nouvelle propriété
              </CardTitle>
              <CardDescription>Ajouter un bien immobilier</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-orange-500 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Analyser un bail
              </CardTitle>
              <CardDescription className="text-white/80">Extraire les données d'un contrat</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activité récente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.properties.length === 0 && recentActivity.leases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune activité récente</h3>
                  <p className="text-muted-foreground">Commencez par ajouter un document ou une propriété</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.properties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/properties/${property.id}`)}
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.address}, {property.city}
                        </p>
                      </div>
                      <Badge variant="outline">{property.status}</Badge>
                    </div>
                  ))}
                  {recentActivity.leases.slice(0, 2).map((lease) => (
                    <div
                      key={lease.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/leases/${lease.id}`)}
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <FileCode className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Nouveau bail</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(lease.monthly_rent)}/mois
                        </p>
                      </div>
                      <Badge variant="outline">{lease.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expiring Leases */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle>Baux expirant bientôt</CardTitle>
              </div>
              <CardDescription>Dans les 30 prochains jours</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringLeases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun bail n'expire prochainement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expiringLeases.map((lease) => (
                    <div
                      key={lease.id}
                      className="p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => router.push(`/leases/${lease.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {lease.property && (
                            <p className="font-medium text-sm">{lease.property.name}</p>
                          )}
                          {lease.tenants && lease.tenants.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {lease.tenants.map((t: any) => `${t.first_name} ${t.last_name}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(lease.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(lease.monthly_rent)}/mois
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
