"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Image, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { LeaseDocumentService } from '@/lib/services/lease-document-service'
import type { LeaseDocumentExtraction } from '@/types/lease-document'

interface LeaseDocumentUploaderProps {
  organizationId: string
  onExtractionComplete: (extraction: LeaseDocumentExtraction) => void
}

export function LeaseDocumentUploader({ organizationId, onExtractionComplete }: LeaseDocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setCurrentFile(file)
    setError(null)
    setUploading(true)
    setProgress(10)

    try {
      // Upload document
      const uploadResponse = await LeaseDocumentService.uploadLeaseDocument(file, organizationId)
      setProgress(30)
      setUploading(false)
      setProcessing(true)

      // Poll for extraction completion
      const extraction = await LeaseDocumentService.pollExtractionStatus(
        uploadResponse.extraction.id,
        (currentExtraction) => {
          // Update progress based on status
          if (currentExtraction.status === 'processing') {
            setProgress(50 + Math.random() * 30)
          }
        }
      )

      setProgress(100)
      setProcessing(false)
      onExtractionComplete(extraction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setUploading(false)
      setProcessing(false)
      setProgress(0)
    }
  }, [organizationId, onExtractionComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxFiles: 1,
    disabled: uploading || processing
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-8 w-8 text-red-500" />
    if (['doc', 'docx'].includes(ext || '')) return <FileType className="h-8 w-8 text-blue-500" />
    if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext || '')) return <Image className="h-8 w-8 text-green-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importer un bail</CardTitle>
        <CardDescription>
          Déposez un fichier PDF, Word ou image pour extraire automatiquement les informations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploading && !processing && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Déposez le fichier ici...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Glissez-déposez un fichier ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-muted-foreground">
                  Formats acceptés : PDF, Word (.doc, .docx), Images (.jpg, .png, .tiff)
                </p>
              </>
            )}
          </div>
        )}

        {(uploading || processing) && currentFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {getFileIcon(currentFile.name)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {processing && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {!processing && uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {uploading && 'Upload en cours...'}
                  {processing && 'Extraction des données...'}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {processing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Analyse du document en cours. Cela peut prendre quelques instants...
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
