"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, FileText, X, Plus, FileCode, AlertCircle, CheckCircle, Building2, Users } from "lucide-react"
import { DocumentType } from "@/lib/types/document"
import { DOCUMENT_TYPE_LABELS, isFileTypeAllowed, MAX_FILE_SIZE_MB } from "@/lib/constants/document"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDocuments } from "@/lib/contexts/document-context"
import { useParsing } from "@/lib/hooks/use-parsing"
import { MultiStepValidation } from "@/components/processing/multi-step-validation"
import { cn } from "@/lib/utils"

interface FileForm {
  id: string
  file: File
  title: string
  description: string
  documentType: DocumentType
  tags: string
  aiParsed: boolean
  leaseGroupId?: string // Pour grouper les fichiers d'un même bail
}

interface LeaseGroup {
  id: string
  mainFile: FileForm
  annexFiles: FileForm[]
  parsedData?: any
  matchedEntities?: {
    property?: { id: string; name: string; confidence: number }
    landlord?: { id: string; name: string; confidence: number }
    tenant?: { id: string; name: string; confidence: number }
    existingLease?: { id: string; reference: string; confidence: number }
  }
  formData?: {
    property: any
    landlord: any
    tenant: any
    lease: any
  }
}

export interface UploadDialogEnhancedProps {
  defaultFolder?: string
  defaultDocumentType?: DocumentType
  onUploadSuccess?: (documentIds: string[]) => void
  trigger?: React.ReactNode
}

export function UploadDialogEnhanced({
  defaultFolder,
  defaultDocumentType,
  onUploadSuccess,
  trigger
}: UploadDialogEnhancedProps = {}) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<FileForm[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [parsingStatus, setParsingStatus] = useState<{[key: string]: 'pending' | 'parsing' | 'completed' | 'error'}>({})
  const [parsingResults, setParsingResults] = useState<{[key: string]: any}>({})
  const [showValidation, setShowValidation] = useState(false)
  const [currentValidationStep, setCurrentValidationStep] = useState(0)
  const [validationData, setValidationData] = useState<any>(null)
  const [leaseFiles, setLeaseFiles] = useState<FileForm[]>([])
  const [leaseGroups, setLeaseGroups] = useState<LeaseGroup[]>([])
  const [currentLeaseGroup, setCurrentLeaseGroup] = useState<LeaseGroup | null>(null)
  const [matchingMode, setMatchingMode] = useState<'create' | 'match'>('create')

  const { currentOrganizationId } = useAuthStore()
  const { currentFolder, refreshDocuments } = useDocuments()
  
  // Parsing hook for automatic extraction
  const {
    status: parsingHookStatus,
    loading: parsingLoading,
    startParsing,
    result: parsingResult,
    reset: resetParsing
  } = useParsing()

  // Use passed defaultFolder or context currentFolder
  const targetFolder = defaultFolder || currentFolder

  // Group files by lease intelligently
  const groupFilesByLease = (fileList: FileForm[]): LeaseGroup[] => {
    const leaseFiles = fileList.filter(f => f.documentType === DocumentType.BAIL)
    const annexFiles = fileList.filter(f => f.documentType !== DocumentType.BAIL)
    
    const groups: LeaseGroup[] = []
    
    leaseFiles.forEach((leaseFile, index) => {
      const groupId = `lease-group-${Date.now()}-${index}`
      
      // Try to match annex files to this lease based on filename patterns
      const relatedAnnexes = annexFiles.filter(annex => {
        const leaseName = leaseFile.file.name.toLowerCase().replace(/\.[^/.]+$/, "")
        const annexName = annex.file.name.toLowerCase().replace(/\.[^/.]+$/, "")
        
        // Check if annex name contains lease name or similar patterns
        return annexName.includes(leaseName) || 
               leaseName.includes(annexName) ||
               annexName.includes("annex") ||
               annexName.includes("appendice") ||
               annexName.includes("complement")
      })
      
      // Mark files as grouped
      leaseFile.leaseGroupId = groupId
      relatedAnnexes.forEach(annex => annex.leaseGroupId = groupId)
      
      groups.push({
        id: groupId,
        mainFile: leaseFile,
        annexFiles: relatedAnnexes
      })
    })
    
    return groups
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    for (const selectedFile of selectedFiles) {
      if (!isFileTypeAllowed(selectedFile)) {
        setError(`Type de fichier non autorisé: ${selectedFile.name}`)
        continue
      }

      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Fichier trop volumineux: ${selectedFile.name} (max ${MAX_FILE_SIZE_MB}MB)`)
        continue
      }

      const newFileForm: FileForm = {
        id: `file-${Date.now()}-${Math.random()}`,
        file: selectedFile,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        description: "",
        documentType: defaultDocumentType || DocumentType.AUTRE,
        tags: "",
        aiParsed: false
      }

      setFiles(prev => [...prev, newFileForm])
    }
    
    setError(null)
    // Reset input
    e.target.value = ""
  }

  const updateFileForm = (fileId: string, updates: Partial<FileForm>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }

  const addAnotherFile = () => {
    // Trigger file input
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = (e) => handleFileChange(e as any)
    input.click()
  }

  const handleUpload = async () => {
    if (!files.length || !currentOrganizationId) return

    setLoading(true)
    setError(null)
    const uploadedIds: string[] = []
    const documentMap: {[key: string]: string} = {} // fileId -> documentId

    try {
      // Step 1: Upload all files
      for (const fileForm of files) {
        setUploadProgress(prev => ({ ...prev, [fileForm.id]: 0 }))
        setParsingStatus(prev => ({ ...prev, [fileForm.id]: 'pending' }))

        const doc = await documentService.uploadDocument({
          file: fileForm.file,
          organization_id: currentOrganizationId,
          title: fileForm.title || fileForm.file.name,
          document_type: fileForm.documentType,
          folder_path: targetFolder,
          description: fileForm.aiParsed ? undefined : fileForm.description,
          tags: fileForm.aiParsed ? undefined : (fileForm.tags ? fileForm.tags.split(",").map(t => t.trim()) : undefined),
        })

        if (doc) {
          uploadedIds.push(doc.id)
          documentMap[fileForm.id] = doc.id
          setUploadProgress(prev => ({ ...prev, [fileForm.id]: 100 }))
        }
      }

      await refreshDocuments()

      // Step 2: Group files by lease and parse them
      const groups = groupFilesByLease(files)
      setLeaseGroups(groups)

      // Step 3: Parse each lease group with all files
      const parsedGroups: LeaseGroup[] = []
      
      for (const group of groups) {
        const mainDocumentId = documentMap[group.mainFile.id]
        const annexDocumentIds = group.annexFiles.map(f => documentMap[f.id]).filter(Boolean)
        
        if (mainDocumentId) {
          setParsingStatus(prev => ({ ...prev, [group.mainFile.id]: 'parsing' }))
          
          try {
            // Enhanced parsing with multiple files
            await startParsing(mainDocumentId)
            
            setParsingStatus(prev => ({ ...prev, [group.mainFile.id]: 'completed' }))
            
            // Create enhanced lease group with parsing results
            const parsedGroup: LeaseGroup = {
              ...group,
              parsedData: parsingResult,
              matchedEntities: {
                property: parsingResult?.lease_data?.property_address ? { id: '', name: parsingResult.lease_data.property_address, confidence: parsingResult.overall_confidence } : undefined,
                landlord: parsingResult?.lease_data?.parties?.find(p => p.type === 'landlord') ? { id: '', name: parsingResult.lease_data.parties.find(p => p.type === 'landlord')?.name || '', confidence: parsingResult.overall_confidence } : undefined,
                tenant: parsingResult?.lease_data?.parties?.find(p => p.type === 'tenant') ? { id: '', name: parsingResult.lease_data.parties.find(p => p.type === 'tenant')?.name || '', confidence: parsingResult.overall_confidence } : undefined
              },
              formData: {
                property: {
                  address: parsingResult?.lease_data?.property_address || '',
                  zip: parsingResult?.lease_data?.property_zip || '',
                  city: parsingResult?.lease_data?.property_city || '',
                  type: parsingResult?.lease_data?.property_type || '',
                  surface_area: parsingResult?.lease_data?.surface_area,
                  construction_year: parsingResult?.lease_data?.construction_year,
                  energy_class: parsingResult?.lease_data?.energy_class,
                  ges_class: parsingResult?.lease_data?.ges_class
                },
                landlord: parsingResult?.lease_data?.parties?.find(p => p.type === 'landlord') || {},
                tenant: parsingResult?.lease_data?.parties?.find(p => p.type === 'tenant') || {},
                lease: {
                  start_date: parsingResult?.lease_data?.start_date,
                  end_date: parsingResult?.lease_data?.end_date,
                  monthly_rent: parsingResult?.lease_data?.monthly_rent,
                  charges: parsingResult?.lease_data?.charges,
                  deposit: parsingResult?.lease_data?.deposit
                }
              }
            }
            
            parsedGroups.push(parsedGroup)
            setParsingResults(prev => ({ ...prev, [group.id]: parsingResult }))
            
          } catch (err) {
            setParsingStatus(prev => ({ ...prev, [group.mainFile.id]: 'error' }))
            console.error(`Failed to parse lease group ${group.id}:`, err)
          }
        }
      }

      // Step 4: Show validation if we have parsed lease groups
      if (parsedGroups.length > 0) {
        setLeaseGroups(parsedGroups)
        setCurrentLeaseGroup(parsedGroups[0])
        setValidationData(parsedGroups[0].parsedData)
        setShowValidation(true)
        setCurrentValidationStep(0)
      } else {
        // Close dialog and notify success if no validation needed
        setOpen(false)
        resetForm()
        if (onUploadSuccess && uploadedIds.length > 0) {
          onUploadSuccess(uploadedIds)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setLoading(false)
      setUploadProgress({})
    }
  }

  // MultiStepValidation handlers
  const handleFieldChange = (fieldName: string, value: any) => {
    if (validationData) {
      setValidationData((prev: any) => ({
        ...prev,
        [fieldName]: value
      }))
    }
  }

  const handlePartyChange = (index: number, party: any) => {
    if (validationData && validationData.parties) {
      const updatedParties = [...validationData.parties]
      updatedParties[index] = party
      setValidationData((prev: any) => ({
        ...prev,
        parties: updatedParties
      }))
    }
  }

  const handleAddParty = (type: "landlord" | "tenant") => {
    if (validationData) {
      const newParty = {
        type,
        name: "",
        email: "",
        phone: "",
        address: "",
        company: type === "landlord" ? "" : undefined
      }
      setValidationData((prev: any) => ({
        ...prev,
        parties: [...(prev.parties || []), newParty]
      }))
    }
  }

  const handleRemoveParty = (index: number) => {
    if (validationData && validationData.parties) {
      const updatedParties = validationData.parties.filter((_: any, i: number) => i !== index)
      setValidationData((prev: any) => ({
        ...prev,
        parties: updatedParties
      }))
    }
  }

  const handleValidate = async (createEntities: boolean) => {
    try {
      // Here you would call the API to create entities
      console.log('Creating entities:', createEntities ? 'Yes' : 'No')
      console.log('Validation data:', validationData)
      
      // Move to next lease file or complete
      const remainingFiles = leaseFiles.filter((f, index) => index > currentValidationStep)
      
      if (remainingFiles.length > 0) {
        // Move to next file
        setCurrentValidationStep(prev => prev + 1)
        const nextFile = remainingFiles[0]
        const nextParsingData = parsingResults[nextFile.id]
        if (nextParsingData) {
          setValidationData(nextParsingData)
        }
      } else {
        // All files validated, complete process
        handleValidationComplete()
      }
    } catch (err) {
      console.error('Validation error:', err)
      setError('Erreur lors de la validation des données')
    }
  }

  const handleValidationComplete = () => {
    // Reset parsing and close dialog
    resetParsing()
    setOpen(false)
    resetForm()

    // Notify success
    const uploadedIds = files.map(f => f.id) // This would need to be actual document IDs
    if (onUploadSuccess && uploadedIds.length > 0) {
      onUploadSuccess(uploadedIds)
    }
  }

  const handleValidationCancel = () => {
    setShowValidation(false)
    resetForm()
  }

  const resetForm = () => {
    setFiles([])
    setError(null)
    setUploadProgress({})
    setParsingStatus({})
    setParsingResults({})
    setShowValidation(false)
    setCurrentValidationStep(0)
    setValidationData(null)
    setLeaseFiles([])
  }

  const getFileIcon = (documentType: DocumentType) => {
    switch (documentType) {
      case DocumentType.BAIL:
        return <FileCode className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Uploader des fichiers
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showValidation ? (
              <>
                <FileCode className="h-5 w-5" />
                Validation des baux
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload multiple documents
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showValidation 
              ? "Validez et complétez les informations extraites par l'IA pour chaque bail"
              : `Ajouter plusieurs documents à votre organisation dans ${targetFolder === "/" ? "la racine" : targetFolder}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Show Validation Interface */}
          {showValidation && currentLeaseGroup ? (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Groupe de bail {currentValidationStep + 1} sur {leaseGroups.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({currentLeaseGroup.mainFile.file.name} + {currentLeaseGroup.annexFiles.length} annexes)
                  </span>
                </div>
                <div className="flex gap-1">
                  {leaseGroups.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= currentValidationStep 
                          ? 'bg-primary' 
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Entity Matching Section */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="text-sm font-medium mb-3">Correspondance des entités</h3>
                
                {/* Property Matching */}
                {currentLeaseGroup.matchedEntities?.property && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{currentLeaseGroup.matchedEntities.property.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Correspondance: {Math.round(currentLeaseGroup.matchedEntities.property.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Utiliser
                      </Button>
                    </div>
                  </div>
                )}

                {/* Landlord Matching */}
                {currentLeaseGroup.matchedEntities?.landlord && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{currentLeaseGroup.matchedEntities.landlord.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Correspondance: {Math.round(currentLeaseGroup.matchedEntities.landlord.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Utiliser
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tenant Matching */}
                {currentLeaseGroup.matchedEntities?.tenant && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{currentLeaseGroup.matchedEntities.tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Correspondance: {Math.round(currentLeaseGroup.matchedEntities.tenant.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Utiliser
                      </Button>
                    </div>
                  </div>
                )}

                {/* No matches found */}
                {!currentLeaseGroup.matchedEntities?.property && !currentLeaseGroup.matchedEntities?.landlord && !currentLeaseGroup.matchedEntities?.tenant && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Aucune correspondance trouvée. Les entités seront créées.
                    </p>
                  </div>
                )}
              </div>

              {/* Files List */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Fichiers de ce bail</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <FileCode className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentLeaseGroup.mainFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">Document principal</p>
                    </div>
                  </div>
                  {currentLeaseGroup.annexFiles.map((annex, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-sm">{annex.file.name}</p>
                        <p className="text-xs text-muted-foreground">Annexe</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleValidationCancel}>
                  Annuler
                </Button>
                <Button onClick={() => handleValidate(true)}>
                  Créer les entités
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Show Upload Interface */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Glissez-déposez des fichiers ou cliquez pour sélectionner</p>
              <p className="text-xs text-muted-foreground">
                Formats supportés: PDF, DOC, DOCX, TXT, JPG, PNG (max {MAX_FILE_SIZE_MB}MB)
              </p>
            </div>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Fichiers à uploader ({files.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAnotherFile}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un fichier
                </Button>
              </div>

              <div className="space-y-3">
                {files.map((fileForm, index) => (
                  <Card key={fileForm.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getFileIcon(fileForm.documentType)}
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          {/* File Info */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{fileForm.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(fileForm.file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileForm.id)}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Form Fields - Hidden for AI parsing */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Document Type - Hidden if pre-filled */}
                            {!defaultDocumentType && (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Type de document
                                </label>
                                <Select
                                  value={fileForm.documentType}
                                  onValueChange={(value) => updateFileForm(fileForm.id, { documentType: value as DocumentType })}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Description - Hidden for AI parsing */}
                            {fileForm.documentType !== DocumentType.BAIL && (
                              <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Description
                                </label>
                                <Input
                                  value={fileForm.description}
                                  onChange={(e) => updateFileForm(fileForm.id, { description: e.target.value })}
                                  placeholder="Description optionnelle"
                                  disabled={loading}
                                  className="h-8"
                                />
                              </div>
                            )}

                            {/* Tags - Hidden for AI parsing */}
                            {fileForm.documentType !== DocumentType.BAIL && (
                              <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Tags
                                </label>
                                <Input
                                  value={fileForm.tags}
                                  onChange={(e) => updateFileForm(fileForm.id, { tags: e.target.value })}
                                  placeholder="tag1, tag2, tag3"
                                  disabled={loading}
                                  className="h-8"
                                />
                              </div>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {uploadProgress[fileForm.id] !== undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Upload en cours...</span>
                                <span>{uploadProgress[fileForm.id]}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1">
                                <div 
                                  className="bg-primary h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[fileForm.id]}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Parsing Progress */}
                          {parsingStatus[fileForm.id] && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  {parsingStatus[fileForm.id] === 'parsing' && (
                                    <>
                                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                                      Analyse IA en cours...
                                    </>
                                  )}
                                  {parsingStatus[fileForm.id] === 'completed' && (
                                    <>
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      Analyse terminée
                                    </>
                                  )}
                                  {parsingStatus[fileForm.id] === 'error' && (
                                    <>
                                      <AlertCircle className="h-3 w-3 text-red-600" />
                                      Erreur d'analyse
                                    </>
                                  )}
                                  {parsingStatus[fileForm.id] === 'pending' && (
                                    <>
                                      <AlertCircle className="h-3 w-3 text-blue-600" />
                                      En attente d'analyse...
                                    </>
                                  )}
                                </span>
                              </div>
                              {parsingStatus[fileForm.id] === 'parsing' && (
                                <div className="w-full bg-blue-100 rounded-full h-1">
                                  <div className="bg-blue-600 h-1 rounded-full animate-pulse" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Parsing Indicator */}
                          {fileForm.documentType === DocumentType.BAIL && !parsingStatus[fileForm.id] && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                              <AlertCircle className="h-3 w-3" />
                              Les informations (titre, description, tags) seront extraites automatiquement par IA
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun fichier sélectionné
              </p>
            </div>
          )}

          {/* Actions - Only show in upload mode */}
          {!showValidation && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={files.length === 0 || loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Uploader {files.length > 1 ? `${files.length} fichiers` : 'le fichier'}
                    {files.some(f => f.documentType === DocumentType.BAIL) && (
                      <span className="ml-1 text-xs opacity-80">+ IA</span>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
