import { SourceType } from "./document"

/**
 * RAG Types - Phase 4 Foundation
 * Chunking, vectorisation, indexation et recherche
 */

// Chunk Status
export enum ChunkStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    INDEXED = "indexed",
    FAILED = "failed",
    EXCLUDED = "excluded",
}

// Chunk représentant un fragment de document
export interface Chunk {
    id: string
    document_id: string
    lease_id?: string
    property_id?: string
    organization_id: string

    // Contenu
    content: string
    content_hash: string

    // Métadonnées de chunking
    chunk_index: number
    total_chunks: number
    start_offset: number
    end_offset: number

    // Source et type
    source_type: SourceType
    source_id: string // ID du document/bail/propriété source

    // Vectorisation
    embedding?: number[]
    embedding_model?: string

    // Tags sémantiques automatiques
    semantic_tags: string[]

    // Contrôle RAG
    status: ChunkStatus
    is_excluded: boolean // Exclusion manuelle du RAG

    // Métadonnées
    metadata: ChunkMetadata
    created_at: string
    updated_at: string
}

// Métadonnées enrichies du chunk
export interface ChunkMetadata {
    // Titre du document source
    source_title: string
    // Type de document (bail, facture, etc.)
    document_type?: string
    // Page (pour PDFs)
    page_number?: number
    // Section/heading détecté
    section_heading?: string
    // Langue détectée
    language?: string
    // Score de qualité du chunk
    quality_score?: number
    // Contexte additionnel
    context?: Record<string, unknown>
}

// Configuration de chunking par type de source
export interface ChunkingConfig {
    source_type: SourceType
    // Taille de chunk en tokens
    chunk_size: number
    // Chevauchement entre chunks
    chunk_overlap: number
    // Méthode de chunking
    chunking_method: ChunkingMethod
    // Séparateurs personnalisés
    separators?: string[]
}

export enum ChunkingMethod {
    // Découpage par taille fixe
    FIXED_SIZE = "fixed_size",
    // Découpage par paragraphes
    PARAGRAPH = "paragraph",
    // Découpage sémantique (titres, sections)
    SEMANTIC = "semantic",
    // Découpage par sentences
    SENTENCE = "sentence",
    // Récursif (essaie différents séparateurs)
    RECURSIVE = "recursive",
}

// Configuration RAG globale
export interface RAGConfig {
    organization_id: string

    // Modèle d'embedding
    embedding_model: EmbeddingModel

    // Configurations de chunking par source
    chunking_configs: Record<SourceType, ChunkingConfig>

    // Visibilité des sources dans les recherches
    source_visibility: Record<SourceType, boolean>

    // Documents exclus manuellement
    excluded_document_ids: string[]

    // Tags pour filtrer
    tag_filters: string[]

    // Paramètres de recherche
    search_config: SearchConfig
}

export enum EmbeddingModel {
    OPENAI_ADA = "text-embedding-ada-002",
    OPENAI_3_SMALL = "text-embedding-3-small",
    OPENAI_3_LARGE = "text-embedding-3-large",
    COHERE_MULTILINGUAL = "embed-multilingual-v3.0",
    VOYAGE_LARGE = "voyage-large-2-instruct",
}

// Configuration de recherche
export interface SearchConfig {
    // Nombre de chunks à retourner
    top_k: number
    // Score minimum de similarité
    min_similarity: number
    // Reranking activé
    use_reranking: boolean
    // Modèle de reranking
    reranking_model?: string
    // Expansion de requête
    use_query_expansion: boolean
}

// Requête de recherche RAG
export interface RAGSearchRequest {
    organization_id: string
    query: string
    // Filtres de source
    source_types?: SourceType[]
    // Filtres par document/bail/propriété
    document_ids?: string[]
    lease_ids?: string[]
    property_ids?: string[]
    // Filtres par tags
    tags?: string[]
    // Limite de résultats
    limit?: number
    // Score minimum
    min_score?: number
}

// Résultat de recherche RAG
export interface RAGSearchResult {
    chunk: Chunk
    score: number
    // Highlights pour affichage
    highlights?: string[]
    // Contexte étendu (chunks adjacents)
    context_before?: string
    context_after?: string
}

// Réponse de recherche RAG
export interface RAGSearchResponse {
    results: RAGSearchResult[]
    total_chunks_searched: number
    query_embedding?: number[]
    processing_time_ms: number
    // Sources utilisées
    sources_included: SourceType[]
}

// État d'indexation d'un document
export interface DocumentIndexStatus {
    document_id: string
    status: IndexStatus
    chunks_count: number
    chunks_indexed: number
    last_indexed_at?: string
    error_message?: string
}

export enum IndexStatus {
    NOT_INDEXED = "not_indexed",
    INDEXING = "indexing",
    INDEXED = "indexed",
    PARTIAL = "partial",
    FAILED = "failed",
    EXCLUDED = "excluded",
}

// Statistiques RAG par organisation
export interface RAGStats {
    organization_id: string
    total_chunks: number
    chunks_by_source: Record<SourceType, number>
    documents_indexed: number
    documents_excluded: number
    last_index_update: string
    storage_used_bytes: number
}

// Job d'indexation
export interface IndexingJob {
    id: string
    organization_id: string
    document_ids: string[]
    status: JobStatus
    progress: number
    started_at: string
    completed_at?: string
    error?: string
}

export enum JobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
}

// Toggle de source pour l'UI
export interface SourceToggle {
    source_type: SourceType
    label: string
    icon: string
    enabled: boolean
    count: number
}

// État du contexte RAG
export interface RAGContextState {
    config: RAGConfig | null
    stats: RAGStats | null
    sourceToggles: SourceToggle[]
    excludedDocuments: Set<string>
    isLoading: boolean
    error: string | null
}
