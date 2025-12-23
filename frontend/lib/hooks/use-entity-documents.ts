import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export interface EntityDocument {
    id: string
    title: string
    name: string
    document_type: string
    file_size?: number
    storage_path?: string
    created_at: string
    association_type?: string
    association_notes?: string
    association_created_at?: string
}

export interface UseEntityDocumentsOptions {
    entityType: "property" | "owner" | "tenant" | "lease"
    entityId: string | null | undefined
    enabled?: boolean
}

export interface UseEntityDocumentsReturn {
    documents: EntityDocument[]
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

export function useEntityDocuments({
    entityType,
    entityId,
    enabled = true,
}: UseEntityDocumentsOptions): UseEntityDocumentsReturn {
    const [documents, setDocuments] = useState<EntityDocument[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const accessToken = useAuthStore((state) => state.accessToken)

    const fetchDocuments = async () => {
        if (!entityId || !accessToken || !enabled) {
            setDocuments([])
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `${API_URL}/document-associations/by-entity?entity_type=${entityType}&entity_id=${entityId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch documents: ${response.statusText}`)
            }

            const data = await response.json()
            setDocuments(data)
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error")
            setError(error)
            console.error(`Failed to fetch ${entityType} documents:`, error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [entityId, entityType, accessToken, enabled])

    return {
        documents,
        loading,
        error,
        refetch: fetchDocuments,
    }
}
