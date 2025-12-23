"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaseValidationForm } from "@/components/processing/lease-validation-form"
import { processingService } from "@/lib/services/processing-service"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { DocumentProcessing, ProcessingStatus, OCRProvider } from "@/lib/types/processing"
import { Document } from "@/lib/types/document"
import { PROCESSING_STATUS_LABELS, PROCESSING_STATUS_COLORS } from "@/lib/constants/processing"
import { Loader2, FileText, AlertCircle, CheckCircle2, PlayCircle } from "lucide-react"

export default function DocumentProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  const { currentOrganizationId } = useAuthStore()

  const [document, setDocument] = useState<Document | null>(null)
  const [processing, setProcessing] = useState<DocumentProcessing | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing_loading, setProcessingLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [documentId, currentOrganizationId])

  const loadData = async () => {
    if (!currentOrganizationId) return

    setLoading(true)
    setError(null)

    try {
      // Charger le document
      const doc = await documentService.getDocument(documentId, currentOrganizationId)
      setDocument(doc)

      // Charger le traitement s'il existe
      try {
        const proc = await processingService.getProcessingByDocument(documentId)
        setProcessing(proc)
      } catch (err) {
        // Pas encore de traitement
        setProcessing(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleStartProcessing = async () => {
    if (!currentOrganizationId) return

    setProcessingLoading(true)
    setError(null)

    try {
      const result = await processingService.processDocument({
        document_id: documentId,
        organization_id: currentOrganizationId,
        ocr_provider: OCRProvider.HYBRID,
      })

      setProcessing(result)

      // Polling pour vérifier le statut
      const pollInterval = setInterval(async () => {
        const updated = await processingService.getProcessing(result.id)
        setProcessing(updated)

        if (
          updated.status === ProcessingStatus.COMPLETED ||
          updated.status === ProcessingStatus.FAILED
        ) {
          clearInterval(pollInterval)
          setProcessingLoading(false)
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du traitement")
      setProcessingLoading(false)
    }
  }

  const handleValidate = async (validatedData: any) => {
    if (!currentOrganizationId || !processing) return

    setValidating(true)
    setError(null)

    try {
      const result = await processingService.validateAndCreate({
        processing_id: processing.id,
        organization_id: currentOrganizationId,
        validated_data: validatedData,
        create_entities: true,
      })

      if (result.errors.length > 0) {
        setError(`Erreurs: ${result.errors.join(", ")}`)
      } else {
        // Rediriger vers le bail créé
        if (result.lease_id) {
          router.push(`/dashboard/leases/${result.lease_id}`)
        } else {
          router.push("/dashboard/documents")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la validation")
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Document non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Traitement du document</h1>
        <p className="text-muted-foreground mt-1">{document.title}</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
          {error}
        </div>
      )}

      {!processing ? (
        <Card>
          <CardHeader>
            <CardTitle>Démarrer l'extraction</CardTitle>
            <CardDescription>
              Lancer l'OCR et le parsing automatique de ce document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartProcessing} disabled={processing_loading}>
              {processing_loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Démarrer le traitement
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Statut du traitement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className={`text-lg font-semibold ${
                    PROCESSING_STATUS_COLORS[processing.status]
                  }`}
                >
                  {PROCESSING_STATUS_LABELS[processing.status]}
                </div>
                {processing.status === ProcessingStatus.PROCESSING && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {processing.status === ProcessingStatus.COMPLETED && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résultat OCR */}
          {processing.ocr_result && (
            <Card>
              <CardHeader>
                <CardTitle>Résultat OCR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Langue:</span>{" "}
                    <span className="font-medium">{processing.ocr_result.language}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pages:</span>{" "}
                    <span className="font-medium">{processing.ocr_result.page_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="font-medium">
                      {processing.ocr_result.is_scanned ? "PDF scanné" : "PDF natif"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confiance OCR:</span>{" "}
                    <span className="font-medium">
                      {(processing.ocr_result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Voir le texte extrait
                  </summary>
                  <pre className="mt-2 p-4 bg-secondary rounded-md text-xs overflow-auto max-h-96">
                    {processing.ocr_result.text}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Formulaire de validation */}
          {processing.status === ProcessingStatus.COMPLETED && processing.parsed_lease && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Valider les données extraites</h2>
              <LeaseValidationForm
                parsedLease={processing.parsed_lease}
                onValidate={handleValidate}
                onCancel={() => router.push("/dashboard/documents")}
                loading={validating}
              />
            </div>
          )}

          {processing.status === ProcessingStatus.FAILED && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium">Échec du traitement</p>
                  <p className="text-sm mt-2">{processing.error_message}</p>
                  <Button
                    onClick={handleStartProcessing}
                    variant="outline"
                    className="mt-4"
                  >
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
