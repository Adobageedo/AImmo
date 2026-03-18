"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FormLayout } from "../shared/form-layout"
import { FormSection } from "../shared/form-section"
import { FormActions } from "../shared/form-actions"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePropertyForm } from "@/hooks/forms/use-property-form"
import { EntityLinker } from "../shared/entity-linker"
import { Plus, Trash2, Home, Building, Factory, Building2 } from "lucide-react"
import type { Property } from "@/types/property"

interface PropertyFormProps {
  initialData?: Property
  onSuccess?: (property: Property) => void
  onCancel?: () => void
}

export function PropertyForm({ initialData, onSuccess, onCancel }: PropertyFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)
  const [propertyLinks, setPropertyLinks] = useState<any[]>([])
  
  const {
    form,
    isSubmitting,
    isSaving,
    handleSubmit,
    handleSaveDraft,
    validateStep,
  } = usePropertyForm({
    initialData,
    onSuccess,
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

  const addFeature = () => {
    const currentFeatures = form.getValues("features") || []
    form.setValue("features", [...currentFeatures, ""])
  }

  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues("features") || []
    form.setValue("features", currentFeatures.filter((_, i) => i !== index))
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "residential":
        return <Home className="h-4 w-4" />
      case "commercial":
        return <Building className="h-4 w-4" />
      case "industrial":
        return <Factory className="h-4 w-4" />
      case "mixed":
        return <Building2 className="h-4 w-4" />
      default:
        return <Home className="h-4 w-4" />
    }
  }

  return (
    <FormLayout
      title={initialData ? "Modifier la propriété" : "Nouvelle propriété"}
      description="Renseignez les informations de la propriété"
      currentStep={currentStep}
      totalSteps={totalSteps}
      status={initialData ? "in_progress" : "draft"}
      stepWidths={["max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-4xl"]}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <FormSection
              title="Informations générales"
              description="Informations de base de la propriété"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la propriété *</FormLabel>
                    <FormControl>
                      <Input placeholder="Appartement Paris Centre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de propriété *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              Résidentiel
                            </div>
                          </SelectItem>
                          <SelectItem value="commercial">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Commercial
                            </div>
                          </SelectItem>
                          <SelectItem value="industrial">
                            <div className="flex items-center gap-2">
                              <Factory className="h-4 w-4" />
                              Industriel
                            </div>
                          </SelectItem>
                          <SelectItem value="mixed">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Mixte
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Disponible</SelectItem>
                          <SelectItem value="rented">Loué</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="sold">Vendu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description détaillée de la propriété..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <FormSection
              title="Adresse"
              description="Localisation de la propriété"
            >
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Rue de la Paix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal *</FormLabel>
                      <FormControl>
                        <Input placeholder="75001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays *</FormLabel>
                      <FormControl>
                        <Input placeholder="France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 3: Details & Financial */}
          {currentStep === 3 && (
            <>
              <FormSection
                title="Caractéristiques"
                description="Détails techniques de la propriété"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="surface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface (m²) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="75" 
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
                    name="rooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de pièces *</FormLabel>
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
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salles de bain</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Caractéristiques additionnelles</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {(form.watch("features") || []).map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`features.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Ex: Balcon, Parking, Cave..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </FormSection>

              <FormSection
                title="Informations financières"
                description="Données financières de la propriété"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur estimée (€) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="250000" 
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
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d'achat (€) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="200000" 
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
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'achat *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>
            </>
          )}

          {/* Step 4: Entity Links */}
          {currentStep === 4 && (
            <FormSection
              title="Propriétaire"
              description="Associez un propriétaire à cette propriété (obligatoire)"
            >
              <EntityLinker
                currentEntity={createdPropertyId ? {
                  type: "property",
                  id: createdPropertyId,
                  name: form.getValues("name"),
                } : undefined}
                onLinkCreated={(link) => {
                  setPropertyLinks([...propertyLinks, link])
                }}
                onLinkRemoved={(linkId) => {
                  setPropertyLinks(propertyLinks.filter(l => l.id !== linkId))
                }}
                existingLinks={propertyLinks}
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
                onSubmit={() => {}}
                isSubmitting={isSubmitting}
                isSaving={isSaving}
                submitLabel={initialData ? "Mettre à jour" : "Créer la propriété"}
              />
            )}
          </div>
        </form>
      </Form>
    </FormLayout>
  )
}
