"use client"

import { useEffect, useState } from "react"
import { DocumentProvider, useDocuments } from "@/lib/contexts/document-context"
import { UploadDialog, DocumentList, QuotaDisplay } from "@/components/documents"
import { PageHeader, SearchInput, EmptyState, Badge, Alert } from "@/components/ui"
import { Folder, Filter, RefreshCw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDisclosure } from "@/lib/hooks"

function DocumentsContent() {
  const { documents, loading, error, currentFolder, loadDocuments, refreshDocuments } = useDocuments()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadDocuments({ folder_path: currentFolder })
  }, [currentFolder, loadDocuments])

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate stats
  const stats = {
    total: documents.length,
    bails: documents.filter(d => d.document_type === "bail").length,
    factures: documents.filter(d => d.document_type === "facture").length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Documents"
        description="Gérez et analysez vos documents immobiliers"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => refreshDocuments()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <UploadDialog />
      </PageHeader>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un document..."
          className="flex-1"
        />
        <Button variant="outline" className="shrink-0">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Current Folder Path */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border text-sm text-gray-600">
            <Folder className="h-4 w-4 text-indigo-500" />
            <span className="font-medium">{currentFolder === "/" ? "Racine" : currentFolder}</span>
            {searchQuery && (
              <Badge variant="secondary" className="ml-2">
                {filteredDocuments.length} résultat(s)
              </Badge>
            )}
          </div>

          {/* Document List Container */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-gray-500">Chargement des documents...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="m-4">
                <Alert variant="error" title="Erreur de chargement">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshDocuments()}
                    >
                      Réessayer
                    </Button>
                  </div>
                </Alert>
              </div>
            )}

            {!loading && !error && filteredDocuments.length === 0 && (
              <EmptyState
                icon={FileText}
                title={searchQuery ? "Aucun résultat" : "Aucun document"}
                description={searchQuery
                  ? `Aucun document ne correspond à "${searchQuery}"`
                  : "Commencez par uploader votre premier document"
                }
              />
            )}

            {!loading && !error && filteredDocuments.length > 0 && (
              <div className="divide-y">
                <DocumentList documents={filteredDocuments} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <QuotaDisplay />

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Aperçu</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total documents</span>
                <Badge variant="secondary">{stats.total}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Baux</span>
                <Badge variant="default">{stats.bails}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Factures</span>
                <Badge variant="success">{stats.factures}</Badge>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
            <h3 className="font-semibold text-indigo-900">💡 Astuce</h3>
            <p className="mt-2 text-sm text-indigo-700">
              Uploadez un bail au format PDF pour extraire automatiquement les informations clés grâce à notre OCR intelligent.
            </p>
          </div>
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
