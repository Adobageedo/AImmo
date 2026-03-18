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
import { useTenantForm } from "@/hooks/forms/use-tenant-form"
import { EntityLinker } from "../shared/entity-linker"
import { Plus, Trash2, User, Briefcase, Users as UsersIcon } from "lucide-react"
import type { Tenant } from "@/types/tenant"

interface TenantFormProps {
  initialData?: Tenant
  onSuccess?: (tenant: Tenant) => void
  onCancel?: () => void
}

export function TenantForm({ initialData, onSuccess, onCancel }: TenantFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null)
  const [tenantLinks, setTenantLinks] = useState<any[]>([])
  
  const {
    form,
    isSubmitting,
    isSaving,
    handleSubmit,
    handleSaveDraft,
  } = useTenantForm({
    initialData,
    onSuccess: (tenant) => {
      if (onSuccess) {
        onSuccess(tenant)
        if (!initialData) {
          const newId = Date.now().toString()
          setCreatedTenantId(newId)
          setCurrentStep(currentStep + 1)
        }
      }
    },
  })

  const tenantType = form.watch("type")
  const totalSteps = tenantType === "individual" ? 5 : 4

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  
  const addGuarantor = () => {
    const currentGuarantors = form.getValues("guarantors") || []
    form.setValue("guarantors", [
      ...currentGuarantors,
      {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
        country: "France",
        relationship: "",
      }
    ])
  }

  const removeGuarantor = (index: number) => {
    const currentGuarantors = form.getValues("guarantors") || []
    form.setValue("guarantors", currentGuarantors.filter((_, i) => i !== index))
  }

  return (
    <FormLayout
      title={initialData ? "Modifier le locataire" : "Nouveau locataire"}
      description="Renseignez les informations du locataire"
      currentStep={currentStep}
      totalSteps={totalSteps}
      status={initialData ? "in_progress" : "draft"}
      stepWidths={["max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-3xl", "max-w-4xl"]}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* Step 1: Type & Personal Info */}
          {currentStep === 1 && (
            <FormSection
              title="Type et informations personnelles"
              description="Informations de base du locataire"
            >
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de locataire *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Particulier
                          </div>
                        </SelectItem>
                        <SelectItem value="company">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Entreprise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tenantType === "individual" ? (
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
              ) : (
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise *</FormLabel>
                      <FormControl>
                        <Input placeholder="SARL Exemple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@email.com" {...field} />
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
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" {...field} />
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
              description="Adresse actuelle du locataire"
            >
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
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
                      <FormLabel>Code postal</FormLabel>
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
                      <FormLabel>Ville</FormLabel>
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
                      <FormLabel>Pays</FormLabel>
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

          {/* Step 3: Employment (Individual only) */}
          {currentStep === 3 && tenantType === "individual" && (
            <FormSection
              title="Informations professionnelles"
              description="Situation professionnelle du locataire"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employment.employer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employeur</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <FormControl>
                        <Input placeholder="Développeur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment.contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cdi">CDI</SelectItem>
                          <SelectItem value="cdd">CDD</SelectItem>
                          <SelectItem value="interim">Intérim</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="retired">Retraité</SelectItem>
                          <SelectItem value="student">Étudiant</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment.start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment.monthly_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire mensuel (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2500" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          )}

          {/* Step 4: Guarantors (Individual only) or Step 3: Notes (Company) */}
          {((currentStep === 4 && tenantType === "individual") || (currentStep === 3 && tenantType === "company")) && (
            <>
              {tenantType === "individual" && (
                <FormSection
                  title="Garants"
                  description="Personnes se portant garant pour le locataire"
                >
                  <div className="space-y-4">
                    {(form.watch("guarantors") || []).map((_, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <UsersIcon className="h-4 w-4" />
                              Garant {index + 1}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGuarantor(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`guarantors.${index}.first_name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Prénom</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`guarantors.${index}.last_name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`guarantors.${index}.email`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`guarantors.${index}.phone`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Téléphone</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`guarantors.${index}.relationship`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Lien avec le locataire</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Parent, ami, etc." {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addGuarantor}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un garant
                    </Button>
                  </div>
                </FormSection>
              )}

              <FormSection
                title="Notes"
                description="Informations complémentaires"
              >
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            </>
          )}

          {/* Step 5 (Individual) or Step 4 (Company): Entity Links (Optional) */}
          {((currentStep === 5 && tenantType === "individual") || (currentStep === 4 && tenantType === "company")) && createdTenantId && (
            <FormSection
              title="Liaisons (optionnel)"
              description="Vous pouvez associer ce locataire à des propriétés ou baux"
            >
              <EntityLinker
                currentEntity={{
                  type: "tenant",
                  id: createdTenantId,
                  name: tenantType === "company" 
                    ? form.getValues("company_name") || ""
                    : `${form.getValues("first_name")} ${form.getValues("last_name")}`,
                }}
                onLinkCreated={(link) => {
                  setTenantLinks([...tenantLinks, link])
                }}
                onLinkRemoved={(linkId) => {
                  setTenantLinks(tenantLinks.filter(l => l.id !== linkId))
                }}
                existingLinks={tenantLinks}
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
                onClick={() => setCurrentStep(currentStep + 1)}
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
                submitLabel={initialData ? "Mettre à jour" : "Créer le locataire"}
              />
            )}
          </div>
        </form>
      </Form>
    </FormLayout>
  )
}
