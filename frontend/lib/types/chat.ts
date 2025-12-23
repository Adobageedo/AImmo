import { SourceType } from "./document"

/**
 * Chat Types - Phase 5 Chat MVP
 * Types pour le chat avec RAG et streaming
 */

// Rôle du message
export enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
}

// Mode de chat
export enum ChatMode {
    NORMAL = "normal",
    RAG_ONLY = "rag_only",
    RAG_ENHANCED = "rag_enhanced",
}

// Format d'export
export enum ExportFormat {
    EXCEL = "excel",
    PDF = "pdf",
    MARKDOWN = "markdown",
    JSON = "json",
}

// Citation/Référence source
export interface Citation {
    id: string
    chunk_id: string
    document_id: string
    document_title: string
    content_preview: string
    page_number?: number
    source_type: SourceType
    relevance_score: number
    url?: string
}

// Message
export interface Message {
    id: string
    conversation_id: string
    role: MessageRole
    content: string
    citations: Citation[]
    metadata?: Record<string, unknown>
    created_at: string
}

// Conversation
export interface Conversation {
    id: string
    title: string
    organization_id: string
    user_id: string
    messages_count: number
    last_message_at?: string
    created_at: string
    updated_at: string
}

// Conversation avec messages
export interface ConversationWithMessages extends Conversation {
    messages: Message[]
}

// Requête de création de conversation
export interface ConversationCreateRequest {
    title: string
    organization_id: string
    initial_message?: string
}

// Requête de mise à jour de conversation
export interface ConversationUpdateRequest {
    title?: string
}

// Requête de chat
export interface ChatRequest {
    conversation_id: string
    message: string
    mode: ChatMode
    source_types?: SourceType[]
    document_ids?: string[]
    lease_ids?: string[]
    property_ids?: string[]
    include_citations?: boolean
    max_citations?: number
    stream?: boolean
}

// Réponse de chat
export interface ChatResponse {
    message: Message
    citations: Citation[]
    rag_results?: ChatRAGResult[]
    processing_time_ms: number
}

// Chunk de streaming
export interface StreamChunk {
    type: "content" | "citation" | "done" | "error"
    content?: string
    citation?: Citation
    error?: string
}

// Résultat de recherche RAG (simplifié pour le chat)
export interface ChatRAGResult {
    chunk_id: string
    document_id: string
    content: string
    score: number
    source_type: SourceType
    metadata: {
        source_title: string
        page_number?: number
    }
    semantic_tags: string[]
    highlights?: string[]
}

// Catégorie de suggestion
export enum PromptCategory {
    LEASE_ANALYSIS = "lease_analysis",
    PROPERTY_COMPARISON = "property_comparison",
    FINANCIAL_REPORT = "financial_report",
    GENERAL = "general",
}

// Suggestion de prompt
export interface PromptSuggestion {
    id: string
    category: PromptCategory
    title: string
    prompt: string
    icon: string
}

// État du chat
export interface ChatState {
    conversation: Conversation | null
    messages: Message[]
    isLoading: boolean
    isStreaming: boolean
    error: string | null
    activeSources: SourceType[]
    mode: ChatMode
}

// Options du canvas
export interface CanvasContent {
    markdown: string
    tables: Array<{
        headers: string[]
        rows: string[][]
    }>
    metadata?: Record<string, unknown>
}

// Requête de résumé de bail
export interface LeaseSummaryRequest {
    lease_id: string
    include_key_dates?: boolean
    include_financials?: boolean
    include_clauses?: boolean
}

// Réponse de résumé de bail
export interface LeaseSummaryResponse {
    lease_id: string
    summary: string
    key_dates?: Record<string, string>
    financials?: Record<string, unknown>
    important_clauses?: string[]
}

// Requête de comparaison de biens
export interface PropertyComparisonRequest {
    property_ids: string[]
    criteria?: string[]
}

// Réponse de comparaison
export interface PropertyComparisonResponse {
    properties: Array<Record<string, unknown>>
    comparison_table: Record<string, unknown[]>
    analysis: string
}

// Requête de génération de tableau
export interface TableGenerationRequest {
    query: string
    columns?: string[]
    source_types?: SourceType[]
}

// Réponse de génération de tableau
export interface TableGenerationResponse {
    headers: string[]
    rows: unknown[][]
    summary?: string
}

// Requête d'export
export interface ExportRequest {
    conversation_id?: string
    content?: string
    format: ExportFormat
    include_citations?: boolean
}

// Réponse d'export
export interface ExportResponse {
    file_url: string
    file_name: string
    format: ExportFormat
    expires_at: string
}
