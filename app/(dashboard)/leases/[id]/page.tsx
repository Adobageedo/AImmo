"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { EntityDetailLayout } from "@/components/entities/EntityDetailLayout"
import { EntityColumn } from "@/components/entities"
import { LoadingPage } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LeaseForm } from "@/components/forms/leases/lease-form"
import { leaseService } from "@/services/lease.service"
import { formatCurrency } from "@/lib/utils/calculations"
import type { Lease } from "@/types/lease"
import { Calendar, DollarSign, FileText, TrendingUp, Percent } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LeaseDetailPageProps {
  params: Promise<{ id: string }>
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { variant: any; label: string }> = {
    active: { variant: "success", label: "Actif" },
    expired: { variant: "default", label: "Expiré" },
    terminated: { variant: "destructive", label: "Résilié" },
    draft: { variant: "secondary", label: "Brouillon" },
    pending_signature: { variant: "warning", label: "En attente de signature" },
  }

  const config = statusConfig[status] || { variant: "default", label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function LeaseDetailPage({ params }: LeaseDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  
  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id && id) {
      fetchLease()
    }
  }, [currentOrganization?.id, id])

  const fetchLease = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leases/${id}?include_relationships=true`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setLease(result.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger le bail",
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

  const handleEdit = () => {
    setIsEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bail ?")) return

    try {
      const response = await fetch(`/api/leases/${id}`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Bail supprimé avec succès"
        })
        router.push("/leases")
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de supprimer le bail",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      })
    }
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    fetchLease()
    toast({
      title: "Succès",
      description: "Bail modifié avec succès"
    })
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!lease) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Bail non trouvé</p>
      </div>
    )
  }

  const leaseTitle = `Bail ${new Date(lease.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${new Date(lease.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`

  return (
    <>
      <EntityDetailLayout
        entityType="lease"
        entityId={id}
        title={leaseTitle}
        subtitle={`${formatCurrency(lease.monthly_rent)}/mois`}
        status={lease.status}
        backUrl="/leases"
        onEdit={handleEdit}
        onDelete={handleDelete}
        relationsSection={
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Propriété</h4>
              <EntityColumn
                entityType="lease"
                entityId={id}
                relatedType="property"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(lease as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Propriétaires</h4>
              <EntityColumn
                entityType="lease"
                entityId={id}
                relatedType="owner"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(lease as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Locataires</h4>
              <EntityColumn
                entityType="lease"
                entityId={id}
                relatedType="tenant"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(lease as any).relationships}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Période</p>
              <p className="text-muted-foreground">
                Du {new Date(lease.start_date).toLocaleDateString('fr-FR')} au {new Date(lease.end_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Loyer mensuel</p>
              <p className="text-muted-foreground">{formatCurrency(lease.monthly_rent)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Charges</p>
              <p className="text-muted-foreground">{formatCurrency(lease.charges)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Dépôt de garantie</p>
              <p className="text-muted-foreground">{formatCurrency(lease.deposit)}</p>
            </div>
          </div>

          {lease.indexation_clause && (
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Indexation</p>
                <p className="text-muted-foreground">
                  {lease.indexation_rate}%
                </p>
              </div>
            </div>
          )}

          {lease.payment_day && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Jour de paiement</p>
                <p className="text-muted-foreground">Le {lease.payment_day} de chaque mois</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Statut</p>
              <div>{getStatusBadge(lease.status)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Date de création</p>
              <p className="text-muted-foreground">
                {new Date(lease.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </EntityDetailLayout>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-none max-w-none w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le bail</DialogTitle>
          </DialogHeader>
          <LeaseForm
            initialData={lease}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
