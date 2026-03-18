"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ownerSchema, type OwnerFormValues } from "@/lib/validations/owner.validation"
import { ownerService } from "@/services/owner.service"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useToast } from "@/hooks/use-toast"
import type { Owner } from "@/types/owner"

interface UseOwnerFormOptions {
  initialData?: Owner
  onSuccess?: (owner: Owner) => void
  onError?: (error: string) => void
}

export function useOwnerForm({ initialData, onSuccess, onError }: UseOwnerFormOptions = {}) {
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSubmit = async (data: OwnerFormValues) => {
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
        result = await ownerService.update(currentOrganization.id, initialData.id, data)
      } else {
        result = await ownerService.create(currentOrganization.id, data)
      }

      if (result.success && result.data) {
        toast({
          title: initialData ? "Propriétaire mis à jour" : "Propriétaire créé",
          description: `${data.first_name} ${data.last_name} a été ${initialData ? 'mis à jour' : 'créé'} avec succès`,
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
      localStorage.setItem('owner_draft', JSON.stringify(formData))
      
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
      const draft = localStorage.getItem('owner_draft')
      if (draft) {
        const data = JSON.parse(draft)
        Object.keys(data).forEach((key) => {
          form.setValue(key as keyof OwnerFormValues, data[key])
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
    localStorage.removeItem('owner_draft')
  }

  const validateStep = async (step: number) => {
    let fieldsToValidate: string[] = []
    
    switch (step) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'email']
        break
      case 2:
        fieldsToValidate = ['address', 'city', 'postal_code', 'country']
        break
    }
    
    const result = await form.trigger(fieldsToValidate as any)
    return result
  }

  return {
    form,
    isSubmitting,
    isSaving,
    handleSubmit,
    handleSaveDraft,
    loadDraft,
    validateStep,
    clearDraft,
  }
}
