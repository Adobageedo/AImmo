"use client"

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react"
import { SourceType } from "@/lib/types/document"
import {
    Conversation,
    Message,
    ChatMode,
    Citation,
    PromptSuggestion,
} from "@/lib/types/chat"
import { useChat } from "@/lib/hooks/use-chat"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * Chat Context - Phase 5 Chat MVP
 * Conversation courante et sources RAG actives
 */

interface ChatContextType {
    // Conversation courante
    conversation: Conversation | null
    messages: Message[]

    // État
    isLoading: boolean
    isStreaming: boolean
    streamingContent: string
    error: string | null

    // Historique
    conversations: Conversation[]

    // Actions conversation
    loadConversations: () => Promise<void>
    selectConversation: (id: string) => Promise<void>
    createNewConversation: (title?: string) => Promise<Conversation>
    renameConversation: (id: string, title: string) => Promise<void>
    deleteConversation: (id: string) => Promise<void>

    // Actions messages
    sendMessage: (message: string) => Promise<void>
    clearChat: () => void
    stopStreaming: () => void
    retryLastMessage: () => Promise<void>

    // Mode et sources RAG
    mode: ChatMode
    setMode: (mode: ChatMode) => void
    activeSources: SourceType[]
    setActiveSources: (sources: SourceType[]) => void
    toggleSource: (source: SourceType) => void
    isSourceActive: (source: SourceType) => boolean

    // Suggestions
    suggestions: PromptSuggestion[]

    // Citations
    citations: Citation[]

    // UI
    isSidebarOpen: boolean
    toggleSidebar: () => void
    isSettingsOpen: boolean
    toggleSettings: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
    children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
    const { currentOrganizationId } = useAuthStore()

    // Utiliser le hook useChat
    const chat = useChat({
        organizationId: currentOrganizationId || undefined,
        defaultMode: ChatMode.RAG_ENHANCED,
        autoLoadSuggestions: true,
    })

    // État UI
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Charger les conversations au montage
    useEffect(() => {
        if (currentOrganizationId) {
            chat.loadConversations()
        }
    }, [currentOrganizationId])

    /**
     * Vérifier si une source est active
     */
    const isSourceActive = useCallback(
        (source: SourceType): boolean => {
            return chat.activeSources.includes(source)
        },
        [chat.activeSources]
    )

    /**
     * Toggle sidebar
     */
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => !prev)
    }, [])

    /**
     * Toggle settings
     */
    const toggleSettings = useCallback(() => {
        setIsSettingsOpen((prev) => !prev)
    }, [])

    const contextValue: ChatContextType = {
        // Conversation courante
        conversation: chat.conversation,
        messages: chat.messages,

        // État
        isLoading: chat.isLoading,
        isStreaming: chat.isStreaming,
        streamingContent: chat.streamingContent,
        error: chat.error,

        // Historique
        conversations: chat.conversations,

        // Actions conversation
        loadConversations: chat.loadConversations,
        selectConversation: chat.selectConversation,
        createNewConversation: chat.createNewConversation,
        renameConversation: chat.renameConversation,
        deleteConversation: chat.removeConversation,

        // Actions messages
        sendMessage: chat.sendUserMessage,
        clearChat: chat.clearMessages,
        stopStreaming: chat.stopStreaming,
        retryLastMessage: chat.retryLastMessage,

        // Mode et sources RAG
        mode: chat.mode,
        setMode: chat.setMode,
        activeSources: chat.activeSources,
        setActiveSources: chat.setActiveSources,
        toggleSource: chat.toggleSource,
        isSourceActive,

        // Suggestions
        suggestions: chat.suggestions,

        // Citations
        citations: chat.citations,

        // UI
        isSidebarOpen,
        toggleSidebar,
        isSettingsOpen,
        toggleSettings,
    }

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    )
}

/**
 * Hook pour utiliser le contexte Chat
 */
export function useChatContext(): ChatContextType {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider")
    }
    return context
}

/**
 * Hook simplifié pour les messages
 */
export function useChatMessages() {
    const { messages, sendMessage, isLoading, isStreaming, streamingContent, error } =
        useChatContext()

    return {
        messages,
        send: sendMessage,
        isLoading,
        isStreaming,
        streamingContent,
        error,
    }
}

/**
 * Hook simplifié pour les sources RAG
 */
export function useChatSources() {
    const { activeSources, setActiveSources, toggleSource, isSourceActive, mode, setMode } =
        useChatContext()

    return {
        sources: activeSources,
        setSources: setActiveSources,
        toggle: toggleSource,
        isActive: isSourceActive,
        mode,
        setMode,
    }
}

/**
 * Hook simplifié pour l'historique
 */
export function useChatHistory() {
    const {
        conversations,
        conversation,
        loadConversations,
        selectConversation,
        createNewConversation,
        renameConversation,
        deleteConversation,
    } = useChatContext()

    return {
        conversations,
        current: conversation,
        load: loadConversations,
        select: selectConversation,
        create: createNewConversation,
        rename: renameConversation,
        remove: deleteConversation,
    }
}
