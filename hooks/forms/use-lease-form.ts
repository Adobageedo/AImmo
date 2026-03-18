"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leaseSchema, type LeaseFormValues } from "@/lib/validations/lease.validation"
import { leaseService } from "@/services/lease.service"
import { propertyService } from "@/services/property.service"
import { ownerService } from "@/services/owner.service"
import { tenantService } from "@/services/tenant.service"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useToast } from "@/hooks/use-toast"
import type { Lease } from "@/types/lease"

interface UseLeaseFormOptions {
  initialData?: Lease
  onSuccess?: (lease: Lease) => void
  onError?: (error: string) => void
  entityData?: {
    property?: any
    owner?: any
    tenant?: any
  }
}

export function useLeaseForm({ initialData, onSuccess, onError }: UseLeaseFormOptions = {}) {
  const { currentOrganization } = useOrganizationContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: initialData || {
      property_id: "",
      owner_ids: [],
      tenant_ids: [],
      lease_type: "residential",
      start_date: "",
      end_date: "",
      duration_months: 12,
      monthly_rent: 0,
      charges: 0,
      deposit: 0,
      payment_day: 1,
      payment_frequency: "monthly",
      indexation_clause: false,
      renewal_automatic: false,
      special_clauses: [],
    },
  })

  const handleSubmit = async (data: LeaseFormValues) => {
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
        result = await leaseService.update(initialData.id, data)
      } else {
        result = await leaseService.create(currentOrganization.id, data)
      }

      if (result.success && result.data) {
        toast({
          title: initialData ? "Bail mis à jour" : "Bail créé",
          description: `Le bail a été ${initialData ? 'mis à jour' : 'créé'} avec succès`,
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
      localStorage.setItem('lease_draft', JSON.stringify(formData))
      
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
      const draft = localStorage.getItem('lease_draft')
      if (draft) {
        const data = JSON.parse(draft)
        Object.keys(data).forEach((key) => {
          form.setValue(key as keyof LeaseFormValues, data[key])
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
    localStorage.removeItem('lease_draft')
  }

  const validateStep = async (step: number) => {
    let fieldsToValidate: string[] = []
    
    switch (step) {
      case 1:
        fieldsToValidate = ['lease_type', 'start_date', 'end_date', 'duration_months']
        break
      case 2:
        fieldsToValidate = ['monthly_rent', 'charges', 'deposit', 'payment_day', 'payment_frequency']
        break
      case 3:
        fieldsToValidate = ['indexation_clause', 'renewal_automatic']
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
    clearDraft,
    validateStep,
  }
}
