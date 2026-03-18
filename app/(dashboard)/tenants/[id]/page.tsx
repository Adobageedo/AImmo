"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { EntityDetailLayout } from "@/components/entities/EntityDetailLayout"
import { EntityColumn } from "@/components/entities"
import { LoadingPage } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TenantForm } from "@/components/forms/tenants/tenant-form"
import { tenantService } from "@/services/tenant.service"
import type { Tenant } from "@/types/tenant"
import { Mail, Phone, MapPin, Calendar, User } from "lucide-react"

interface TenantDetailPageProps {
  params: Promise<{ id: string }>
}

export default function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id && id) {
      fetchTenant()
    }
  }, [currentOrganization?.id, id])

  const fetchTenant = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tenants/${id}?include_relationships=true`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setTenant(result.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger le locataire",
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) return

    try {
      const response = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Locataire supprimé avec succès"
        })
        router.push("/tenants")
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de supprimer le locataire",
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
    fetchTenant()
    toast({
      title: "Succès",
      description: "Locataire modifié avec succès"
    })
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Locataire non trouvé</p>
      </div>
    )
  }

  const fullName = `${tenant.first_name} ${tenant.last_name}`

  return (
    <>
      <EntityDetailLayout
        entityType="tenant"
        entityId={id}
        title={fullName}
        subtitle={tenant.email}
        backUrl="/tenants"
        onEdit={handleEdit}
        onDelete={handleDelete}
        relationsSection={
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Baux</h4>
              <EntityColumn
                entityType="tenant"
                entityId={id}
                relatedType="lease"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(tenant as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Propriétés</h4>
              <EntityColumn
                entityType="tenant"
                entityId={id}
                relatedType="property"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(tenant as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Propriétaires</h4>
              <EntityColumn
                entityType="tenant"
                entityId={id}
                relatedType="owner"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(tenant as any).relationships}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Nom complet</p>
              <p className="text-muted-foreground">{fullName}</p>
            </div>
          </div>

          {tenant.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{tenant.email}</p>
              </div>
            </div>
          )}

          {tenant.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-muted-foreground">{tenant.phone}</p>
              </div>
            </div>
          )}

          {tenant.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">{tenant.address}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Date de création</p>
              <p className="text-muted-foreground">
                {new Date(tenant.created_at).toLocaleDateString('fr-FR', {
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
            <DialogTitle>Modifier le locataire</DialogTitle>
          </DialogHeader>
          <TenantForm
            initialData={tenant}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
