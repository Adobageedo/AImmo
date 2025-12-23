"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Document, DocumentType } from "@/lib/types/document"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"

interface DocumentContextType {
  documents: Document[]
  loading: boolean
  error: string | null
  currentFolder: string
  setCurrentFolder: (path: string) => void
  loadDocuments: (filters?: {
    folder_path?: string
    document_type?: DocumentType
    property_id?: string
    lease_id?: string
  }) => Promise<void>
  refreshDocuments: () => Promise<void>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFolder, setCurrentFolder] = useState("/")
  const { currentOrganizationId } = useAuthStore()

  const loadDocuments = useCallback(
    async (filters?: {
      folder_path?: string
      document_type?: DocumentType
      property_id?: string
      lease_id?: string
    }) => {
      if (!currentOrganizationId) {
        setError("No organization selected")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const docs = await documentService.listDocuments(currentOrganizationId, filters)
        setDocuments(docs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents")
      } finally {
        setLoading(false)
      }
    },
    [currentOrganizationId]
  )

  const refreshDocuments = useCallback(async () => {
    await loadDocuments({ folder_path: currentFolder })
  }, [loadDocuments, currentFolder])

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        error,
        currentFolder,
        setCurrentFolder,
        loadDocuments,
        refreshDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error("useDocuments must be used within DocumentProvider")
  }
  return context
}
