"use client"

import { useState } from "react"
import { FileText, Download, Trash2, Edit, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Document } from "@/lib/types/document"
import { DOCUMENT_TYPE_LABELS, formatFileSize } from "@/lib/constants/document"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDocuments } from "@/lib/contexts/document-context"

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const { currentOrganizationId } = useAuthStore()
  const { refreshDocuments } = useDocuments()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDownload = async (doc: Document) => {
    if (!currentOrganizationId) return

    try {
      const { download_url } = await documentService.getDownloadUrl(
        doc.id,
        currentOrganizationId
      )
      window.open(download_url, "_blank")
    } catch (error) {
      console.error("Failed to download:", error)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!currentOrganizationId || !confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return
    }

    setDeletingId(docId)
    try {
      await documentService.deleteDocument(docId, currentOrganizationId)
      await refreshDocuments()
    } catch (error) {
      console.error("Failed to delete:", error)
    } finally {
      setDeletingId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Aucun document dans ce dossier</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{DOCUMENT_TYPE_LABELS[doc.document_type]}</span>
                <span>•</span>
                <span>{formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              {doc.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 text-xs bg-secondary rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </DropdownMenuItem>
              {doc.document_type === "bail" && (
                <DropdownMenuItem onClick={() => window.location.href = `/dashboard/documents/${doc.id}/processing`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Extraire les données
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingId === doc.id ? "Suppression..." : "Supprimer"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}
