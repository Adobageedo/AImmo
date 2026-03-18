"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { EntityDetailLayout } from "@/components/entities/EntityDetailLayout"
import { EntityColumn } from "@/components/entities"
import { LoadingPage } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OwnerForm } from "@/components/forms/owners/owner-form"
import { ownerService } from "@/services/owner.service"
import type { Owner } from "@/types/owner"
import { Mail, Phone, MapPin, Calendar, User, Building } from "lucide-react"

interface OwnerDetailPageProps {
  params: Promise<{ id: string }>
}

export default function OwnerDetailPage({ params }: OwnerDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id && id) {
      fetchOwner()
    }
  }, [currentOrganization?.id, id])

  const fetchOwner = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/owners/${id}?include_relationships=true`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setOwner(result.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger le propriétaire",
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce propriétaire ?")) return

    try {
      const response = await fetch(`/api/owners/${id}`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Propriétaire supprimé avec succès"
        })
        router.push("/owners")
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de supprimer le propriétaire",
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
    fetchOwner()
    toast({
      title: "Succès",
      description: "Propriétaire modifié avec succès"
    })
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!owner) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Propriétaire non trouvé</p>
      </div>
    )
  }

  const fullName = `${owner.first_name} ${owner.last_name}`

  return (
    <>
      <EntityDetailLayout
        entityType="owner"
        entityId={id}
        title={fullName}
        subtitle={owner.email}
        backUrl="/owners"
        onEdit={handleEdit}
        onDelete={handleDelete}
        relationsSection={
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Propriétés</h4>
              <EntityColumn
                entityType="owner"
                entityId={id}
                relatedType="property"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(owner as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Baux</h4>
              <EntityColumn
                entityType="owner"
                entityId={id}
                relatedType="lease"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(owner as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Locataires</h4>
              <EntityColumn
                entityType="owner"
                entityId={id}
                relatedType="tenant"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(owner as any).relationships}
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

          {owner.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{owner.email}</p>
              </div>
            </div>
          )}

          {owner.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-muted-foreground">{owner.phone}</p>
              </div>
            </div>
          )}

          {owner.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">{owner.address}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Date de création</p>
              <p className="text-muted-foreground">
                {new Date(owner.created_at).toLocaleDateString('fr-FR', {
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
            <DialogTitle>Modifier le propriétaire</DialogTitle>
          </DialogHeader>
          <OwnerForm
            initialData={owner}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
