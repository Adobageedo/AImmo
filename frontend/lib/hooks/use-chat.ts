"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SourceType } from "@/lib/types/document"
import {
    Message,
    MessageRole,
    Conversation,
    ConversationWithMessages,
    ChatMode,
    ChatRequest,
    ChatResponse,
    StreamChunk,
    Citation,
    PromptSuggestion,
} from "@/lib/types/chat"
import {
    createConversation,
    listConversations,
    getConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    sendMessageStream,
    buildChatRequest,
    detectIntent,
    getPromptSuggestions,
} from "@/lib/chat-service"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * Hook useChat - Interaction Chat + RAG
 * Phase 5: Chat MVP
 */

interface UseChatOptions {
    organizationId?: string
    defaultMode?: ChatMode
    autoLoadSuggestions?: boolean
}

interface UseChatReturn {
    // État
    conversation: Conversation | null
    messages: Message[]
    isLoading: boolean
    isStreaming: boolean
    streamingContent: string
    error: string | null

    // Conversations
    conversations: Conversation[]
    loadConversations: () => Promise<void>
    selectConversation: (id: string) => Promise<void>
    createNewConversation: (title?: string) => Promise<Conversation>
    renameConversation: (id: string, title: string) => Promise<void>
    removeConversation: (id: string) => Promise<void>

    // Messages
    sendUserMessage: (message: string, options?: SendMessageOptions) => Promise<void>
    clearMessages: () => void

    // Mode et filtres
    mode: ChatMode
    setMode: (mode: ChatMode) => void
    activeSources: SourceType[]
    setActiveSources: (sources: SourceType[]) => void
    toggleSource: (source: SourceType) => void

    // Suggestions
    suggestions: PromptSuggestion[]
    loadSuggestions: () => Promise<void>

    // Citations
    citations: Citation[]

    // Helpers
    stopStreaming: () => void
    retryLastMessage: () => Promise<void>
}

interface SendMessageOptions {
    mode?: ChatMode
    sourceTypes?: SourceType[]
    documentIds?: string[]
    leaseIds?: string[]
    stream?: boolean
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { currentOrganizationId } = useAuthStore()
    const organizationId = options.organizationId || currentOrganizationId

    // État
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<ChatMode>(options.defaultMode || ChatMode.RAG_ENHANCED)
    const [activeSources, setActiveSources] = useState<SourceType[]>(Object.values(SourceType))
    const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
    const [citations, setCitations] = useState<Citation[]>([])

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null)
    const lastMessageRef = useRef<string>("")

    // Charger les suggestions au montage
    useEffect(() => {
        if (options.autoLoadSuggestions !== false) {
            loadSuggestions()
        }
    }, [])

    /**
     * Charger les conversations
     */
    const loadConversations = useCallback(async () => {
        if (!organizationId) return

        try {
            const convs = await listConversations(organizationId)
            setConversations(convs)
        } catch (err) {
            console.error("Failed to load conversations:", err)
        }
    }, [organizationId])

    /**
     * Sélectionner une conversation
     */
    const selectConversation = useCallback(async (id: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const conv = await getConversation(id)
            setConversation(conv)
            setMessages(conv.messages)

            // Extraire les citations des messages
            const allCitations = conv.messages.flatMap((m) => m.citations || [])
            setCitations(allCitations)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load conversation")
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Créer une nouvelle conversation
     */
    const createNewConversation = useCallback(
        async (title?: string): Promise<Conversation> => {
            if (!organizationId) throw new Error("No organization selected")

            const conv = await createConversation({
                title: title || "Nouvelle conversation",
                organization_id: organizationId,
            })

            setConversation(conv)
            setMessages([])
            setCitations([])
            setConversations((prev) => [conv, ...prev])

            return conv
        },
        [organizationId]
    )

    /**
     * Renommer une conversation
     */
    const renameConversation = useCallback(async (id: string, title: string) => {
        await updateConversation(id, { title })
        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
        )
        if (conversation?.id === id) {
            setConversation((prev) => (prev ? { ...prev, title } : prev))
        }
    }, [conversation])

    /**
     * Supprimer une conversation
     */
    const removeConversation = useCallback(
        async (id: string) => {
            await deleteConversation(id)
            setConversations((prev) => prev.filter((c) => c.id !== id))
            if (conversation?.id === id) {
                setConversation(null)
                setMessages([])
                setCitations([])
            }
        },
        [conversation]
    )

    /**
     * Envoyer un message
     */
    const sendUserMessage = useCallback(
        async (message: string, sendOptions: SendMessageOptions = {}) => {
            if (!conversation) {
                // Créer une conversation automatiquement
                const newConv = await createNewConversation(message.slice(0, 50))
                return sendUserMessage(message, sendOptions)
            }

            lastMessageRef.current = message
            setIsLoading(true)
            setError(null)

            // Ajouter le message utilisateur localement
            const userMessage: Message = {
                id: `temp-${Date.now()}`,
                conversation_id: conversation.id,
                role: MessageRole.USER,
                content: message,
                citations: [],
                created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, userMessage])

            try {
                const chatMode = sendOptions.mode || mode
                const useStream = sendOptions.stream ?? true

                const request = buildChatRequest(conversation.id, message, {
                    mode: chatMode,
                    sourceTypes: sendOptions.sourceTypes || activeSources,
                    documentIds: sendOptions.documentIds,
                    leaseIds: sendOptions.leaseIds,
                    includeCitations: true,
                    maxCitations: 5,
                })

                if (useStream) {
                    // Streaming
                    setIsStreaming(true)
                    setStreamingContent("")
                    abortControllerRef.current = new AbortController()

                    let fullContent = ""
                    const streamCitations: Citation[] = []

                    for await (const chunk of sendMessageStream(request)) {
                        if (chunk.type === "content" && chunk.content) {
                            fullContent += chunk.content
                            setStreamingContent(fullContent)
                        } else if (chunk.type === "citation" && chunk.citation) {
                            streamCitations.push(chunk.citation)
                        } else if (chunk.type === "done") {
                            // Ajouter le message assistant
                            const assistantMessage: Message = {
                                id: `msg-${Date.now()}`,
                                conversation_id: conversation.id,
                                role: MessageRole.ASSISTANT,
                                content: fullContent,
                                citations: streamCitations,
                                created_at: new Date().toISOString(),
                            }
                            setMessages((prev) => [...prev, assistantMessage])
                            setCitations((prev) => [...prev, ...streamCitations])
                            setStreamingContent("")
                        } else if (chunk.type === "error") {
                            throw new Error(chunk.error)
                        }
                    }

                    setIsStreaming(false)
                } else {
                    // Non-streaming
                    const response = await sendMessage(request)

                    setMessages((prev) => [...prev, response.message])
                    setCitations((prev) => [...prev, ...response.citations])
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to send message")
                // Retirer le message utilisateur en cas d'erreur
                setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
            } finally {
                setIsLoading(false)
                setIsStreaming(false)
            }
        },
        [conversation, mode, activeSources, createNewConversation]
    )

    /**
     * Effacer les messages
     */
    const clearMessages = useCallback(() => {
        setMessages([])
        setCitations([])
        setConversation(null)
    }, [])

    /**
     * Toggle une source
     */
    const toggleSource = useCallback((source: SourceType) => {
        setActiveSources((prev) =>
            prev.includes(source)
                ? prev.filter((s) => s !== source)
                : [...prev, source]
        )
    }, [])

    /**
     * Charger les suggestions
     */
    const loadSuggestions = useCallback(async () => {
        try {
            const suggs = await getPromptSuggestions()
            setSuggestions(suggs)
        } catch (err) {
            console.error("Failed to load suggestions:", err)
        }
    }, [])

    /**
     * Arrêter le streaming
     */
    const stopStreaming = useCallback(() => {
        abortControllerRef.current?.abort()
        setIsStreaming(false)
        setStreamingContent("")
    }, [])

    /**
     * Réessayer le dernier message
     */
    const retryLastMessage = useCallback(async () => {
        if (lastMessageRef.current) {
            // Retirer le dernier message d'erreur si présent
            setMessages((prev) => prev.slice(0, -1))
            await sendUserMessage(lastMessageRef.current)
        }
    }, [sendUserMessage])

    return {
        // État
        conversation,
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,

        // Conversations
        conversations,
        loadConversations,
        selectConversation,
        createNewConversation,
        renameConversation,
        removeConversation,

        // Messages
        sendUserMessage,
        clearMessages,

        // Mode et filtres
        mode,
        setMode,
        activeSources,
        setActiveSources,
        toggleSource,

        // Suggestions
        suggestions,
        loadSuggestions,

        // Citations
        citations,

        // Helpers
        stopStreaming,
        retryLastMessage,
    }
}

export default useChat
