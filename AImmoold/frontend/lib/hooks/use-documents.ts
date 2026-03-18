"use client"

import { useState, useCallback } from "react"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import type { Document, DocumentType, DocumentUploadRequest } from "@/lib/types/document"

interface UseDocumentsOptions {
    autoLoad?: boolean
    folderPath?: string
}

/**
 * Custom hook for document operations
 * Provides CRUD operations and loading states
 */
export function useDocumentOperations(options: UseDocumentsOptions = {}) {
    const { currentOrganizationId } = useAuthStore()
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    /**
     * Load documents with optional filters
     */
    const loadDocuments = useCallback(async (filters?: {
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
    }, [currentOrganizationId])

    /**
     * Upload a new document
     */
    const uploadDocument = useCallback(async (request: DocumentUploadRequest) => {
        setUploading(true)
        setError(null)

        try {
            const doc = await documentService.uploadDocument(request)
            setDocuments(prev => [doc, ...prev])
            return doc
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to upload document"
            setError(errorMessage)
            throw err
        } finally {
            setUploading(false)
        }
    }, [])

    /**
     * Delete a document
     */
    const deleteDocument = useCallback(async (documentId: string) => {
        if (!currentOrganizationId) return false

        try {
            await documentService.deleteDocument(documentId, currentOrganizationId)
            setDocuments(prev => prev.filter(d => d.id !== documentId))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete document")
            return false
        }
    }, [currentOrganizationId])

    /**
     * Download a document
     */
    const downloadDocument = useCallback(async (document: Document) => {
        if (!currentOrganizationId) return

        try {
            const { download_url } = await documentService.getDownloadUrl(
                document.id,
                currentOrganizationId
            )
            window.open(download_url, "_blank")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download document")
        }
    }, [currentOrganizationId])

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        documents,
        loading,
        uploading,
        error,
        loadDocuments,
        uploadDocument,
        deleteDocument,
        downloadDocument,
        clearError,
    }
}
