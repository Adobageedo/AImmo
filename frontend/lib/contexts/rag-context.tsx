"use client"

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from "react"
import { SourceType } from "@/lib/types/document"
import {
    RAGConfig,
    RAGStats,
    SourceToggle,
    SearchConfig,
    EmbeddingModel,
    RAGContextState,
} from "@/lib/types/rag"
import { DEFAULT_CHUNKING_CONFIGS, getRAGStats, setDocumentExclusion } from "@/lib/rag"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * RAG Context - Phase 4 Foundation
 * Toggles visibilité, inclusion/exclusion de documents
 */

interface RAGContextType extends RAGContextState {
    // Toggles de visibilité par source
    toggleSourceVisibility: (source: SourceType) => void
    setSourceVisibility: (source: SourceType, visible: boolean) => void
    isSourceVisible: (source: SourceType) => boolean
    getVisibleSources: () => SourceType[]

    // Exclusion de documents
    excludeDocument: (documentId: string) => void
    includeDocument: (documentId: string) => void
    isDocumentExcluded: (documentId: string) => boolean
    toggleDocumentExclusion: (documentId: string) => void

    // Configuration
    updateConfig: (updates: Partial<RAGConfig>) => void
    updateSearchConfig: (updates: Partial<SearchConfig>) => void

    // Rafraîchissement
    refreshStats: () => Promise<void>
    refreshConfig: () => Promise<void>
}

const RAGContext = createContext<RAGContextType | undefined>(undefined)

// Configuration par défaut
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
    top_k: 10,
    min_similarity: 0.5,
    use_reranking: false,
    use_query_expansion: false,
}

const DEFAULT_SOURCE_VISIBILITY: Record<SourceType, boolean> = {
    [SourceType.DOCUMENT]: true,
    [SourceType.LEASE]: true,
    [SourceType.PROPERTY]: true,
    [SourceType.TENANT]: true,
    [SourceType.KPI]: true,
    [SourceType.CONVERSATION]: true,
}

interface RAGProviderProps {
    children: React.ReactNode
    initialConfig?: Partial<RAGConfig>
}

export function RAGProvider({ children, initialConfig }: RAGProviderProps) {
    const { currentOrganizationId } = useAuthStore()

    // État principal
    const [config, setConfig] = useState<RAGConfig | null>(null)
    const [stats, setStats] = useState<RAGStats | null>(null)
    const [excludedDocuments, setExcludedDocuments] = useState<Set<string>>(new Set())
    const [sourceVisibility, setSourceVisibility] = useState<Record<SourceType, boolean>>(
        DEFAULT_SOURCE_VISIBILITY
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initialiser la config quand l'org change
    useEffect(() => {
        if (currentOrganizationId) {
            const defaultConfig: RAGConfig = {
                organization_id: currentOrganizationId,
                embedding_model: EmbeddingModel.OPENAI_3_SMALL,
                chunking_configs: DEFAULT_CHUNKING_CONFIGS,
                source_visibility: { ...DEFAULT_SOURCE_VISIBILITY },
                excluded_document_ids: [],
                tag_filters: [],
                search_config: DEFAULT_SEARCH_CONFIG,
                ...initialConfig,
            }
            setConfig(defaultConfig)
            setSourceVisibility(defaultConfig.source_visibility)
            setExcludedDocuments(new Set(defaultConfig.excluded_document_ids))

            // Charger les stats
            refreshStats()
        }
    }, [currentOrganizationId, initialConfig])

    /**
     * Rafraîchir les statistiques
     */
    const refreshStats = useCallback(async () => {
        if (!currentOrganizationId) return

        setIsLoading(true)
        setError(null)

        try {
            const newStats = await getRAGStats(currentOrganizationId)
            setStats(newStats)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load RAG stats")
        } finally {
            setIsLoading(false)
        }
    }, [currentOrganizationId])

    /**
     * Rafraîchir la config (depuis le serveur si nécessaire)
     */
    const refreshConfig = useCallback(async () => {
        // TODO: Charger la config depuis le serveur si persistée
        await refreshStats()
    }, [refreshStats])

    /**
     * Toggle la visibilité d'une source
     */
    const toggleSourceVisibility = useCallback((source: SourceType) => {
        setSourceVisibility((prev) => {
            const newVisibility = { ...prev, [source]: !prev[source] }
            // Mettre à jour la config
            setConfig((prevConfig) =>
                prevConfig
                    ? { ...prevConfig, source_visibility: newVisibility }
                    : prevConfig
            )
            return newVisibility
        })
    }, [])

    /**
     * Définir la visibilité d'une source
     */
    const setSourceVisibilityValue = useCallback(
        (source: SourceType, visible: boolean) => {
            setSourceVisibility((prev) => {
                const newVisibility = { ...prev, [source]: visible }
                setConfig((prevConfig) =>
                    prevConfig
                        ? { ...prevConfig, source_visibility: newVisibility }
                        : prevConfig
                )
                return newVisibility
            })
        },
        []
    )

    /**
     * Vérifier si une source est visible
     */
    const isSourceVisible = useCallback(
        (source: SourceType): boolean => {
            return sourceVisibility[source] ?? true
        },
        [sourceVisibility]
    )

    /**
     * Obtenir les sources visibles
     */
    const getVisibleSources = useCallback((): SourceType[] => {
        return Object.entries(sourceVisibility)
            .filter(([_, visible]) => visible)
            .map(([source]) => source as SourceType)
    }, [sourceVisibility])

    /**
     * Exclure un document du RAG
     */
    const excludeDocument = useCallback(
        async (documentId: string) => {
            setExcludedDocuments((prev) => {
                const newSet = new Set(prev)
                newSet.add(documentId)
                return newSet
            })

            // Persister l'exclusion
            try {
                await setDocumentExclusion(documentId, true)
            } catch (err) {
                console.error("Failed to exclude document:", err)
                // Rollback
                setExcludedDocuments((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(documentId)
                    return newSet
                })
            }
        },
        []
    )

    /**
     * Inclure un document dans le RAG
     */
    const includeDocument = useCallback(
        async (documentId: string) => {
            setExcludedDocuments((prev) => {
                const newSet = new Set(prev)
                newSet.delete(documentId)
                return newSet
            })

            // Persister l'inclusion
            try {
                await setDocumentExclusion(documentId, false)
            } catch (err) {
                console.error("Failed to include document:", err)
                // Rollback
                setExcludedDocuments((prev) => {
                    const newSet = new Set(prev)
                    newSet.add(documentId)
                    return newSet
                })
            }
        },
        []
    )

    /**
     * Vérifier si un document est exclu
     */
    const isDocumentExcluded = useCallback(
        (documentId: string): boolean => {
            return excludedDocuments.has(documentId)
        },
        [excludedDocuments]
    )

    /**
     * Toggle l'exclusion d'un document
     */
    const toggleDocumentExclusion = useCallback(
        (documentId: string) => {
            if (excludedDocuments.has(documentId)) {
                includeDocument(documentId)
            } else {
                excludeDocument(documentId)
            }
        },
        [excludedDocuments, includeDocument, excludeDocument]
    )

    /**
     * Mettre à jour la config
     */
    const updateConfig = useCallback((updates: Partial<RAGConfig>) => {
        setConfig((prev) => (prev ? { ...prev, ...updates } : prev))
    }, [])

    /**
     * Mettre à jour la config de recherche
     */
    const updateSearchConfig = useCallback((updates: Partial<SearchConfig>) => {
        setConfig((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                search_config: { ...prev.search_config, ...updates },
            }
        })
    }, [])

    /**
     * Générer les toggles de source pour l'UI
     */
    const sourceToggles = useMemo((): SourceToggle[] => {
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
            enabled: sourceVisibility[source] ?? true,
            count: stats?.chunks_by_source[source] || 0,
        }))
    }, [sourceVisibility, stats])

    const contextValue: RAGContextType = {
        // État
        config,
        stats,
        sourceToggles,
        excludedDocuments,
        isLoading,
        error,

        // Toggles de visibilité
        toggleSourceVisibility,
        setSourceVisibility: setSourceVisibilityValue,
        isSourceVisible,
        getVisibleSources,

        // Exclusion de documents
        excludeDocument,
        includeDocument,
        isDocumentExcluded,
        toggleDocumentExclusion,

        // Configuration
        updateConfig,
        updateSearchConfig,

        // Rafraîchissement
        refreshStats,
        refreshConfig,
    }

    return <RAGContext.Provider value={contextValue}>{children}</RAGContext.Provider>
}

/**
 * Hook pour utiliser le contexte RAG
 */
export function useRAGContext(): RAGContextType {
    const context = useContext(RAGContext)
    if (!context) {
        throw new Error("useRAGContext must be used within a RAGProvider")
    }
    return context
}

/**
 * Hook simplifié pour les toggles de source
 */
export function useSourceToggles() {
    const { sourceToggles, toggleSourceVisibility, isSourceVisible, getVisibleSources } =
        useRAGContext()

    return {
        toggles: sourceToggles,
        toggle: toggleSourceVisibility,
        isVisible: isSourceVisible,
        visibleSources: getVisibleSources(),
    }
}

/**
 * Hook simplifié pour l'exclusion de documents
 */
export function useDocumentExclusion() {
    const {
        excludedDocuments,
        excludeDocument,
        includeDocument,
        isDocumentExcluded,
        toggleDocumentExclusion,
    } = useRAGContext()

    return {
        excluded: excludedDocuments,
        exclude: excludeDocument,
        include: includeDocument,
        isExcluded: isDocumentExcluded,
        toggle: toggleDocumentExclusion,
    }
}
