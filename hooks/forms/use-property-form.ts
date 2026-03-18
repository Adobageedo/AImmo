"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { propertySchema, type PropertyFormValues } from "@/lib/validations/property.validation"
import { propertyService } from "@/services/property.service"
import { useToast } from "@/hooks/use-toast"
import type { Property } from "@/types/property"

interface UsePropertyFormProps {
  initialData?: Property
  onSuccess?: (property: Property) => void
}

export function usePropertyForm({ initialData, onSuccess }: UsePropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData || {
      name: "",
      type: "residential",
      status: "available",
      address: "",
      city: "",
      postal_code: "",
      country: "France",
      surface: 0,
      rooms: 1,
      bathrooms: 0,
      estimated_value: 0,
      purchase_price: 0,
      purchase_date: "",
      description: "",
      features: [],
    },
  })

  const handleSubmit = async (values: PropertyFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Pour l'instant, nous allons utiliser une approche simplifiée
      // En production, il faudrait passer l'organizationId depuis le contexte
      const response = initialData
        ? await propertyService.update(initialData.id, values)
        : await propertyService.create("", values)

      if (response.success && response.data) {
        toast({
          title: initialData ? "Propriété mise à jour" : "Propriété créée",
          description: `La propriété a été ${initialData ? "mise à jour" : "créée"} avec succès.`,
        })
        
        if (onSuccess) {
          onSuccess(response.data)
        }
      } else {
        toast({
          title: "Erreur",
          description: response.error || "Une erreur est survenue.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    const values = form.getValues()
    localStorage.setItem("property-form-draft", JSON.stringify(values))
    toast({
      title: "Brouillon sauvegardé",
      description: "Le formulaire a été sauvegardé localement.",
    })
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  const loadDraft = () => {
    const draft = localStorage.getItem("property-form-draft")
    if (draft) {
      try {
        const values = JSON.parse(draft)
        form.reset(values)
        toast({
          title: "Brouillon chargé",
          description: "Le brouillon a été restauré.",
        })
      } catch (error) {
        console.error("Erreur lors du chargement du brouillon:", error)
      }
    }
  }

  const validateStep = async (step: number) => {
    let fieldsToValidate: string[] = []
    
    switch (step) {
      case 1:
        fieldsToValidate = ['name', 'type', 'status']
        break
      case 2:
        fieldsToValidate = ['address', 'city', 'postal_code', 'country']
        break
      case 3:
        fieldsToValidate = ['surface', 'rooms', 'estimated_value', 'purchase_price', 'purchase_date']
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
  }
}
