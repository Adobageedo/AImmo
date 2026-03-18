"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Save, X, Check } from "lucide-react"

interface FormActionsProps {
  onCancel: () => void
  onSave?: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  isSaving?: boolean
  submitLabel?: string
  saveLabel?: string
  cancelLabel?: string
  showSave?: boolean
  disabled?: boolean
  disableSubmit?: boolean
}

export function FormActions({
  onCancel,
  onSave,
  onSubmit,
  isSubmitting = false,
  isSaving = false,
  submitLabel = "Créer",
  saveLabel = "Sauvegarder brouillon",
  disableSubmit = false,
  cancelLabel = "Annuler",
  showSave = true,
  disabled = false
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting || isSaving}
      >
        <X className="mr-2 h-4 w-4" />
        {cancelLabel}
      </Button>

      <div className="flex items-center gap-3">
        {showSave && onSave && (
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={isSubmitting || isSaving || disabled}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveLabel}
              </>
            )}
          </Button>
        )}

        {onSubmit && (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isSaving || disabled || disableSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
