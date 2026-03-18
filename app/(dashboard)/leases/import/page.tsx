"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationContext } from '@/context/OrganizationContext'
import { LeaseDocumentUploader } from '@/components/lease-document/lease-document-uploader'
import { LeaseExtractionValidator } from '@/components/lease-document/lease-extraction-validator'
import type { LeaseDocumentExtraction } from '@/types/lease-document'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LeaseImportPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganizationContext()
  const [extraction, setExtraction] = useState<LeaseDocumentExtraction | null>(null)

  const handleExtractionComplete = (completedExtraction: LeaseDocumentExtraction) => {
    setExtraction(completedExtraction)
  }

  const handleValidationComplete = (leaseId: string) => {
    router.push(`/leases/${leaseId}`)
  }

  const handleCancel = () => {
    if (extraction) {
      setExtraction(null)
    } else {
      router.push('/leases')
    }
  }

  if (!currentOrganization) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {extraction ? 'Validation des données' : 'Importer un bail'}
          </h2>
          <p className="text-muted-foreground">
            {extraction 
              ? 'Vérifiez et corrigez les informations extraites du document'
              : 'Téléchargez un document de bail pour extraire automatiquement les informations'
            }
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {!extraction ? (
          <LeaseDocumentUploader
            organizationId={currentOrganization.id}
            onExtractionComplete={handleExtractionComplete}
          />
        ) : (
          <LeaseExtractionValidator
            extraction={extraction}
            onComplete={handleValidationComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}
