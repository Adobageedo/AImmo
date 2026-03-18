"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useDocuments } from "@/hooks/documents/use-documents"
import { useFolderNavigation } from "@/hooks/documents/use-folder-navigation"
import { DriveSelector } from "@/components/documents/drive-selector"
import { FolderGrid } from "@/components/documents/folder-grid"
import { DocumentList } from "@/components/documents/document-list"
import { SidebarInfo } from "@/components/documents/sidebar-info"
import { FOLDER_CONFIGS } from "@/types/documents"
import { 
  ArrowLeft, 
  RefreshCw, 
  FileText, 
  Plus,
  Search,
  Filter,
  Folder,
  FileCode
} from "lucide-react"

function DocumentsContent() {
  const { currentOrganization } = useOrganizationContext()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  
  const {
    documents,
    loading,
    error,
    loadDocuments,
    refreshDocuments,
    uploadDocument
  } = useDocuments({ autoLoad: false })

  const {
    activeDrive,
    currentFolder,
    breadcrumb,
    selectDrive,
    selectFolder,
    goBack
  } = useFolderNavigation()

  // Load documents when in personal drive
  useEffect(() => {
    if (activeDrive === "personal" && currentFolder !== "/" && currentOrganization?.id) {
      loadDocuments({ folder_path: currentFolder })
    }
  }, [activeDrive, currentFolder, currentOrganization?.id, loadDocuments])

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handle Drive Selection
  const handleDriveSelect = (drive: "personal" | "google" | "onedrive") => {
    selectDrive(drive)
    if (drive === "personal") {
      selectFolder("/")
    }
  }

  // Handle Folder Selection
  const handleFolderSelect = (folderId: string) => {
    selectFolder(folderId)
    if (currentOrganization?.id) {
      loadDocuments({ folder_path: folderId })
    }
  }

  // Handle Upload
  const handleUpload = () => {
    // TODO: Implement upload dialog
    console.log("Upload clicked")
  }

  // Handle Document Download
  const handleDocumentDownload = (documentId: string) => {
    // TODO: Implement download
    console.log("Download document:", documentId)
  }

  // Prepare folders for FolderGrid
  const folders = Object.values(FOLDER_CONFIGS).map(config => ({
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.id === "Leases" ? <FileCode className="h-10 w-10 text-indigo-600" /> : <Folder className="h-10 w-10 text-yellow-500" />,
    badge: config.badge,
    isSpecial: config.isSpecial
  }))

  // Root Drive Selection View
  if (!activeDrive) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Connectez vos espaces de stockage</p>
        </div>

        <DriveSelector onSelectDrive={handleDriveSelect} />
      </div>
    )
  }

  // Personal Storage Root Folders View
  if (activeDrive === "personal" && currentFolder === "/") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stockage Personnel</h1>
          <p className="text-muted-foreground">Gérez vos dossiers et fichiers</p>
          <Button variant="ghost" onClick={goBack} className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux disques
          </Button>
        </div>

        <FolderGrid folders={folders} onSelectFolder={handleFolderSelect} />
      </div>
    )
  }

  // File List View (Inside a folder)
  const isLeaseFolder = currentFolder === "Leases"

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{currentFolder}</h1>
            <p className="text-muted-foreground">
              {isLeaseFolder ? "Documents avec analyse automatique" : "Fichiers stockés"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshDocuments()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {isLeaseFolder && (
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700">
                <FileCode className="mr-2 h-4 w-4" />
                Import Lease
              </Button>
            )}

            {!isLeaseFolder && (
              <Button variant="outline" onClick={handleUpload}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter des fichiers
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un document..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <span key={item.path}>
                <span 
                  className="cursor-pointer hover:text-foreground" 
                  onClick={() => {
                    if (index === 0) {
                      // Reset to drive selection
                      selectDrive(null)
                    } else if (index === 1) {
                      // Go to root folder
                      selectFolder("/")
                    }
                  }}
                >
                  {item.name}
                </span>
                {index < breadcrumb.length - 1 && <span className="mx-2">/</span>}
              </span>
            ))}
          </div>

          {/* Document List Container */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-gray-500">Chargement des documents...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="m-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshDocuments()}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && filteredDocuments.length === 0 && (
              <EmptyState
                title={searchQuery ? "Aucun résultat" : "Dossier vide"}
                description={
                  isLeaseFolder
                    ? "Commencez par uploader un bail pour lancer l'analyse IA"
                    : "Aucun document dans ce dossier"
              }
              />
            )}

            {!loading && !error && filteredDocuments.length > 0 && (
              <DocumentList 
                documents={filteredDocuments}
                onDownload={handleDocumentDownload}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SidebarInfo
            documentCount={filteredDocuments.length}
            totalSize={filteredDocuments.reduce((acc, doc) => acc + doc.file_size, 0)}
            isLeaseFolder={isLeaseFolder}
          />
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  return <DocumentsContent />
}
