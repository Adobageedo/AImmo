"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { EntityDetailLayout } from "@/components/entities/EntityDetailLayout"
import { EntityColumn } from "@/components/entities"
import { LoadingPage } from "@/components/common/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PropertyForm } from "@/components/forms/properties/property-form"
import { propertyService } from "@/services/property.service"
import { formatCurrency } from "@/lib/utils/calculations"
import type { Property } from "@/types/property"
import { MapPin, Home, Maximize, DollarSign, Calendar, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

const getStatusBadge = (status: Property["status"]) => {
  const variants = {
    available: "secondary",
    rented: "success",
    maintenance: "warning",
    sold: "default",
  } as const

  const labels = {
    available: "Disponible",
    rented: "Loué",
    maintenance: "Maintenance",
    sold: "Vendu",
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

const getTypeBadge = (type: Property["type"]) => {
  const labels = {
    residential: "Résidentiel",
    commercial: "Commercial",
    industrial: "Industriel",
    mixed: "Mixte",
  }

  return <Badge variant="outline">{labels[type]}</Badge>
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id && id) {
      fetchProperty()
    }
  }, [currentOrganization?.id, id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/properties/${id}?include_relationships=true`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setProperty(result.data)
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger la propriété",
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette propriété ?")) return

    try {
      const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Propriété supprimée avec succès"
        })
        router.push("/properties")
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de supprimer la propriété",
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
    fetchProperty()
    toast({
      title: "Succès",
      description: "Propriété modifiée avec succès"
    })
  }

  if (loading) {
    return <LoadingPage />
  }

  if (!property) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Propriété non trouvée</p>
      </div>
    )
  }

  return (
    <>
      <EntityDetailLayout
        entityType="property"
        entityId={id}
        title={property.name}
        subtitle={`${property.city}, ${property.country}`}
        status={property.status}
        backUrl="/properties"
        onEdit={handleEdit}
        onDelete={handleDelete}
        relationsSection={
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Baux</h4>
              <EntityColumn
                entityType="property"
                entityId={id}
                relatedType="lease"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(property as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Propriétaires</h4>
              <EntityColumn
                entityType="property"
                entityId={id}
                relatedType="owner"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(property as any).relationships}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Locataires</h4>
              <EntityColumn
                entityType="property"
                entityId={id}
                relatedType="tenant"
                organizationId={currentOrganization?.id || ""}
                preloadedRelationships={(property as any).relationships}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Home className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Nom</p>
              <p className="text-muted-foreground">{property.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Type</p>
              <div>{getTypeBadge(property.type)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Adresse</p>
              <p className="text-muted-foreground">
                {property.address}<br />
                {property.postal_code} {property.city}<br />
                {property.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Maximize className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Surface</p>
              <p className="text-muted-foreground">{property.surface} m²</p>
            </div>
          </div>

          {property.rooms && (
            <div className="flex items-center gap-3 text-sm">
              <Home className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Pièces</p>
                <p className="text-muted-foreground">{property.rooms}</p>
              </div>
            </div>
          )}

          {property.estimated_value && (
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Valeur estimée</p>
                <p className="text-muted-foreground">{formatCurrency(property.estimated_value)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Statut</p>
              <div>{getStatusBadge(property.status)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Date de création</p>
              <p className="text-muted-foreground">
                {new Date(property.created_at).toLocaleDateString('fr-FR', {
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
            <DialogTitle>Modifier la propriété</DialogTitle>
          </DialogHeader>
          <PropertyForm
            initialData={property}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
