"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { LeaseDocumentService } from "@/lib/services/lease-document-service"
import { useOrganizationContext } from "@/context/OrganizationContext"
import type { LeaseDocumentExtraction } from "@/types/lease-document"

interface LeaseUploadCompactProps {
  onExtractionComplete?: (extraction: LeaseDocumentExtraction) => void
  onFieldsUpdate?: (fields: Partial<any>) => void
}

export function LeaseUploadCompact({ onExtractionComplete, onFieldsUpdate }: LeaseUploadCompactProps) {
  const { currentOrganization } = useOrganizationContext()
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracting' | 'completed' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<LeaseDocumentExtraction | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processingFile, setProcessingFile] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('📁 Files dropped:', acceptedFiles.length, 'files')
    console.log('🏢 Current organization:', currentOrganization?.id)
    
    // Continue even without organization - use default org ID for demo
    const orgId = currentOrganization?.id || 'demo-org'
    console.log('🎯 Using org ID:', orgId)
    
    // Add files to selected files
    const newFiles = acceptedFiles.filter(file => 
      !selectedFiles.some(f => f.name === file.name && f.size === file.size)
    )
    
    console.log('✅ Adding files:', newFiles.map(f => f.name))
    setSelectedFiles(prev => [...prev, ...newFiles])
    setError(null)
  }, [currentOrganization, selectedFiles]);

  const processFile = useCallback(async (file: File) => {
    const orgId = currentOrganization?.id || 'demo-org'
    console.log('🚀 Processing file:', file.name, 'with org:', orgId)

    setProcessingFile(file.name)
    setError(null)
    setStatus('uploading')
    setUploading(true)
    setProgress(10)

    try {
      // Upload file
      const uploadResponse = await LeaseDocumentService.uploadLeaseDocument(file, orgId)
      setProgress(30)
      
      // Start polling for extraction
      setStatus('extracting')
      setExtracting(true)
      setProgress(40)

      const pollExtraction = async () => {
        try {
          const extractionResult = await LeaseDocumentService.getExtraction(uploadResponse.extraction.id)
          
          if (extractionResult.status === 'completed') {
            setProgress(100)
            setStatus('completed')
            setExtraction(extractionResult)
            setUploading(false)
            setExtracting(false)
            setProcessingFile(null)

            // Update parent form with extracted data
            if (onFieldsUpdate && extractionResult.extracted_data) {
              const data = extractionResult.extracted_data
              onFieldsUpdate({
                lease_type: data.lease_type || 'residential',
                start_date: data.start_date || '',
                end_date: data.end_date || '',
                duration_months: data.duration_months || 12,
                monthly_rent: data.monthly_rent || 0,
                charges: data.charges || 0,
                deposit: data.deposit || 0,
                payment_day: data.payment_day || 5,
                indexation_clause: data.indexation_clause || false,
                notes: data.special_clauses?.join('\n') || ''
              })
            }

            if (onExtractionComplete) {
              onExtractionComplete(extractionResult)
            }
          } else if (extractionResult.status === 'failed') {
            throw new Error(extractionResult.error_message || 'Extraction failed')
          } else {
            // Still processing, continue polling
            setProgress(Math.min(90, 40 + (Date.now() - Date.now()) / 1000 * 5))
            setTimeout(pollExtraction, 2000)
          }
        } catch (err) {
          throw err
        }
      }

      setTimeout(pollExtraction, 1000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
      setUploading(false)
      setExtracting(false)
      setProcessingFile(null)
    }
  }, [currentOrganization, onExtractionComplete, onFieldsUpdate]);

  const handleUploadSelected = async () => {
    if (selectedFiles.length === 0) return
    
    // Process the first file (can be extended to process multiple)
    await processFile(selectedFiles[0])
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove))
    if (processingFile === fileToRemove.name) {
      setProcessingFile(null)
      setStatus('idle')
      setUploading(false)
      setExtracting(false)
    }
  };

  const handleReset = () => {
    setSelectedFiles([])
    setExtraction(null)
    setStatus('idle')
    setError(null)
    setProgress(0)
    setProcessingFile(null)
  };

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
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: uploading || extracting
  })

  if (status === 'completed' && extraction) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Document analysé avec succès ! {extraction.extracted_data?.confidence_score ? 
              `Confiance: ${Math.round(extraction.extracted_data.confidence_score * 100)}%` : 
              'Les champs ont été pré-remplis.'
            }
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFiles[0]?.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFiles[0]?.size || 0) / 1024 / 1024 < 1 ? 
                  `${Math.round((selectedFiles[0]?.size || 0) / 1024)} KB` : 
                  `${Math.round((selectedFiles[0]?.size || 0) / 1024 / 1024 * 10) / 10} MB`
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error || "Une erreur est survenue lors de l'analyse du document."}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size || 0) / 1024 / 1024 < 1 ? 
                      `${Math.round((file.size || 0) / 1024)} KB` : 
                      `${Math.round((file.size || 0) / 1024 / 1024 * 10) / 10} MB`
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input {...getInputProps()} />
            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Glissez-déposez un document ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, JPG, PNG, TIFF (max 10MB)
            </p>
          </div>
        </div>
      </div>
    )
  }

  if ((uploading || extracting) && processingFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">{processingFile}</p>
              <p className="text-xs text-blue-700">
                {uploading ? 'Upload en cours...' : 'Analyse du document...'}
              </p>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <p className="text-xs text-gray-500 text-center">
          {uploading ? 'Téléversement du fichier...' : 'Extraction des données avec IA...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-gray-500 hover:text-red-600"
            >
              Tout supprimer
            </Button>
          </div>
          
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size || 0) / 1024 / 1024 < 1 ? 
                      `${Math.round((file.size || 0) / 1024)} KB` : 
                      `${Math.round((file.size || 0) / 1024 / 1024 * 10) / 10} MB`
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            onClick={handleUploadSelected}
            disabled={uploading || extracting}
            className="w-full"
          >
            {uploading || extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Analyser {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive 
            ? 'Lâchez les fichiers ici...' 
            : 'Glissez-déposez des baux ou cliquez pour sélectionner'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, Word, JPG, PNG, TIFF (max 10MB par fichier)
        </p>
        <p className="text-xs text-blue-600 mt-2 font-medium">
          🚀 Analyse automatique avec IA
        </p>
      </div>
    </div>
  )
}
