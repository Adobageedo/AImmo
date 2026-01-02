"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SourceType } from "@/lib/types/document"
import {
    Message,
    MessageRole,
    Conversation,
    ChatMode,
    StreamChunk,
    Citation,
    PromptSuggestion,
    PromptCategory,
    ChatRequest,
} from "@/lib/types/chat"
import { chatSDKService } from "@/lib/services/chat-sdk-service"
import { supabaseChatService } from "@/lib/services/supabase-chat-service"
import { exportService } from "@/lib/services/export-service"
import { exportConversationExcel, exportConversationPDF } from "@/lib/services/chat-sdk-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { createClient } from "@/lib/supabase/client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface UseChatMvpOptions {
    defaultMode?: ChatMode
    autoLoadSuggestions?: boolean
}

interface UseChatMvpReturn {
    // Messages
    messages: Message[]
    isLoading: boolean
    isStreaming: boolean
    streamingContent: string
    error: string | null

    // Conversations
    conversation: Conversation | null
    conversations: Conversation[]
    loadConversations: () => Promise<void>
    selectConversation: (id: string) => Promise<void>
    createNewConversation: (title?: string, initial_message?: string) => Promise<Conversation>
    renameConversation: (id: string, title: string) => Promise<void>
    removeConversation: (id: string) => Promise<void>

    // Messages
    sendUserMessage: (message: string, options?: SendMessageOptions) => Promise<void>
    clearMessages: () => void
    resetConversation: () => void

    // Mode et sources (simplifié)
    mode: ChatMode
    setMode: (mode: ChatMode) => void

    // Suggestions
    suggestions: PromptSuggestion[]
    loadSuggestions: () => Promise<void>

    // Citations
    citations: Citation[]
    activeCitation: Citation | null
    selectCitation: (citation: Citation | null) => void

    // Streaming
    stopStreaming: () => void
    retryLastMessage: () => void

    // Exports
    exportToExcel: () => Promise<void>
    exportToPDF: () => Promise<void>
}

interface SendMessageOptions {
    mode?: ChatMode
    requestedSources?: SourceType[]  // Sources RAG demandées (liste vide = aucune)
    documentIds?: string[]
    leaseIds?: string[]
    propertyIds?: string[]
    stream?: boolean
}

export function useChatMvp(options: UseChatMvpOptions = {}): UseChatMvpReturn {
    // Récupérer l'organization ID de l'utilisateur connecté
    const [organizationId, setOrganizationId] = useState<string>("2ae56144-9fc7-42c9-9754-46db21644c68")
    
    // Charger l'organization ID au montage
    useEffect(() => {
        const loadUserOrganization = async () => {
            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                
                if (session?.user?.id) {
                    // Récupérer la première organisation de l'utilisateur
                    const { data } = await supabase
                        .from('organization_users')
                        .select('organization_id')
                        .eq('user_id', session.user.id)
                        .limit(1)
                        .single()
                    
                    if (data) {
                        setOrganizationId(data.organization_id)
                    } else {
                        console.error('❌ No organization found for user')
                        // Fallback sur l'organization ID de test
                        setOrganizationId("2ae56144-9fc7-42c9-9754-46db21644c68")
                    }
                }
            } catch (error) {
                console.error('❌ Error loading user organization:', error)
                // Fallback sur l'organization ID de test
                setOrganizationId("2ae56144-9fc7-42c9-9754-46db21644c68")
            }
        }
        
        loadUserOrganization()
    }, [])
    
    const [messages, setMessages] = useState<Message[]>([])
    const [conversation, setConversation] = useState<Conversation | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<ChatMode>(options.defaultMode || ChatMode.NORMAL)
    const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
    const [citations, setCitations] = useState<Citation[]>([])
    const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null)
    const lastMessageRef = useRef<string>("")

    // Charger les conversations et suggestions au montage
    useEffect(() => {
        if (organizationId) {
            loadConversations()
            if (options.autoLoadSuggestions !== false) {
                loadSuggestions()
            }
        }
    }, [organizationId])

    /**
     * Charger les conversations
     */
    const loadConversations = useCallback(async () => {
        if (!organizationId) {
            return
        }
        
        try {
            // Get current user ID from auth store
            const auth = useAuthStore.getState()
            const userId = auth.user?.id
            
            if (!userId) {
                return
            }
            
            // Use Supabase direct access for much faster loading
            const conversations = await supabaseChatService.getUserConversations(userId, organizationId)
            setConversations(conversations)
        } catch (err) {
            // Fallback to original method if Supabase fails
            try {
                const result = await chatSDKService.listConversations(organizationId)
                setConversations(result.conversations)
            } catch (fallbackErr) {
                console.error('Failed to load conversations:', fallbackErr)
                setError('Failed to load conversations')
            }
        }
    }, [organizationId])

    /**
     * Sélectionner une conversation
     */
    const selectConversation = useCallback(async (id: string) => {
        setIsLoading(true)
        setError(null)

        try {
            // Use Supabase direct access for much faster loading
            const { conversation, messages } = await supabaseChatService.getConversationWithMessages(id, 50)
            
            setConversation(conversation)
            
            // Messages are already in the correct format from Supabase
            setMessages(messages)
            
            // Extraire les citations des messages
            const allCitations = messages.flatMap((m) => m.citations || [])
            setCitations(allCitations)
        } catch (err) {
            // Fallback to original method if Supabase fails
            try {
                const conv = await chatSDKService.getConversation(id)
                setConversation(conv)
                
                // Mapper les messages au format attendu
                const mappedMessages = conv.messages.map((m) => ({
                    ...m,
                    role: m.role as any, // Cast pour compatibilité
                    citations: m.citations?.map((c) => ({
                        ...c,
                        source_type: c.source_type as any,
                    })) || [],
                }))
                setMessages(mappedMessages)
                
                // Extraire les citations des messages
                const allCitations = mappedMessages.flatMap((m) => m.citations || [])
                setCitations(allCitations)
            } catch (fallbackErr) {
                setError(err instanceof Error ? err.message : "Failed to load conversation")
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Créer une nouvelle conversation
     */
    const createNewConversation = useCallback(
        async (title?: string, initial_message?: string): Promise<Conversation> => {
            try {
                const orgId = typeof organizationId === 'string' ? organizationId : (organizationId as any)?.id
                const conv = await chatSDKService.createConversation(
                    title || "Nouvelle conversation",
                    orgId,
                    initial_message
                )

                setConversation(conv)
                setMessages([])
                setCitations([])
                setConversations((prev) => [conv, ...prev])
                
                // Persister immédiatement la nouvelle conversation
                try {
                    localStorage.setItem('active_conversation_id', conv.id)
                } catch (err) {
                    console.error('Failed to save conversation:', err)
                }

                return conv
            } catch (err) {
                console.error('Failed to create conversation:', err)
                setError('Failed to create conversation')
                throw err
            }
        },
        [organizationId]
    )

    /**
     * Renommer une conversation
     */
    const renameConversation = useCallback(async (id: string, title: string) => {
        try {
            await chatSDKService.updateConversation(id, title)
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, title } : c))
            )
            if (conversation?.id === id) {
                setConversation((prev) => (prev ? { ...prev, title } : prev))
            }
        } catch (err) {
            console.error('Failed to rename conversation:', err)
            setError('Failed to rename conversation')
        }
    }, [conversation])

    /**
     * Supprimer une conversation
     */
    const removeConversation = useCallback(
        async (id: string) => {
            try {
                await chatSDKService.deleteConversation(id)
                setConversations((prev) => prev.filter((c) => c.id !== id))
                if (conversation?.id === id) {
                    setConversation(null)
                    setMessages([])
                    setCitations([])
                }
            } catch (err) {
                console.error('Failed to delete conversation:', err)
                setError('Failed to delete conversation')
            }
        },
        [conversation]
    )

    
    /**
     * Générer des suggestions contextuelles basées sur le dernier message utilisateur
     */
    const generateContextualSuggestions = useCallback(async (lastUserMessage: string) => {
        try {
            // Récupérer l'organization_id depuis le store
            const organizationId = useAuthStore.getState().organization
            
            if (!organizationId) {
                console.error('No organization ID found')
                return
            }
            
            const orgId = typeof organizationId === 'string' ? organizationId : (organizationId as any)?.id
            
            // Envoyer uniquement le prompt utilisateur
            const requestBody = {
                organization_id: orgId,
                user_prompt: lastUserMessage,
                count: 5
            }
                        
            const response = await fetch(`${API_BASE_URL}/sdk/suggestions/contextual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify(requestBody)
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.suggestions && Array.isArray(data.suggestions)) {
                    setSuggestions(data.suggestions)
                } else {
                    setSuggestions([])
                }
            } else {
                console.error('Failed to fetch suggestions:', response.status)
                setSuggestions([])
            }
        } catch (error) {
            console.error('Failed to generate contextual suggestions:', error)
            setSuggestions([])
        }
    }, [setSuggestions])

    /**
     * Envoyer un message avec streaming
     */
    const sendUserMessage = useCallback(
        async (message: string, sendOptions: SendMessageOptions = {}) => {
            if (!message.trim()) return

            setError(null)
            setIsLoading(true)
            setSuggestions([])
            
            if (message.length > 20) {
                // Générer les suggestions en parallèle sans attendre
                Promise.resolve().then(() => generateContextualSuggestions(message)).catch(err => {
                    console.error('Failed to generate suggestions:', err)
                })
            }
            
            // Créer une conversation AVANT d'afficher le message si nécessaire
            let currentConversation = conversation
            if (!currentConversation) {
                try {
                    setIsLoading(true)
                    currentConversation = await createNewConversation(undefined, message)
                    setIsLoading(false)
                } catch (err) {
                    console.error('Failed to create conversation:', err)
                    setError('Impossible de créer la conversation')
                    setIsLoading(false)
                    return
                }
            }

            // Maintenant qu'on a une conversation, ajouter le message utilisateur
            const userMessageId = `msg-user-${Date.now()}`
            const userMessage: Message = {
                id: userMessageId,
                conversation_id: currentConversation.id,
                role: MessageRole.USER,
                content: message,
                citations: [],
                created_at: new Date().toISOString(),
            }
            
            // Ajouter immédiatement le message à l'affichage
            setMessages((prev) => [...prev, userMessage])
            lastMessageRef.current = message
            
            try {
                const streamCitations: Citation[] = []
                let accumulatedContent = ""  // Variable locale pour accumuler le contenu

                // Préparer la requête avec les sources demandées
                const chatRequest: any = {
                    conversation_id: currentConversation.id,
                    message: message,
                    mode: (sendOptions.mode || 'rag_enhanced') as ChatMode,
                    requested_sources: sendOptions.requestedSources || ["documents", "leases", "properties", "tenants", "kpis", "owners"],  // Sources par défaut pour test
                    stream: true,
                }
                
                // Ajouter les filtres spécifiques si fournis
                if (sendOptions.documentIds) {
                    chatRequest.document_ids = sendOptions.documentIds
                }
                if (sendOptions.leaseIds) {
                    chatRequest.lease_ids = sendOptions.leaseIds
                }
                if (sendOptions.propertyIds) {
                    chatRequest.property_ids = sendOptions.propertyIds
                }
                
                setIsStreaming(true)
                
                // Créer le contrôleur pour pouvoir arrêter le streaming
                abortControllerRef.current = new AbortController()
                
                await chatSDKService.streamChatMessage(chatRequest, {
                    onChunk: (content) => {
                        // Protection contre les contenus null/undefined
                        if (!content || typeof content !== 'string') return
                        
                        // Nettoyer le contenu en supprimant les balises [SOURCE:...]
                        const cleanedContent = content.replace(/\[SOURCE:[^\]]+\]/g, '')
                        accumulatedContent += cleanedContent
                        setStreamingContent(accumulatedContent)
                    },
                    onCitation: (citation) => {
                        const mappedCitation = {
                            ...citation,
                            source_type: citation.source_type as any,
                        }
                        streamCitations.push(mappedCitation)
                        setCitations(prev => [...prev, mappedCitation])
                    },
                    onDone: () => {
                        // Nettoyer le contenu final une dernière fois
                        const finalCleanedContent = accumulatedContent.replace(/\[SOURCE:[^\]]+\]/g, '').trim()
                        const assistantMessage: Message = {
                            id: `msg-assistant-${Date.now()}`,
                            conversation_id: currentConversation!.id,
                            role: MessageRole.ASSISTANT,
                            content: finalCleanedContent,
                            citations: streamCitations,
                            created_at: new Date().toISOString(),
                        }
                        setMessages(prev => [...prev, assistantMessage])                        
                        setStreamingContent("")
                        setIsLoading(false)
                        setIsStreaming(false)
                    },
                    onError: (error) => {
                        console.error('Streaming error:', error)
                        setError(error)
                        setIsLoading(false)
                        setIsStreaming(false)
                        setStreamingContent("")
                        // Ne pas retirer le message utilisateur, juste afficher l'erreur
                    },
                }, abortControllerRef.current?.signal)
            } catch (err) {
                console.error('Failed to send message:', err)
                
                // Ne pas afficher d'erreur si c'est une interruption volontaire
                if (err instanceof Error && err.name === 'AbortError') {                    
                    // Sauvegarder le contenu partiel comme un message normal
                    if (streamingContent && conversation) {
                        const partialMessage: Message = {
                            id: `msg-assistant-${Date.now()}`,
                            conversation_id: conversation.id,
                            role: MessageRole.ASSISTANT,
                            content: streamingContent,
                            citations: [],
                            created_at: new Date().toISOString(),
                        }
                        setMessages(prev => [...prev, partialMessage])
                        
                        // Générer des suggestions basées sur le message utilisateur
                        generateContextualSuggestions(message)
                    }
                    
                    setIsLoading(false)
                    setIsStreaming(false)
                    setStreamingContent("")
                    return
                }
                
                setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du message")
                setIsLoading(false)
                setIsStreaming(false)
                setStreamingContent("")
                // Garder le message utilisateur même en cas d'erreur
            }
        },
        [conversation, createNewConversation, streamingContent]
    )

    /**
     * Arrêter le streaming
     */
    const stopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        // Le reste est géré dans le catch (AbortError) de sendUserMessage
    }, [])

    /**
     * Réessayer le dernier message
     */
    const retryLastMessage = useCallback(() => {
        if (lastMessageRef.current) {
            sendUserMessage(lastMessageRef.current)
        }
    }, [sendUserMessage])

    /**
     * Vider les messages
     */
    const clearMessages = useCallback(() => {
        setMessages([])
        setCitations([])
        setError(null)
    }, [])

    /**
     * Réinitialiser la conversation (mettre à null)
     */
    const resetConversation = useCallback(() => {
        setConversation(null)
        setMessages([])
        setCitations([])
        setError(null)
    }, [])

    /**
     * Charger les suggestions
     */
    const loadSuggestions = useCallback(async () => {
        try {
            const result = await chatSDKService.getContextualSuggestions(
                organizationId,
                conversation?.id
            )
            // Mapper les suggestions au format attendu
            const mappedSuggestions = result.suggestions.map((s) => ({
                ...s,
                category: s.category as any, // Cast pour compatibilité
            }))
            setSuggestions(mappedSuggestions)
        } catch (err) {
            // Fallback sur suggestions générales
            try {
                const generalSuggestions = await chatSDKService.getSuggestions(5)
                const mappedGeneral = generalSuggestions.map((s) => ({
                    ...s,
                    category: s.category as any,
                }))
                setSuggestions(mappedGeneral)
            } catch {
                console.error('Failed to load suggestions')
            }
        }
    }, [organizationId, conversation])

    /**
     * Sélectionner une citation
     */
    const selectCitation = useCallback((citation: Citation | null) => {
        setActiveCitation(citation)
    }, [])

    /**
     * Exporter en Excel
     */
    const exportToExcel = useCallback(async () => {
        if (!conversation) {
            setError('Aucune conversation à exporter')
            return
        }
        
        try {
            await exportConversationExcel(conversation.id, true)
        } catch (err) {
            console.error('Failed to export Excel:', err)
            setError('Failed to export conversation')
        }
    }, [conversation])

    /**
     * Exporter en PDF
     */
    const exportToPDF = useCallback(async () => {
        if (!conversation) {
            setError('Aucune conversation à exporter')
            return
        }
        
        try {
            await exportConversationPDF(conversation.id, true)
        } catch (err) {
            console.error('Failed to export PDF:', err)
            setError('Failed to export conversation')
        }
    }, [conversation])

    return {
        // Messages
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,

        // Conversations
        conversation,
        conversations,
        loadConversations,
        selectConversation,
        createNewConversation,
        renameConversation,
        removeConversation,

        // Messages
        sendUserMessage,
        clearMessages,
        resetConversation,

        // Mode et sources (simplifié)
        mode,
        setMode,

        // Suggestions
        suggestions,
        loadSuggestions,

        // Citations
        citations,
        activeCitation,
        selectCitation,

        // Streaming
        stopStreaming,
        retryLastMessage,

        // Exports
        exportToExcel,
        exportToPDF,
    }
}
