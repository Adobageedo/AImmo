"use client"

import React, { useEffect, useRef } from "react"
import { ChatMessage, ChatInput, StreamingIndicator } from "@/components/chat/ChatBox"
import { RagSettingsPopover } from "@/components/chat/RagSettingsPopover"
import { MessageSources } from "@/components/chat/MessageSources"
import { MessageArtifact } from "@/components/chat/MessageArtifact"
import { SuggestionsBar } from "@/components/chat/SuggestionsBar"
import { Message, Citation, PromptSuggestion, ChatMode, Artifact } from "@/lib/types/chat"
import { SourceType } from "@/lib/types/document"

/**
 * ChatView - Shared component for displaying chat messages and handling interactions
 * Used by both the home page and individual conversation pages
 */

interface ChatViewProps {
    // Messages
    messages: Message[]
    isLoading: boolean
    isStreaming: boolean
    streamingContent: string
    error: string | null
    
    // Suggestions
    suggestions: PromptSuggestion[]
    
    // Artifacts
    artifacts: Artifact[]
    getArtifactsForMessage: (messageId: string) => Artifact[]
    
    // Actions
    onSendMessage: (message: string) => void
    onStopStreaming: () => void
    onRetryLastMessage: () => void
    onCitationClick: (citation: Citation) => void
    onExportArtifact: (id: string, format: 'excel' | 'pdf') => void
    
    // RAG settings
    ragEnabled: boolean
    strictMode: boolean
    selectedSources: SourceType[]
    onToggleRAG: () => void
    onToggleStrictMode: () => void
    onToggleSource: (source: SourceType) => void
    
    // UI
    sidebarOpen?: boolean
    emptyStateContent?: React.ReactNode
    placeholder?: string
}

export function ChatView({
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    suggestions,
    artifacts,
    getArtifactsForMessage,
    onSendMessage,
    onStopStreaming,
    onRetryLastMessage,
    onCitationClick,
    onExportArtifact,
    ragEnabled,
    strictMode,
    selectedSources,
    onToggleRAG,
    onToggleStrictMode,
    onToggleSource,
    sidebarOpen = false,
    emptyStateContent,
    placeholder = "Posez votre question..."
}: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive (but before footer)
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            // Scroll to bottom but leave some margin from the footer
            const container = messagesContainerRef.current
            const scrollHeight = container.scrollHeight
            const clientHeight = container.clientHeight
            const targetScrollTop = scrollHeight - clientHeight + 100 // 100px margin from bottom
            
            container.scrollTo({
                top: targetScrollTop,
                behavior: "smooth"
            })
        }
    }

    // Scroll to bottom when messages, streaming content, or loading state changes
    useEffect(() => {
        // Small delay to ensure content is rendered
        setTimeout(scrollToBottom, 100)
    }, [messages, streamingContent, isLoading])

    // Also scroll on initial load
    useEffect(() => {
        setTimeout(scrollToBottom, 200)
    }, [])

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50" ref={messagesContainerRef}>
                <div className={`max-w-4xl mx-auto px-4 py-6 pb-4 ${sidebarOpen ? "ml-80" : ""} transition-all duration-300`}>
                    {/* Empty state */}
                    {messages.length === 0 && emptyStateContent}

                    {/* Messages list */}
                    {messages.map((message, index) => {
                        const messageArtifacts = getArtifactsForMessage(message.id)
                        
                        return (
                            <div key={message.id}>
                                {/* Message */}
                                <ChatMessage
                                    message={message}
                                    onCitationClick={onCitationClick}
                                />

                                {/* Sources */}
                                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                                    <div className="flex justify-start mb-4">
                                        <div className="ml-11 max-w-[75%]">
                                            <MessageSources
                                                citations={message.citations}
                                                onCitationClick={onCitationClick}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Artifacts */}
                                {message.role === 'assistant' && messageArtifacts.length > 0 && (
                                    <div className="flex justify-start mb-4">
                                        <div className="ml-11 max-w-[75%]">
                                            <div className="space-y-3">
                                                {messageArtifacts.map((artifact) => (
                                                    <MessageArtifact
                                                        key={artifact.id}
                                                        artifact={artifact}
                                                        onExport={(id, format) => onExportArtifact(id, format)}
                                                        onView={(id) => console.log('View artifact:', id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {/* Loading indicator */}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <StreamingIndicator content={isStreaming ? streamingContent : ""} />
                    )}

                    {/* Streaming message fallback */}
                    {isStreaming && streamingContent && !isLoading && (
                        <StreamingIndicator content={streamingContent} />
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="flex justify-start mb-4">
                            <div className="ml-11 max-w-[75%]">
                                <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-red-900 font-medium mb-1">Erreur serveur</p>
                                            <p className="text-sm text-red-700 mb-3">{error}</p>
                                            <button
                                                onClick={onRetryLastMessage}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Réessayer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suggestions after assistant response */}
                    {messages.length > 0 && !isStreaming && !isLoading && !error && suggestions.length > 0 && (() => {
                        const lastMessage = messages[messages.length - 1]
                        return lastMessage.role === 'assistant'
                    })() && (
                        <div className="flex justify-start mb-4">
                            <div className="ml-11 max-w-[75%]">
                                <SuggestionsBar
                                    suggestions={suggestions}
                                    onSelect={onSendMessage}
                                    variant="chips"
                                    maxVisible={6}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Scroll anchor - always at the bottom with margin to avoid footer */}
                    <div ref={messagesEndRef} className="h-8" />
                </div>
            </div>

            {/* Input Area */}
            <ChatInput
                onSend={onSendMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStop={onStopStreaming}
                placeholder={placeholder}
                ragSettingsButton={
                    <RagSettingsPopover
                        enabled={ragEnabled}
                        strictMode={strictMode}
                        selectedSources={selectedSources}
                        onToggleRAG={onToggleRAG}
                        onToggleStrictMode={onToggleStrictMode}
                        onToggleSource={onToggleSource}
                    />
                }
            />
        </div>
    )
}

export default ChatView
