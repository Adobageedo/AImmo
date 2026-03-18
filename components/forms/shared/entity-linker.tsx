"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Link, Unlink, Building2, Users, FileText, Home } from "lucide-react"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useProperties } from "@/hooks/use-properties"
import { useTenants } from "@/hooks/use-tenants"
import { useOwners } from "@/hooks/use-owners"
import { useLeases } from "@/hooks/use-leases"
import { useLeaseRelationships } from "@/hooks/use-lease-relationships"
import { OwnerForm } from "../owners/owner-form"
import { TenantForm } from "../tenants/tenant-form"
import { PropertyForm } from "../properties/property-form"
import { LeaseForm } from "../leases/lease-form"
import { useToast } from "@/hooks/use-toast"

const linkSchema = z.object({
  linkType: z.enum(["owner", "tenant", "property", "lease"]),
  linkEntityId: z.string().min(1, "Sélectionnez une entité à lier"),
  // Métadonnées pour owners
  percentage: z.number().min(0).max(100).optional(),
  is_main_owner: z.boolean().optional(),
  // Métadonnées pour tenants
  is_main_tenant: z.boolean().optional(),
})

type LinkFormValues = z.infer<typeof linkSchema>

interface EntityLinkerProps {
  currentEntity?: {
    type: "owner" | "tenant" | "property" | "lease"
    id: string
    name: string
  }
  onLinkCreated?: (link: any) => void
  onLinkRemoved?: (linkId: string) => void
  existingLinks?: any[]
  requiredLinks?: {
    type: "owner" | "tenant" | "property" | "lease"
    label: string
    minCount?: number
  }[]
  mode?: "create" | "edit"
}

export function EntityLinker({ 
  currentEntity, 
  onLinkCreated, 
  onLinkRemoved, 
  existingLinks = [],
  requiredLinks = [],
  mode = "create"
}: EntityLinkerProps) {
  const { currentOrganization } = useOrganizationContext()
  const { properties, fetchProperties } = useProperties(currentOrganization?.id || "")
  const { tenants, fetchTenants } = useTenants(currentOrganization?.id || "")
  const { owners, fetchOwners } = useOwners(currentOrganization?.id || "")
  const { leases, fetchLeases } = useLeases(currentOrganization?.id || "")
  const { toast } = useToast()
  
  // Hook pour gérer les relations de baux
  const {
    leaseWithRelationships,
    createRelationship,
    terminateRelationship,
    loading: relationshipsLoading
  } = useLeaseRelationships(
    currentOrganization?.id || "",
    currentEntity?.type === 'lease' ? currentEntity.id : undefined
  )
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreatingEntity, setIsCreatingEntity] = useState(false)
  const [entityTypeToCreate, setEntityTypeToCreate] = useState<string | null>(null)
  const [selectedLinkType, setSelectedLinkType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const getLinksCountByType = (type: string) => {
    return existingLinks.filter(link => link.to.type === type || link.from.type === type).length
  }

  const isRequirementMet = (requirement: { type: string; minCount?: number }) => {
    const count = getLinksCountByType(requirement.type)
    return count >= (requirement.minCount || 1)
  }

  const allRequirementsMet = requiredLinks.every(isRequirementMet)

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      linkType: "property",
      linkEntityId: "",
      percentage: undefined,
      is_main_owner: false,
      is_main_tenant: false,
    },
  })

  const linkType = form.watch("linkType")

  const hasEntities = (type: string) => {
    switch (type) {
      case "property":
        return properties.length > 0
      case "tenant":
        return tenants.length > 0
      case "owner":
        return owners.length > 0
      case "lease":
        return leases.length > 0
      default:
        return false
    }
  }

  const getEntityOptions = (type: string) => {
    let entities: { value: string; label: string }[] = []
    
    switch (type) {
      case "property":
        entities = properties.map(p => ({ value: p.id, label: p.name || "" }))
        break
      case "tenant":
        entities = tenants.map(t => ({ 
          value: t.id, 
          label: t.type === "company" ? (t.company_name || "") : `${t.first_name || ""} ${t.last_name || ""}` 
        }))
        break
      case "owner":
        entities = owners.map(o => ({ value: o.id, label: `${o.first_name || ""} ${o.last_name || ""}` }))
        break
      case "lease":
        entities = leases.map(l => ({ value: l.id, label: `Bail ${l.property_id || ""}` }))
        break
      default:
        entities = []
    }
    
    // Filtrer selon la recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      entities = entities.filter(entity => 
        entity.label.toLowerCase().includes(query)
      )
    }
    
    return entities
  }

  const handleCreateEntity = (type: string) => {
    setEntityTypeToCreate(type)
    setIsCreatingEntity(true)
  }

  const handleEntityCreated = () => {
    setIsCreatingEntity(false)
    setEntityTypeToCreate(null)
    // Rafraîchir les données
    if (currentOrganization?.id) {
      fetchProperties({ page: 1, limit: 100 })
      fetchTenants({ page: 1, limit: 100 })
      fetchOwners({ page: 1, limit: 100 })
      fetchLeases({ page: 1, limit: 100 })
    }
  }

  const getAvailableLinkTypes = () => {
    const allTypes = ["owner", "tenant", "property", "lease"]
    return allTypes
  }

  const handleLinkTypeSelect = (type: string) => {
    setSelectedLinkType(type)
    setSearchQuery("") // Réinitialiser la recherche quand on change de type
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "property":
        return <Building2 className="h-4 w-4" />
      case "tenant":
        return <Users className="h-4 w-4" />
      case "owner":
        return <Users className="h-4 w-4" />
      case "lease":
        return <FileText className="h-4 w-4" />
      default:
        return <Home className="h-4 w-4" />
    }
  }

  const getEntityLabel = (type: string) => {
    switch (type) {
      case "property":
        return "Propriété"
      case "tenant":
        return "Locataire"
      case "owner":
        return "Propriétaire"
      case "lease":
        return "Bail"
      default:
        return "Entité"
    }
  }

  const onSubmit = async (values: LinkFormValues) => {
    if (!currentEntity || !selectedLinkType) return
    
    // Si c'est un bail, utiliser l'API lease_relationships
    if (currentEntity.type === 'lease') {
      try {
        // Construire les métadonnées selon le type
        const metadata: Record<string, any> = {}
        
        if (selectedLinkType === 'owner') {
          if (values.percentage !== undefined) metadata.percentage = values.percentage
          if (values.is_main_owner !== undefined) metadata.is_main_owner = values.is_main_owner
        } else if (selectedLinkType === 'tenant') {
          if (values.is_main_tenant !== undefined) metadata.is_main_tenant = values.is_main_tenant
        }
        
        const result = await createRelationship({
          lease_id: currentEntity.id,
          entity_type: selectedLinkType as 'owner' | 'tenant' | 'property',
          entity_id: values.linkEntityId,
          metadata
        })
        
        if (result.success) {
          toast({
            title: "Liaison créée",
            description: "La liaison a été créée avec succès",
          })
          
          if (onLinkCreated) {
            onLinkCreated({
              id: result.data?.id || Date.now().toString(),
              from: { type: currentEntity.type, id: currentEntity.id, name: currentEntity.name },
              to: { type: selectedLinkType, id: values.linkEntityId },
              metadata,
              createdAt: new Date().toISOString(),
            })
          }
        } else {
          toast({
            title: "Erreur",
            description: result.error || "Erreur lors de la création de la liaison",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la création de la liaison",
          variant: "destructive",
        })
      }
    } else {
      // Pour les autres types, utiliser le callback
      if (onLinkCreated) {
        onLinkCreated({
          id: Date.now().toString(),
          from: { type: currentEntity.type, id: currentEntity.id, name: currentEntity.name },
          to: { type: selectedLinkType, id: values.linkEntityId },
          createdAt: new Date().toISOString(),
        })
      }
    }
    
    setIsDialogOpen(false)
    setSelectedLinkType(null)
    setSearchQuery("")
    form.reset()
  }

  const handleRemoveLink = async (linkId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette liaison ?")) return
    
    // Si c'est un bail, utiliser l'API lease_relationships
    if (currentEntity?.type === 'lease') {
      try {
        const result = await terminateRelationship(linkId)
        
        if (result.success) {
          toast({
            title: "Liaison supprimée",
            description: "La liaison a été supprimée avec succès",
          })
          
          if (onLinkRemoved) {
            onLinkRemoved(linkId)
          }
        } else {
          toast({
            title: "Erreur",
            description: result.error || "Erreur lors de la suppression",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de la liaison",
          variant: "destructive",
        })
      }
    } else {
      if (onLinkRemoved) {
        onLinkRemoved(linkId)
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Liaisons
              </CardTitle>
              <CardDescription>
                Gérez les liens entre propriétaires, locataires, propriétés et baux
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle liaison
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-none max-w-none w-auto">
                <DialogHeader>
                  <DialogTitle>Créer une liaison</DialogTitle>
                  <DialogDescription>
                    Sélectionnez le type d'entité à lier, puis choisissez l'entité spécifique.
                  </DialogDescription>
                </DialogHeader>
                
                {!selectedLinkType ? (
                  // Étape 1 : Sélection du type de lien
                  <div className="space-y-4">
                    {currentEntity && (
                      <div className="p-3 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-1">Source :</p>
                        <div className="flex items-center gap-2">
                          {getEntityIcon(currentEntity.type)}
                          <span className="font-semibold">{currentEntity.name}</span>
                          <Badge variant="outline">{currentEntity.type}</Badge>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium mb-3">Quel type d'entité voulez-vous lier ?</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {getAvailableLinkTypes().map(type => (
                          <Button
                            key={type}
                            variant="outline"
                            onClick={() => handleLinkTypeSelect(type)}
                            className="w-full justify-start"
                          >
                            {getEntityIcon(type)}
                            <span className="ml-2">{getEntityLabel(type)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Étape 2 : Sélection de l'entité spécifique
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLinkType(null)
                            setSearchQuery("") // Réinitialiser la recherche
                          }}
                        >
                          ← Retour
                        </Button>
                        <span className="text-sm font-medium">
                          Lier à : {getEntityLabel(selectedLinkType)}
                        </span>
                      </div>

                      {hasEntities(selectedLinkType) ? (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="linkEntityId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sélectionner une entité</FormLabel>
                                <div className="space-y-2">
                                  <Input
                                    placeholder={`Rechercher ${getEntityLabel(selectedLinkType)}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                  />
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={`Sélectionner ${getEntityLabel(selectedLinkType)}`} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getEntityOptions(selectedLinkType).map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                      {getEntityOptions(selectedLinkType).length === 0 && searchQuery && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                          Aucun résultat pour "{searchQuery}"
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Métadonnées pour Owner */}
                          {selectedLinkType === 'owner' && currentEntity?.type === 'lease' && (
                            <>
                              <FormField
                                control={form.control}
                                name="percentage"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Pourcentage de propriété (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="50"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="is_main_owner"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4"
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Propriétaire principal</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {/* Métadonnées pour Tenant */}
                          {selectedLinkType === 'tenant' && currentEntity?.type === 'lease' && (
                            <FormField
                              control={form.control}
                              name="is_main_tenant"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Locataire principal</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg">
                          <div className="space-y-4">
                            {getEntityIcon(selectedLinkType)}
                            <div>
                              <p className="font-medium">Aucun {getEntityLabel(selectedLinkType)} existant</p>
                              <p className="text-sm text-muted-foreground">
                                Créez un {getEntityLabel(selectedLinkType)} pour pouvoir le lier
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleCreateEntity(selectedLinkType)}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Créer {getEntityLabel(selectedLinkType)}
                            </Button>
                          </div>
                        </div>
                      )}

                      {hasEntities(selectedLinkType) && (
                        <Button type="submit" className="w-full" disabled={!form.watch("linkEntityId")}>
                          <Link className="mr-2 h-4 w-4" />
                          Créer la liaison
                        </Button>
                      )}
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {requiredLinks.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2 text-sm">Liaisons requises :</h4>
              <div className="space-y-2">
                {requiredLinks.map((req, idx) => {
                  const count = getLinksCountByType(req.type)
                  const minCount = req.minCount || 1
                  const isMet = count >= minCount
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {getEntityIcon(req.type)}
                        {req.label}
                      </span>
                      <Badge variant={isMet ? "success" : "destructive"}>
                        {count}/{minCount}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              {!allRequirementsMet && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Toutes les liaisons requises doivent être créées
                </p>
              )}
            </div>
          )}

          {existingLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune liaison existante</p>
              <p className="text-sm">Créez des liens pour connecter les entités entre elles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {existingLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{getEntityLabel(link.from.type)}</span>
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getEntityLabel(link.to.type)} {link.to.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(link.id)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs de création d'entités */}
      <Dialog open={isCreatingEntity && entityTypeToCreate === "owner"} onOpenChange={(open) => !open && setIsCreatingEntity(false)}>
        <DialogContent className="max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau propriétaire</DialogTitle>
          </DialogHeader>
          <OwnerForm
            onSuccess={handleEntityCreated}
            onCancel={() => setIsCreatingEntity(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingEntity && entityTypeToCreate === "tenant"} onOpenChange={(open) => !open && setIsCreatingEntity(false)}>
        <DialogContent className="max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau locataire</DialogTitle>
          </DialogHeader>
          <TenantForm
            onSuccess={handleEntityCreated}
            onCancel={() => setIsCreatingEntity(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingEntity && entityTypeToCreate === "property"} onOpenChange={(open) => !open && setIsCreatingEntity(false)}>
        <DialogContent className="max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle propriété</DialogTitle>
          </DialogHeader>
          <PropertyForm
            onSuccess={handleEntityCreated}
            onCancel={() => setIsCreatingEntity(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingEntity && entityTypeToCreate === "lease"} onOpenChange={(open) => !open && setIsCreatingEntity(false)}>
        <DialogContent className="max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau bail</DialogTitle>
          </DialogHeader>
          <LeaseForm
            onSuccess={handleEntityCreated}
            onCancel={() => setIsCreatingEntity(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
