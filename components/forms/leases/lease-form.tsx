"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { FormLayout } from "../shared/form-layout"
import { FormSection } from "../shared/form-section"
import { FormActions } from "../shared/form-actions"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useLeaseForm } from "@/hooks/forms/use-lease-form"
import { EntityLinker } from "../shared/entity-linker"
import { LeaseUploadCompact } from "@/components/lease-document/lease-upload-compact"
import { FileText } from "lucide-react"
import type { Lease } from "@/types/lease"
import type { LeaseDocumentExtraction } from "@/types/lease-document"
import type { PropertyType } from "@/types/property"
import { propertyService } from "@/services/property.service"
import { ownerService } from "@/services/owner.service"
import { tenantService } from "@/services/tenant.service"
import { leaseRelationshipService } from "@/services/lease-relationship.service"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useToast } from "@/hooks/use-toast"

interface LeaseFormProps {
  initialData?: Lease
  onSuccess?: (lease: Lease) => void
  onCancel?: () => void
}

export function LeaseForm({ initialData, onSuccess, onCancel }: LeaseFormProps) {
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [createdLeaseId, setCreatedLeaseId] = useState<string | null>(null)
  const [leaseLinks, setLeaseLinks] = useState<any[]>([])
  const [extractedEntityData, setExtractedEntityData] = useState<{
    property?: any
    owner?: any
    tenant?: any
  }>({})
  const [isCreatingEntities, setIsCreatingEntities] = useState(false)
  const pendingRelationshipsRef = useRef<{
    propertyId: string
    ownerIds: string[]
    tenantIds: string[]
  } | null>(null)
  
  const {
    form,
    isSubmitting,
    isSaving,
    handleSubmit: originalHandleSubmit,
    handleSaveDraft,
    validateStep,
  } = useLeaseForm({
    initialData,
    onSuccess: async (lease) => {
      // Si on a des relations en attente, les créer maintenant
      if (pendingRelationshipsRef.current && currentOrganization?.id) {
        try {
          const relationshipsResult = await leaseRelationshipService.createBulk(
            currentOrganization.id,
            lease.id,
            {
              property_id: pendingRelationshipsRef.current.propertyId,
              owners: pendingRelationshipsRef.current.ownerIds.map((id: string, index: number) => ({
                id,
                percentage: pendingRelationshipsRef.current!.ownerIds.length === 1 ? 100 : undefined,
                is_main_owner: index === 0
              })),
              tenants: pendingRelationshipsRef.current.tenantIds.map((id: string, index: number) => ({
                id,
                is_main_tenant: index === 0
              }))
            }
          )
          
          
          if (!relationshipsResult.success) {
            toast({
              title: "Avertissement",
              description: "Le bail a été créé mais les relations n'ont pas pu être établies",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Succès",
              description: "Le bail et ses relations ont été créés avec succès",
            })
          }
        } catch (error) {
          toast({
            title: "Avertissement",
            description: "Le bail a été créé mais une erreur est survenue lors de la création des relations",
            variant: "destructive",
          })
        } finally {
          pendingRelationshipsRef.current = null
        }
      }
      
      if (onSuccess) {
        onSuccess(lease)
        if (!initialData) {
          setCreatedLeaseId(lease.id)
          setCurrentStep(4)
        }
      }
    },
  })

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmit = async (data: any) => {
    if (!currentOrganization?.id) {
      toast({
        title: "Erreur",
        description: "Organisation non trouvée",
        variant: "destructive",
      })
      return
    }

    setIsCreatingEntities(true)
    
    try {
      let propertyId = data.property_id
      let ownerIds = data.owner_ids || []
      let tenantIds = data.tenant_ids || []

      // Create entities from AI extraction if needed
      if (leaseLinks.length > 0 && Object.keys(extractedEntityData).length > 0) {
        
        for (const link of leaseLinks) {
          if (link.action === 'create' && link.data) {
            const entityType = link.to.type
            
            if (entityType === 'property' && extractedEntityData.property) {
              
              // Map French property types to English valid types
              const mapPropertyType = (type: string): PropertyType => {
                const typeMap: Record<string, PropertyType> = {
                  'appartement': 'residential',
                  'maison': 'residential',
                  'studio': 'residential',
                  'villa': 'residential',
                  'bureau': 'commercial',
                  'commerce': 'commercial',
                  'entrepôt': 'industrial',
                  'mixte': 'mixed'
                }
                return typeMap[type?.toLowerCase()] || 'residential'
              }
              
              const propertyData = {
                name: extractedEntityData.property.address || 'Propriété',
                address: extractedEntityData.property.address || '',
                city: extractedEntityData.property.city || '',
                postal_code: extractedEntityData.property.postal_code || '',
                country: 'France',
                type: mapPropertyType(extractedEntityData.property.type || ''),
                surface: extractedEntityData.property.surface || 0,
                estimated_value: 0,
              }
              
              const result = await propertyService.create(currentOrganization.id, propertyData)
              if (result.success && result.data) {
                propertyId = result.data.id
              } else {
                throw new Error('Failed to create property')
              }
            }
            
            if (entityType === 'owner' && extractedEntityData.owner) {
              const nameParts = (extractedEntityData.owner.name || 'Propriétaire').split(' ')
              
              // Extract city and postal_code from address if not provided separately
              let city = extractedEntityData.owner.city || ''
              let postalCode = extractedEntityData.owner.postal_code || ''
              
              if (!city && !postalCode && extractedEntityData.owner.address) {
                // Try to extract from address like "123 Rue de la République, 75001 Paris"
                const addressParts = extractedEntityData.owner.address.split(',').map((p: string) => p.trim())
                if (addressParts.length > 1) {
                  const lastPart = addressParts[addressParts.length - 1]
                  const postalMatch = lastPart.match(/(\d{5})\s+(.+)/)
                  if (postalMatch) {
                    postalCode = postalMatch[1]
                    city = postalMatch[2]
                  }
                }
              }
              
              const ownerData = {
                first_name: nameParts[0] || 'Propriétaire',
                last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Inconnu',
                email: extractedEntityData.owner.email || 'noemail@example.com',
                phone: extractedEntityData.owner.phone || '',
                address: extractedEntityData.owner.address || '',
                city: city,
                postal_code: postalCode,
                country: 'France',
              }
              
              const result = await ownerService.create(currentOrganization.id, ownerData)
              if (result.success && result.data) {
                ownerIds.push(result.data.id)
              } else {
                throw new Error('Failed to create owner')
              }
            }
            
            if (entityType === 'tenant' && extractedEntityData.tenant) {
              const nameParts = (extractedEntityData.tenant.name || 'Locataire').split(' ')
              
              // Extract city and postal_code from address if not provided separately
              let city = extractedEntityData.tenant.city || ''
              let postalCode = extractedEntityData.tenant.postal_code || ''
              
              if (!city && !postalCode && extractedEntityData.tenant.address) {
                // Try to extract from address like "456 Avenue des Champs-Élysées, 75008 Paris"
                const addressParts = extractedEntityData.tenant.address.split(',').map((p: string) => p.trim())
                if (addressParts.length > 1) {
                  const lastPart = addressParts[addressParts.length - 1]
                  const postalMatch = lastPart.match(/(\d{5})\s+(.+)/)
                  if (postalMatch) {
                    postalCode = postalMatch[1]
                    city = postalMatch[2]
                  }
                }
              }
              
              const tenantData = {
                type: 'individual' as const,
                first_name: nameParts[0] || 'Locataire',
                last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Inconnu',
                email: extractedEntityData.tenant.email || 'noemail@example.com',
                phone: extractedEntityData.tenant.phone || '',
                address: extractedEntityData.tenant.address || '',
                city: city,
                postal_code: postalCode,
                country: 'France',
              }
              
              const result = await tenantService.create(currentOrganization.id, tenantData)
              if (result.success && result.data) {
                tenantIds.push(result.data.id)
              } else {
                throw new Error('Failed to create tenant')
              }
            }
          }
        }
      }

      // Stocker les relations en attente pour les créer après le bail
      if (propertyId && ownerIds.length > 0 && tenantIds.length > 0) {
        pendingRelationshipsRef.current = {
          propertyId,
          ownerIds,
          tenantIds
        }
      }

      // Créer le bail SANS les relations (nouveau système)
      const leaseData = {
        ...data,
        // ❌ NE PLUS ENVOYER property_id, owner_ids, tenant_ids
      }
      
      // Supprimer les champs de relation de l'ancien système
      delete leaseData.property_id
      delete leaseData.owner_ids
      delete leaseData.tenant_ids

      // Créer le bail (les relations seront créées dans onSuccess)
      await originalHandleSubmit(leaseData)

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création du bail",
        variant: "destructive",
      })
    } finally {
      setIsCreatingEntities(false)
    }
  }

  const handleFormSubmit = async () => {
    // First, check if we need to create entities from AI data
    if (leaseLinks.length > 0 && Object.keys(extractedEntityData).length > 0) {
      // Don't validate yet - create entities first
      await handleSubmit(form.getValues())
    } else {
      // Normal validation and submit
      const isValid = await form.trigger()
      
      if (isValid) {
        const formData = form.getValues()
        await handleSubmit(formData)
      }
    }
  }

  const handleFieldsUpdate = (fields: Partial<any>) => {
    // Update form with extracted data
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        form.setValue(key as any, value)
      }
    })
  }

  const handleExtractionComplete = (extraction: LeaseDocumentExtraction) => {
    // Store entity data for creation
    const entityData: any = {}
    
    // Process entity matches and create suggested links
    const suggestedLinks: any[] = []
    
    if (extraction.entity_matches) {
      const { property, owner, tenant } = extraction.entity_matches
      
      // Add property suggestion
      if (property) {
        entityData.property = property.extracted_data
        suggestedLinks.push({
          id: `property-${Date.now()}`,
          from: { 
            type: 'lease' as const, 
            id: createdLeaseId || 'temp-lease', 
            name: `Bail ${form.getValues("lease_type") || 'Nouveau bail'}` 
          },
          to: { 
            type: 'property' as const, 
            id: property.existing_id || `new-property-${Date.now()}`,
            name: property.existing_name || `${property.extracted_data?.address || 'New Property'}` 
          },
          action: property.suggested_action,
          confidence: property.confidence,
          data: property.extracted_data,
          createdAt: new Date().toISOString()
        })
      }
      
      // Add owner suggestion
      if (owner) {
        entityData.owner = owner.extracted_data
        suggestedLinks.push({
          id: `owner-${Date.now()}`,
          from: { 
            type: 'lease' as const, 
            id: createdLeaseId || 'temp-lease', 
            name: `Bail ${form.getValues("lease_type") || 'Nouveau bail'}` 
          },
          to: { 
            type: 'owner' as const, 
            id: owner.existing_id || `new-owner-${Date.now()}`,
            name: owner.existing_name || `${owner.extracted_data?.name || 'New Owner'}` 
          },
          action: owner.suggested_action,
          confidence: owner.confidence,
          data: owner.extracted_data,
          createdAt: new Date().toISOString()
        })
      }
      
      // Add tenant suggestion
      if (tenant) {
        entityData.tenant = tenant.extracted_data
        suggestedLinks.push({
          id: `tenant-${Date.now()}`,
          from: { 
            type: 'lease' as const, 
            id: createdLeaseId || 'temp-lease', 
            name: `Bail ${form.getValues("lease_type") || 'Nouveau bail'}` 
          },
          to: { 
            type: 'tenant' as const, 
            id: tenant.existing_id || `new-tenant-${Date.now()}`,
            name: tenant.existing_name || `${tenant.extracted_data?.name || 'New Tenant'}` 
          },
          action: tenant.suggested_action,
          confidence: tenant.confidence,
          data: tenant.extracted_data,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    // Store entity data for later creation
    setExtractedEntityData(entityData)
    
    // Update lease links with AI suggestions
    if (suggestedLinks.length > 0) {
      setLeaseLinks(prev => [...prev, ...suggestedLinks])
    }
  }

  return (
    <FormLayout
      title={initialData ? "Modifier le bail" : "Nouveau bail"}
      description="Renseignez les informations du bail"
      currentStep={currentStep}
      totalSteps={totalSteps}
      status={initialData ? "in_progress" : "draft"}
      stepWidths={["max-w-3xl", "max-w-2xl", "max-w-3xl", "max-w-4xl"]}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <FormSection
              title="Informations générales"
              description="Type et dates du bail"
            >
              {/* Lease Upload Module */}
              <div className="mb-8">
                <LeaseUploadCompact 
                  onFieldsUpdate={handleFieldsUpdate}
                  onExtractionComplete={handleExtractionComplete}
                />
              </div>
              
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 mb-4">Ou remplissez manuellement les informations ci-dessous :</p>
              </div>
              <FormField
                control={form.control}
                name="lease_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de bail *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Résidentiel</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="furnished">Meublé</SelectItem>
                        <SelectItem value="unfurnished">Non meublé</SelectItem>
                        <SelectItem value="seasonal">Saisonnier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (mois) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="12" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 2: Financial Terms */}
          {currentStep === 2 && (
            <FormSection
              title="Conditions financières"
              description="Loyer, charges et dépôt de garantie"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyer mensuel (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1200" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charges (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="150" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dépôt de garantie (€) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1200" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jour de paiement *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="31"
                          placeholder="5" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Jour du mois (1-31)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fréquence de paiement *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                          <SelectItem value="quarterly">Trimestriel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 3: Terms & Conditions */}
          {currentStep === 3 && (
            <FormSection
              title="Conditions et clauses"
              description="Indexation, renouvellement et clauses spéciales"
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="indexation_clause"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Clause d'indexation</FormLabel>
                        <FormDescription>
                          Le loyer sera indexé selon l'indice de référence
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="renewal_automatic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Renouvellement automatique</FormLabel>
                        <FormDescription>
                          Le bail se renouvelle automatiquement à l'échéance
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="termination_notice_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préavis de résiliation (mois)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="3" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes et clauses spéciales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires, clauses spéciales..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 4: Entity Links (Required) */}
          {currentStep === 4 && (
            <FormSection
              title="Parties du bail"
              description="Associez le bail à une propriété, un propriétaire et un locataire (obligatoire)"
            >
              <EntityLinker
                currentEntity={createdLeaseId ? {
                  type: "lease",
                  id: createdLeaseId,
                  name: `Bail ${form.getValues("lease_type")}`,
                } : undefined}
                onLinkCreated={(link) => {
                  setLeaseLinks([...leaseLinks, link])
                }}
                onLinkRemoved={(linkId) => {
                  setLeaseLinks(leaseLinks.filter(l => l.id !== linkId))
                }}
                existingLinks={leaseLinks}
                requiredLinks={[]}
                mode="create"
              />
            </FormSection>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Étape précédente
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="ml-auto"
              >
                Étape suivante →
              </Button>
            ) : (
              <FormActions
                onCancel={handleCancel}
                onSave={handleSaveDraft}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting || isCreatingEntities}
                isSaving={isSaving}
                submitLabel={initialData ? "Mettre à jour" : "Créer le bail"}
              />
            )}
          </div>
        </form>
      </Form>
    </FormLayout>
  )
}
