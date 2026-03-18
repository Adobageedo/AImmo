"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Upload } from "lucide-react"
import { DocumentType } from "@/lib/types/document"
import { DOCUMENT_TYPE_LABELS, isFileTypeAllowed, MAX_FILE_SIZE_MB } from "@/lib/constants/document"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDocuments } from "@/lib/contexts/document-context"

export interface UploadDialogProps {
  defaultFolder?: string
  defaultDocumentType?: DocumentType
  onUploadSuccess?: (documentId: string) => void
  trigger?: React.ReactNode
}

export function UploadDialog({
  defaultFolder,
  defaultDocumentType,
  onUploadSuccess,
  trigger
}: UploadDialogProps = {}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [documentType, setDocumentType] = useState<DocumentType>(defaultDocumentType || DocumentType.AUTRE)
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentOrganizationId } = useAuthStore()
  const { currentFolder, refreshDocuments } = useDocuments()

  // Use passed defaultFolder or context currentFolder
  const targetFolder = defaultFolder || currentFolder
  const [customFolder, setCustomFolder] = useState(targetFolder)

  // Update customFolder when targetFolder changes (e.g. opening dialog in different context)
  useEffect(() => {
    setCustomFolder(targetFolder)
  }, [targetFolder])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!isFileTypeAllowed(selectedFile)) {
      setError("Type de fichier non autorisé")
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_FILE_SIZE_MB}MB)`)
      return
    }

    setFile(selectedFile)
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
    }
    setError(null)
  }

  const handleUpload = async () => {
    if (!file || !currentOrganizationId) return

    setLoading(true)
    setError(null)

    try {
      const doc = await documentService.uploadDocument({
        file,
        organization_id: currentOrganizationId,
        title: title || file.name,
        document_type: documentType,
        folder_path: customFolder, // Use user-defined folder
        description: description || undefined,
        tags: tags ? tags.split(",").map(t => t.trim()) : undefined,
      })

      await refreshDocuments()
      setOpen(false)
      resetForm()

      if (onUploadSuccess && doc) {
        onUploadSuccess(doc.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setTitle("")
    setDescription("")
    setDocumentType(defaultDocumentType || DocumentType.AUTRE)
    setTags("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Uploader un fichier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Uploader un document</DialogTitle>
          <DialogDescription>
            Ajouter un nouveau document à votre organisation dans {targetFolder === "/" ? "la racine" : targetFolder}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium">
              Fichier *
            </label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titre *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du document"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="folder" className="text-sm font-medium">
              Dossier de destination
            </label>
            <Input
              id="folder"
              value={customFolder}
              onChange={(e) => setCustomFolder(e.target.value)}
              placeholder="/Documents"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="document_type" className="text-sm font-medium">
              Type de document
            </label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
              disabled={loading || !!defaultDocumentType}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Séparez les tags par des virgules
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
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
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Upload en cours..." : "Uploader"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
