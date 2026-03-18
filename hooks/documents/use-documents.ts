"use client"

import { useState, useEffect, useCallback } from "react"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { documentService } from "@/services/document.service"
import type { Document, DocumentSearchParams } from "@/types/document"

interface UseDocumentsOptions {
  autoLoad?: boolean
  searchParams?: DocumentSearchParams
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { currentOrganization } = useOrganizationContext()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async (params?: DocumentSearchParams) => {
    if (!currentOrganization?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await documentService.getAll(currentOrganization.id, {
        page: 1,
        limit: 50,
        ...params
      })

      if (response.success && response.data) {
        setDocuments(response.data.data)
      } else {
        setError(response.error || "Erreur lors du chargement des documents")
      }
    } catch (err) {
      setError("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  const refreshDocuments = useCallback(() => {
    loadDocuments(options.searchParams)
  }, [loadDocuments, options.searchParams])

  const uploadDocument = useCallback(async (file: File, type: string, folderPath?: string) => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const response = await documentService.upload(currentOrganization.id, file, {
        type: type as any,
        folder_path: folderPath
      })

      if (response.success) {
        await refreshDocuments()
        return response.data
      } else {
        setError(response.error || "Erreur lors de l'upload")
        return null
      }
    } catch (err) {
      setError("Erreur lors de l'upload")
      return null
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id, refreshDocuments])

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const response = await documentService.delete(documentId)

      if (response.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        return true
      } else {
        setError(response.error || "Erreur lors de la suppression")
        return false
      }
    } catch (err) {
      setError("Erreur lors de la suppression")
      return false
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (options.autoLoad && currentOrganization?.id) {
      loadDocuments(options.searchParams)
    }
  }, [options.autoLoad, currentOrganization?.id, loadDocuments, options.searchParams])

  return {
    documents,
    loading,
    error,
    loadDocuments,
    refreshDocuments,
    uploadDocument,
    deleteDocument
  }
}
