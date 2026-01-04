"use client"

import { useEffect, useState } from "react"
import { DocumentProvider, useDocuments } from "@/lib/contexts/document-context"
import { UploadDialog, DocumentList, QuotaDisplay } from "@/components/documents"
import { UploadDialogEnhanced } from "@/components/documents/upload-dialog-enhanced"
import { PageHeader, SearchInput, EmptyState, Badge, Alert } from "@/components/ui"
import { Folder, Filter, RefreshCw, FileText, HardDrive, Cloud, FileCode, CheckCircle, ArrowLeft, Loader2, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentType } from "@/lib/types/document"
import { useParsing } from "@/lib/hooks/use-parsing"
import { MultiStepValidation } from "@/components/processing/multi-step-validation"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRouter } from "next/navigation"

function DocumentsContent() {
  const { documents, loading, error, currentFolder, setCurrentFolder, loadDocuments, refreshDocuments } = useDocuments()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeDrive, setActiveDrive] = useState<"personal" | "google" | "onedrive" | null>(null)

  // Parsing State
  const {
    result: parsingResult,
    status: parsingStatus,
    loading: parsingLoading,
    startParsing,
    updateField,
    updateParty,
    addParty,
    removeParty,
    validateAndComplete,
    reset: resetParsing
  } = useParsing()

  // Initialize view
  useEffect(() => {
    if (activeDrive === "personal") {
      loadDocuments({ folder_path: currentFolder })
    }
  }, [currentFolder, activeDrive, loadDocuments])

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handle Drive Selection
  const handleDriveSelect = (drive: "personal" | "google" | "onedrive") => {
    setActiveDrive(drive)
    if (drive === "personal") {
      setCurrentFolder("/")
    }
  }

  // Handle Back Navigation
  const handleBack = () => {
    if (parsingResult) {
      if (confirm("Voulez-vous vraiment annuler la validation en cours ?")) {
        resetParsing()
      }
      return
    }

    if (currentFolder !== "/") {
      // Go up one level (simple implementation for depth 1)
      setCurrentFolder("/")
    } else {
      setActiveDrive(null)
    }
  }

  // Handle Lease Upload Success (parsing is now automatic in dialog)
  const handleLeaseUploadSuccess = async (documentIds: string[]) => {
    // Refresh documents to show newly uploaded files
    await refreshDocuments()
    console.log(`Successfully uploaded ${documentIds.length} documents with automatic parsing`)
  }

  const handleValidation = async (createEntities: boolean) => {
    const result = await validateAndComplete(createEntities)
    if (result) {
      resetParsing()
      refreshDocuments()
    } else {
      console.error("Erreur lors de la validation")
    }
  }

  // --- Views ---

  // 1. Parsing Validation Modal is handled inside the main return

  // 2. Parsing Loading View
  if (parsingLoading || parsingStatus === "ocr_processing" || parsingStatus === "parsing") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Analyse en cours...</h3>
          <p className="text-muted-foreground">
            L'IA analyse votre document pour extraire les données clés.
          </p>
        </div>
      </div>
    )
  }

  // 3. Root Drive Selection View
  if (!activeDrive) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Documents"
          description="Connectez vos espaces de stockage"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Storage */}
          <Card
            className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group"
            onClick={() => handleDriveSelect("personal")}
          >
            <CardHeader>
              <HardDrive className="h-10 w-10 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Stockage Personnel</CardTitle>
              <CardDescription>Vos documents stockés localement sur AImmo</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Accéder</Button>
            </CardContent>
          </Card>

          {/* Google Drive */}
          <Card className="opacity-75 relative overflow-hidden border-dashed">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Cloud className="h-10 w-10 text-blue-500 mb-2" />
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>Connectez votre compte Google Workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>Connexion</Button>
            </CardContent>
          </Card>

          {/* OneDrive */}
          <Card className="opacity-75 relative overflow-hidden border-dashed">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Cloud className="h-10 w-10 text-sky-600 mb-2" />
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <CardTitle>Microsoft OneDrive</CardTitle>
              <CardDescription>Synchronisez avec votre compte Microsoft</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>Connexion</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 4. Personal Storage Root Folders View
  if (activeDrive === "personal" && currentFolder === "/") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stockage Personnel"
          description="Gérez vos dossiers et fichiers"
        >
          <Button variant="ghost" onClick={() => setActiveDrive(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux disques
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Documents Folder */}
          <Card
            className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group"
            onClick={() => setCurrentFolder("Documents")}
          >
            <CardHeader>
              <Folder className="h-10 w-10 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Documents</CardTitle>
              <CardDescription>Stockage classique pour tous vos fichiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Dossier général</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </CardContent>
          </Card>

          {/* Leases Folder */}
          <Card
            className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group border-indigo-100 bg-indigo-50/10"
            onClick={() => setCurrentFolder("Leases")}
          >
            <CardHeader>
              <FileCode className="h-10 w-10 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Baux & Contrats</CardTitle>
              <CardDescription>Analyse automatique et extraction de données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                <span>Intelligent Parsing</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </CardContent>
          </Card>

          {/* Rapport Folder */}
          <Card
            className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group"
            onClick={() => setCurrentFolder("Rapport")}
          >
            <CardHeader>
              <Folder className="h-10 w-10 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Rapport</CardTitle>
              <CardDescription>Rapports et analyses générés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Archives</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </CardContent>
          </Card>
          {/* Chat Folder */}
          <Card
            className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group"
            onClick={() => setCurrentFolder("Chat")}
          >
            <CardHeader>
              <div className="bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Chat Files</CardTitle>
              <CardDescription>Fichiers partagés dans le chat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Pièces jointes</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 5. File List View (Inside a folder)
  const isLeaseFolder = currentFolder === "Leases"

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={currentFolder}
        description={isLeaseFolder ? "Documents avec analyse automatique" : "Fichiers stockés"}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack}>
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
            <UploadDialogEnhanced
              defaultFolder={currentFolder}
              defaultDocumentType={DocumentType.BAIL}
              onUploadSuccess={handleLeaseUploadSuccess}
              trigger={
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700">
                  <FileCode className="mr-2 h-4 w-4" />
                  Import Lease
                </Button>
              }
            />
          )}

          {!isLeaseFolder && (
            <UploadDialogEnhanced
              defaultFolder={currentFolder}
              defaultDocumentType={isLeaseFolder ? DocumentType.BAIL : undefined}
              onUploadSuccess={isLeaseFolder ? handleLeaseUploadSuccess : undefined}
              trigger={
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter des fichiers
                </Button>
              }
            />
          )}
        </div>
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

          {/* Breadcrumb-ish */}
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => setActiveDrive(null)}>Disques</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-foreground" onClick={() => setCurrentFolder("/")}>Personnel</span>
            <span>/</span>
            <span className="font-medium text-foreground">{currentFolder}</span>
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
                title={searchQuery ? "Aucun résultat" : "Dossier vide"}
                description={
                  isLeaseFolder
                    ? "Commencez par uploader un bail pour lancer l'analyse IA"
                    : "Aucun document dans ce dossier"
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

          {isLeaseFolder ? (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Parsing Intelligent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-700">
                  Uploadez vos baux ici. Notre IA extraira automatiquement :
                </p>
                <ul className="mt-2 space-y-1 text-sm text-indigo-600 list-disc list-inside">
                  <li>Les parties (Bailleur / Locataire)</li>
                  <li>Les dates et durées</li>
                  <li>Les montants (Loyer, charges)</li>
                  <li>Les clauses spécifiques</li>
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Info Dossier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fichiers</span>
                    <span className="font-medium">{filteredDocuments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taille totale</span>
                    <span className="font-medium">
                      {(filteredDocuments.reduce((acc, doc) => acc + doc.file_size, 0) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Parsing Validation Modal */}
      {parsingResult && (
        <MultiStepValidation
          isOpen={!!parsingResult && (parsingStatus === "review" || parsingStatus === "completed")}
          onClose={resetParsing}
          result={parsingResult}
          onFieldChange={updateField}
          onPartyChange={updateParty}
          onAddParty={addParty}
          onRemoveParty={removeParty}
          onValidate={handleValidation}
          loading={parsingLoading}
        />
      )}
    </div>
  )
}

export default function DocumentsPage() {
  const { currentOrganizationId, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // If not authenticated, redirect to login
    if (!isAuthenticated()) {
      router.push("/auth/login")
      return
    }
  }, [isAuthenticated, router])

  if (!mounted) return null

  if (!currentOrganizationId) {
    if (isAuthenticated()) {
      // Authenticated but no organization loaded yet? 
      // Could happen during initial hydration or if user has no orgs.
      // We can show a polite error or redirect to onboarding.
      // For now, let's show a specific message instead of infinite spinner if it takes too long
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-muted-foreground">Chargement de l'organisation...</p>
          {/* Fallback link if stuck */}
          <Button variant="link" onClick={() => window.location.reload()} className="text-xs text-muted-foreground">
            Recharger la page
          </Button>
        </div>
      )
    }

    // Not authenticated, will redirect via useEffect
    return null
  }



  return (
    <DocumentProvider>
      <DocumentsContent />
    </DocumentProvider>
  )
}
