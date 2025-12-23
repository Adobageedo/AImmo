"use client"

import { useEffect } from "react"
import { DocumentProvider, useDocuments } from "@/lib/contexts/document-context"
import { UploadDialog } from "@/components/documents/upload-dialog"
import { DocumentList } from "@/components/documents/document-list"
import { QuotaDisplay } from "@/components/documents/quota-display"
import { Folder } from "lucide-react"

function DocumentsContent() {
  const { documents, loading, error, currentFolder, loadDocuments } = useDocuments()

  useEffect(() => {
    loadDocuments({ folder_path: currentFolder })
  }, [currentFolder, loadDocuments])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos documents et fichiers
          </p>
        </div>
        <UploadDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>{currentFolder}</span>
          </div>

          {loading && (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && <DocumentList documents={documents} />}
        </div>

        <div className="space-y-4">
          <QuotaDisplay />
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <DocumentProvider>
      <DocumentsContent />
    </DocumentProvider>
  )
}
