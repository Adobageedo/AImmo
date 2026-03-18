"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { FormLayout } from "../shared/form-layout"
import { FormSection } from "../shared/form-section"
import { FormActions } from "../shared/form-actions"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ownerSchema, type OwnerFormValues } from "@/lib/validations/owner.validation"
import { EntityLinker } from "../shared/entity-linker"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useToast } from "@/hooks/use-toast"
import type { Owner } from "@/types/owner"

interface OwnerFormProps {
  initialData?: Owner
  onSuccess?: (owner: Owner) => void
  onCancel?: () => void
}

export function OwnerForm({ initialData, onSuccess, onCancel }: OwnerFormProps) {
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [createdOwnerId, setCreatedOwnerId] = useState<string | null>(null)

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: initialData || {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      country: "France",
      preferred_contact_method: "email",
      preferred_language: "fr",
    },
  })

  const handleNextStep = async () => {
    let fieldsToValidate: string[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'email']
        break
      case 2:
        fieldsToValidate = ['address', 'city', 'postal_code', 'country']
        break
    }
    
    const result = await form.trigger(fieldsToValidate as any)
    if (result) {
      setCurrentStep(currentStep + 1)
    }
  }

  const onSubmit = async (data: OwnerFormValues) => {
    if (!currentOrganization?.id) return

    setIsSubmitting(true)
    try {
      // TODO: Call API to create/update owner
      toast({
        title: "Propriétaire créé",
        description: "Le propriétaire a été créé avec succès",
      })

      if (onSuccess) {
        onSuccess(data as Owner)
        // Si c'est une création, simuler un ID et passer à l'étape des liaisons
        if (!initialData) {
          const newId = Date.now().toString() // En production, utiliser l'ID retourné par l'API
          setCreatedOwnerId(newId)
          setCurrentStep(4)
        }
      } else {
        router.push("/properties")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du propriétaire",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // TODO: Save draft to localStorage or API
      const formData = form.getValues()
      localStorage.setItem('owner_draft', JSON.stringify(formData))
      
      toast({
        title: "Brouillon sauvegardé",
        description: "Vos modifications ont été sauvegardées",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le brouillon",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  
  return (
    <FormLayout
      title={initialData ? "Modifier le propriétaire" : "Nouveau propriétaire"}
      description="Renseignez les informations du propriétaire"
      currentStep={currentStep}
      totalSteps={totalSteps}
      status={initialData ? "in_progress" : "draft"}
      stepWidths={["max-w-xl", "max-w-xl", "max-w-2xl", "max-w-3xl"]}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <FormSection
              title="Informations personnelles"
              description="Informations de base du propriétaire"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jean.dupont@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone *</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationalité</FormLabel>
                      <FormControl>
                        <Input placeholder="Française" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <FormSection
              title="Adresse"
              description="Adresse principale du propriétaire"
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

          {/* Step 3: Entity Links */}
          {currentStep === 3 && createdOwnerId && (
            <FormSection
              title="Liaisons"
              description="Connectez ce propriétaire à des propriétés, locataires ou baux"
            >
              <EntityLinker
                currentEntity={{
                  type: "owner",
                  id: createdOwnerId,
                  name: `${form.getValues("first_name")} ${form.getValues("last_name")}`,
                }}
                onLinkCreated={(link) => {
                  toast({
                    title: "Liaison créée",
                    description: "La liaison a été créée avec succès.",
                  })
                }}
                onLinkRemoved={(linkId) => {
                  toast({
                    title: "Liaison supprimée",
                    description: "La liaison a été supprimée.",
                  })
                }}
                existingLinks={[]}
                requiredLinks={[]}
              />
            </FormSection>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Étape précédente
              </button>
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
                submitLabel={initialData ? "Mettre à jour" : "Créer le propriétaire"}
              />
            )}
          </div>
        </form>
      </Form>
    </FormLayout>
  )
}
