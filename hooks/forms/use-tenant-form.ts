"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { tenantSchema, type TenantFormValues } from "@/lib/validations/tenant.validation"
import { tenantService } from "@/services/tenant.service"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useToast } from "@/hooks/use-toast"
import type { Tenant } from "@/types/tenant"

interface UseTenantFormOptions {
  initialData?: Tenant
  onSuccess?: (tenant: Tenant) => void
  onError?: (error: string) => void
}

export function useTenantForm({ initialData, onSuccess, onError }: UseTenantFormOptions = {}) {
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      type: "individual",
      email: "",
      references: [],
      guarantors: [],
    },
  })

  const handleSubmit = async (data: TenantFormValues) => {
    if (!currentOrganization?.id) {
      toast({
        title: "Erreur",
        description: "Organisation non trouvée",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      let result
      if (initialData?.id) {
        result = await tenantService.update(initialData.id, data)
      } else {
        result = await tenantService.create(currentOrganization.id, data)
      }

      if (result.success && result.data) {
        const name = data.type === 'individual' 
          ? `${data.first_name} ${data.last_name}`
          : data.company_name
        
        toast({
          title: initialData ? "Locataire mis à jour" : "Locataire créé",
          description: `${name} a été ${initialData ? 'mis à jour' : 'créé'} avec succès`,
        })
        onSuccess?.(result.data)
      } else {
        throw new Error(result.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const formData = form.getValues()
      localStorage.setItem('tenant_draft', JSON.stringify(formData))
      
      toast({
        title: "Brouillon sauvegardé",
        description: "Vos modifications ont été sauvegardées localement",
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

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('tenant_draft')
      if (draft) {
        const data = JSON.parse(draft)
        Object.keys(data).forEach((key) => {
          form.setValue(key as keyof TenantFormValues, data[key])
        })
        toast({
          title: "Brouillon chargé",
          description: "Vos modifications précédentes ont été restaurées",
        })
      }
    } catch (error) {
      console.error("Error loading draft:", error)
    }
  }

  const clearDraft = () => {
    localStorage.removeItem('tenant_draft')
  }

  return {
    form,
    isSubmitting,
    isSaving,
    handleSubmit,
    handleSaveDraft,
    loadDraft,
    clearDraft,
  }
}
