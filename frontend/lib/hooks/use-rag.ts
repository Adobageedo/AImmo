"use client"

import { useState, useCallback, useMemo } from "react"
import { SourceType } from "@/lib/types/document"
import {
    Chunk,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    RAGStats,
    DocumentIndexStatus,
    SourceToggle,
} from "@/lib/types/rag"
import {
    searchChunks,
    indexDocument,
    setDocumentExclusion,
    getRAGStats,
} from "@/lib/rag"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * Hook useRAG - Récupérer chunks pertinents selon org et source
 * Phase 4: RAG Foundation
 */

interface UseRAGOptions {
    // Organisation (optionnel, utilise currentOrganizationId par défaut)
    organizationId?: string
    // Sources à inclure par défaut
    defaultSources?: SourceType[]
    // Limite de résultats par défaut
    defaultLimit?: number
    // Score minimum par défaut
    defaultMinScore?: number
}

interface UseRAGReturn {
    // État
    results: RAGSearchResult[]
    isSearching: boolean
    isIndexing: boolean
    error: string | null
    stats: RAGStats | null
    lastQuery: string | null

    // Sources actives
    activeSources: SourceType[]
    setActiveSources: (sources: SourceType[]) => void
    toggleSource: (source: SourceType) => void

    // Actions de recherche
    search: (query: string, options?: Partial<RAGSearchRequest>) => Promise<RAGSearchResponse>
    clearResults: () => void

    // Actions d'indexation
    indexDoc: (
        documentId: string,
        content: string,
        metadata?: { title?: string; type?: string }
    ) => Promise<DocumentIndexStatus>
    excludeDocument: (documentId: string, exclude: boolean) => Promise<void>

    // Statistiques
    refreshStats: () => Promise<void>

    // Helpers
    getChunksByDocument: (documentId: string) => RAGSearchResult[]
    getChunksBySource: (sourceType: SourceType) => RAGSearchResult[]
    getSourceToggles: () => SourceToggle[]
}

export function useRAG(options: UseRAGOptions = {}): UseRAGReturn {
    const { currentOrganizationId } = useAuthStore()
    const organizationId = options.organizationId || currentOrganizationId

    // État
    const [results, setResults] = useState<RAGSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isIndexing, setIsIndexing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<RAGStats | null>(null)
    const [lastQuery, setLastQuery] = useState<string | null>(null)
    const [activeSources, setActiveSources] = useState<SourceType[]>(
        options.defaultSources || Object.values(SourceType)
    )

    /**
     * Toggle une source
     */
    const toggleSource = useCallback((source: SourceType) => {
        setActiveSources((prev) => {
            if (prev.includes(source)) {
                return prev.filter((s) => s !== source)
            }
            return [...prev, source]
        })
    }, [])

    /**
     * Recherche de chunks
     */
    const search = useCallback(
        async (
            query: string,
            searchOptions?: Partial<RAGSearchRequest>
        ): Promise<RAGSearchResponse> => {
            if (!organizationId) {
                const errorResponse: RAGSearchResponse = {
                    results: [],
                    total_chunks_searched: 0,
                    processing_time_ms: 0,
                    sources_included: [],
                }
                setError("No organization selected")
                return errorResponse
            }

            setIsSearching(true)
            setError(null)
            setLastQuery(query)

            try {
                const request: RAGSearchRequest = {
                    organization_id: organizationId,
                    query,
                    source_types: searchOptions?.source_types || activeSources,
                    document_ids: searchOptions?.document_ids,
                    lease_ids: searchOptions?.lease_ids,
                    property_ids: searchOptions?.property_ids,
                    tags: searchOptions?.tags,
                    limit: searchOptions?.limit || options.defaultLimit || 10,
                    min_score: searchOptions?.min_score || options.defaultMinScore || 0.5,
                }

                const response = await searchChunks(request)
                setResults(response.results)
                return response
            } catch (err) {
                const message = err instanceof Error ? err.message : "Search failed"
                setError(message)
                return {
                    results: [],
                    total_chunks_searched: 0,
                    processing_time_ms: 0,
                    sources_included: [],
                }
            } finally {
                setIsSearching(false)
            }
        },
        [organizationId, activeSources, options.defaultLimit, options.defaultMinScore]
    )

    /**
     * Effacer les résultats
     */
    const clearResults = useCallback(() => {
        setResults([])
        setLastQuery(null)
        setError(null)
    }, [])

    /**
     * Indexer un document
     */
    const indexDoc = useCallback(
        async (
            documentId: string,
            content: string,
            metadata?: { title?: string; type?: string }
        ): Promise<DocumentIndexStatus> => {
            if (!organizationId) {
                throw new Error("No organization selected")
            }

            setIsIndexing(true)
            setError(null)

            try {
                const status = await indexDocument(
                    documentId,
                    content,
                    {
                        source_title: metadata?.title || "",
                        document_type: metadata?.type,
                    },
                    organizationId
                )
                return status
            } catch (err) {
                const message = err instanceof Error ? err.message : "Indexing failed"
                setError(message)
                throw err
            } finally {
                setIsIndexing(false)
            }
        },
        [organizationId]
    )

    /**
     * Exclure/inclure un document du RAG
     */
    const excludeDocument = useCallback(
        async (documentId: string, exclude: boolean): Promise<void> => {
            try {
                await setDocumentExclusion(documentId, exclude)
                // Refresh stats after exclusion change
                await refreshStats()
            } catch (err) {
                const message = err instanceof Error ? err.message : "Exclusion failed"
                setError(message)
                throw err
            }
        },
        []
    )

    /**
     * Rafraîchir les statistiques
     */
    const refreshStats = useCallback(async (): Promise<void> => {
        if (!organizationId) return

        try {
            const newStats = await getRAGStats(organizationId)
            setStats(newStats)
        } catch (err) {
            console.error("Failed to refresh RAG stats:", err)
        }
    }, [organizationId])

    /**
     * Obtenir les chunks par document
     */
    const getChunksByDocument = useCallback(
        (documentId: string): RAGSearchResult[] => {
            return results.filter((r) => r.chunk.document_id === documentId)
        },
        [results]
    )

    /**
     * Obtenir les chunks par source
     */
    const getChunksBySource = useCallback(
        (sourceType: SourceType): RAGSearchResult[] => {
            return results.filter((r) => r.chunk.source_type === sourceType)
        },
        [results]
    )

    /**
     * Obtenir les toggles de source pour l'UI
     */
    const getSourceToggles = useCallback((): SourceToggle[] => {
        const sourceLabels: Record<SourceType, { label: string; icon: string }> = {
            [SourceType.DOCUMENT]: { label: "Documents", icon: "📄" },
            [SourceType.LEASE]: { label: "Baux", icon: "📋" },
            [SourceType.PROPERTY]: { label: "Propriétés", icon: "🏠" },
            [SourceType.TENANT]: { label: "Locataires", icon: "👤" },
            [SourceType.KPI]: { label: "KPIs", icon: "📊" },
            [SourceType.CONVERSATION]: { label: "Conversations", icon: "💬" },
        }

        return Object.values(SourceType).map((source) => ({
            source_type: source,
            label: sourceLabels[source].label,
            icon: sourceLabels[source].icon,
            enabled: activeSources.includes(source),
            count: stats?.chunks_by_source[source] || 0,
        }))
    }, [activeSources, stats])

    return {
        // État
        results,
        isSearching,
        isIndexing,
        error,
        stats,
        lastQuery,

        // Sources actives
        activeSources,
        setActiveSources,
        toggleSource,

        // Actions de recherche
        search,
        clearResults,

        // Actions d'indexation
        indexDoc,
        excludeDocument,

        // Statistiques
        refreshStats,

        // Helpers
        getChunksByDocument,
        getChunksBySource,
        getSourceToggles,
    }
}

/**
 * Hook simplifié pour recherche rapide
 */
export function useRAGSearch(query: string, options?: UseRAGOptions) {
    const rag = useRAG(options)

    // Mémoiser les résultats formatés
    const formattedResults = useMemo(() => {
        return rag.results.map((result) => ({
            id: result.chunk.id,
            content: result.chunk.content,
            score: result.score,
            source: result.chunk.source_type,
            documentId: result.chunk.document_id,
            title: result.chunk.metadata.source_title,
            highlights: result.highlights,
        }))
    }, [rag.results])

    return {
        ...rag,
        formattedResults,
    }
}
