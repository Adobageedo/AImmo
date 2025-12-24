import { apiClient } from "./api-client"
import { SourceType } from "./types/document"
import { useAuthStore } from "./store/auth-store"
import {
    Conversation,
    ConversationWithMessages,
    ConversationCreateRequest,
    ConversationUpdateRequest,
    ChatRequest,
    ChatResponse,
    ChatMode,
    StreamChunk,
    PromptSuggestion,
    LeaseSummaryRequest,
    LeaseSummaryResponse,
    PropertyComparisonRequest,
    PropertyComparisonResponse,
    TableGenerationRequest,
    TableGenerationResponse,
    ExportRequest,
    ExportResponse,
} from "./types/chat"

/**
 * Chat Service - Phase 5 Chat MVP
 * Pre-call API métier, sélection RAG, mode RAG only
 */

const BASE_URL = "/chat"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

// ============================================
// Conversations CRUD
// ============================================

/**
 * Crée une nouvelle conversation
 */
export async function createConversation(
    request: ConversationCreateRequest
): Promise<Conversation> {
    return apiClient.post<Conversation>(`${BASE_URL}/`, request)
}

/**
 * Liste les conversations d'une organisation
 */
export async function listConversations(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>(
        `${BASE_URL}/?organization_id=${organizationId}&limit=${limit}&offset=${offset}`
    )
}

/**
 * Récupère une conversation avec ses messages
 */
export async function getConversation(
    conversationId: string
): Promise<ConversationWithMessages> {
    return apiClient.get<ConversationWithMessages>(`${BASE_URL}/${conversationId}`)
}

/**
 * Met à jour une conversation (rename)
 */
export async function updateConversation(
    conversationId: string,
    request: ConversationUpdateRequest
): Promise<Conversation> {
    return apiClient.put<Conversation>(`${BASE_URL}/${conversationId}`, request)
}

/**
 * Supprime une conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${conversationId}`)
}

// ============================================
// Chat
// ============================================

/**
 * Envoie un message et reçoit une réponse
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>(`${BASE_URL}/chat`, request)
}

/**
 * Envoie un message et reçoit une réponse en streaming
 */
export async function* sendMessageStream(
    request: ChatRequest
): AsyncGenerator<StreamChunk, void, unknown> {
    const token = useAuthStore.getState().accessToken

    console.log("[STREAMING DEBUG] Token present:", !!token)
    console.log("[STREAMING DEBUG] Request:", { conversationId: request.conversation_id, messageLength: request.message.length })

    const response = await fetch(`${API_BASE_URL}${BASE_URL}/chat/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...request, stream: true }),
    })

    console.log("[STREAMING DEBUG] Response status:", response.status)
    console.log("[STREAMING DEBUG] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
        yield { type: "error", error: `HTTP ${response.status}` }
        return
    }

    const reader = response.body?.getReader()
    if (!reader) {
        yield { type: "error", error: "No response body" }
        return
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let chunkCount = 0

    console.log("[STREAMING DEBUG] Starting to read stream...")

    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            console.log("[STREAMING DEBUG] Stream done, total chunks:", chunkCount)
            break
        }

        const decoded = decoder.decode(value, { stream: true })
        console.log("[STREAMING DEBUG] Received raw data:", decoded.substring(0, 100))
        buffer += decoded

        // Parse SSE events
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
            if (line.startsWith("data: ")) {
                try {
                    const data = JSON.parse(line.slice(6))
                    chunkCount++
                    console.log("[STREAMING DEBUG] Chunk #" + chunkCount + ":", data.type)
                    yield data as StreamChunk
                } catch (e) {
                    console.error("[STREAMING DEBUG] Parse error:", e, "Line:", line)
                }
            }
        }
    }
}

// ============================================
// Pre-call API Métier
// ============================================

/**
 * Détecte l'intention de la requête pour pré-appeler les APIs métier
 */
export function detectIntent(
    message: string
): { type: string; params: Record<string, unknown> } | null {
    const lowerMessage = message.toLowerCase()

    // Résumé de bail
    if (
        lowerMessage.includes("résume") &&
        (lowerMessage.includes("bail") || lowerMessage.includes("contrat"))
    ) {
        return { type: "lease_summary", params: {} }
    }

    // Comparaison de biens
    if (lowerMessage.includes("compare") && lowerMessage.includes("bien")) {
        return { type: "property_comparison", params: {} }
    }

    // Tableau / Liste
    if (
        lowerMessage.includes("tableau") ||
        lowerMessage.includes("liste") ||
        lowerMessage.includes("récapitulatif")
    ) {
        return { type: "table_generation", params: {} }
    }

    // Expiration de baux
    if (lowerMessage.includes("expir") && lowerMessage.includes("bail")) {
        return { type: "lease_expiry", params: {} }
    }

    // Impayés
    if (lowerMessage.includes("impayé") || lowerMessage.includes("retard")) {
        return { type: "unpaid_rent", params: {} }
    }

    return null
}

/**
 * Construit une requête de chat optimisée selon le mode et les filtres
 */
export function buildChatRequest(
    conversationId: string,
    message: string,
    options: {
        mode?: ChatMode
        sourceTypes?: SourceType[]
        documentIds?: string[]
        leaseIds?: string[]
        propertyIds?: string[]
        includeCitations?: boolean
        maxCitations?: number
    } = {}
): ChatRequest {
    return {
        conversation_id: conversationId,
        message,
        mode: options.mode || ChatMode.RAG_ENHANCED,
        source_types: options.sourceTypes,
        document_ids: options.documentIds,
        lease_ids: options.leaseIds,
        property_ids: options.propertyIds,
        include_citations: options.includeCitations ?? true,
        max_citations: options.maxCitations ?? 5,
        stream: false,
    }
}

// ============================================
// Capacités Spéciales
// ============================================

/**
 * Génère un résumé de bail
 */
export async function summarizeLease(
    request: LeaseSummaryRequest
): Promise<LeaseSummaryResponse> {
    return apiClient.post<LeaseSummaryResponse>(`${BASE_URL}/summarize-lease`, request)
}

/**
 * Compare des biens immobiliers
 */
export async function compareProperties(
    request: PropertyComparisonRequest,
    organizationId: string
): Promise<PropertyComparisonResponse> {
    return apiClient.post<PropertyComparisonResponse>(
        `${BASE_URL}/compare-properties?organization_id=${organizationId}`,
        request
    )
}

/**
 * Génère un tableau
 */
export async function generateTable(
    request: TableGenerationRequest,
    organizationId: string
): Promise<TableGenerationResponse> {
    return apiClient.post<TableGenerationResponse>(
        `${BASE_URL}/generate-table?organization_id=${organizationId}`,
        request
    )
}

// ============================================
// Suggestions
// ============================================

/**
 * Récupère les suggestions de prompts
 */
export async function getPromptSuggestions(): Promise<PromptSuggestion[]> {
    return apiClient.get<PromptSuggestion[]>(`${BASE_URL}/suggestions`)
}

// ============================================
// Export
// ============================================

/**
 * Exporte une conversation ou du contenu
 */
export async function exportContent(request: ExportRequest): Promise<ExportResponse> {
    return apiClient.post<ExportResponse>(`${BASE_URL}/export`, request)
}

/**
 * Génère un export Excel à partir d'un tableau
 */
export function downloadTableAsExcel(
    headers: string[],
    rows: unknown[][],
    filename: string = "export.xlsx"
): void {
    // Créer le contenu CSV (pour simplicité, XLSX nécessiterait une lib)
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename.replace(".xlsx", ".csv"))
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Génère un export PDF à partir de markdown
 */
export function downloadMarkdownAsPDF(
    markdown: string,
    filename: string = "export.pdf"
): void {
    // Pour le PDF, on ouvre une nouvelle fenêtre avec le markdown formaté
    // Une vraie implémentation utiliserait une lib comme jsPDF ou html2pdf
    const printWindow = window.open("", "_blank")
    if (printWindow) {
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
            pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <pre>${markdown}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `)
        printWindow.document.close()
    }
}
