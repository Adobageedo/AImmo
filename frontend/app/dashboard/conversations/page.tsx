"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatView } from "@/components/chat/ChatView"
import { SuggestionsBar } from "@/components/chat/SuggestionsBar"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { Button } from "@/components/ui/button"
import { useChatMvp as useChat } from "@/lib/hooks/use-chat-mvp"
import { useRagOptions } from "@/lib/hooks/useRagOptions"
import { useCanvas } from "@/lib/hooks/use-canvas"
import { ChatMode, Citation } from "@/lib/types/chat"
import { MessageSquare, Menu, PlusCircle } from "lucide-react"

export default function ConversationsPage() {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const {
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,
        suggestions,
        sendUserMessage,
        stopStreaming,
        retryLastMessage,
        conversation,
        conversations,
        loadConversations,
        selectConversation,
        createNewConversation,
        renameConversation,
        removeConversation,
        resetConversation,
    } = useChat({
        autoLoadSuggestions: true,
        defaultMode: ChatMode.NORMAL
    })

    const {
        artifacts,
        createArtifact,
        exportToExcel,
        exportToPDF,
    } = useCanvas({
        conversationId: conversation?.id,
        autoSave: true,
    })

    const {
        enabled: ragEnabled,
        strictMode,
        selectedSources,
        toggleSource: toggleRagSource,
        toggleStrictMode,
        toggleRAG,
    } = useRagOptions()

    const getArtifactsForMessage = (messageId: string) => {
        return artifacts.filter(a => a.metadata?.messageId === messageId)
    }

    const handleSendMessage = async (message: string) => {
        try {
            // Create conversation first (without message)
            const newConv = await createNewConversation(undefined)
            
            // Navigate to the new conversation with message as URL parameter
            router.push(`/dashboard/conversations/${newConv.id}?message=${encodeURIComponent(message)}`)
        } catch (err) {
            console.error('Erreur lors de la création de conversation:', err)
        }
    }

    const handleNewConversation = () => {
        // Stay on home page, just reset state
        resetConversation()
        router.push('/dashboard/conversations')
    }

    const handleCitationClick = (citation: Citation) => {
        console.log('Citation clicked:', citation)
    }

    useEffect(() => {
        loadConversations()
        // Reset conversation when on home page
        resetConversation()
    }, [loadConversations, resetConversation])

    // Home page empty state with suggestions
    const homeEmptyState = (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
                <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">AImmo</h1>
                    <p className="text-lg text-gray-600">Votre assistant IA pour la gestion immobilière</p>
                </div>
                {suggestions.length > 0 && (
                    <div className="w-full">
                        <SuggestionsBar
                            suggestions={suggestions}
                            onSelect={handleSendMessage}
                            variant="chips"
                            maxVisible={6}
                        />
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="h-full w-full flex flex-col relative">
            {/* Boutons flottants en haut à gauche */}
            <div className="absolute top-4 left-4 z-40 flex gap-2">
                <Button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    variant="outline"
                    size="sm"
                    className="bg-background shadow-lg hover:bg-accent transition-colors"
                    title={sidebarOpen ? "Fermer les conversations" : "Ouvrir les conversations"}
                >
                    <Menu className="h-4 w-4" />
                </Button>
                <Button
                    onClick={() => handleNewConversation()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 shadow-lg transition-colors"
                    title="Nouvelle conversation"
                >
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>

            {/* Sidebar */}
            <ChatSidebar
                conversations={conversations}
                currentConversationId={conversation?.id}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onSelectConversation={(id) => router.push(`/dashboard/conversations/${id}`)}
                onNewConversation={handleNewConversation}
                onRenameConversation={renameConversation}
                onDeleteConversation={removeConversation}
            />

            {/* Chat View */}
            <ChatView
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                error={error}
                suggestions={suggestions}
                artifacts={artifacts}
                getArtifactsForMessage={getArtifactsForMessage}
                onSendMessage={handleSendMessage}
                onStopStreaming={stopStreaming}
                onRetryLastMessage={retryLastMessage}
                onCitationClick={handleCitationClick}
                onExportArtifact={(id, format) => {
                    if (format === 'excel') exportToExcel(id)
                    else exportToPDF(id)
                }}
                ragEnabled={ragEnabled}
                strictMode={strictMode}
                selectedSources={selectedSources}
                onToggleRAG={toggleRAG}
                onToggleStrictMode={toggleStrictMode}
                onToggleSource={toggleRagSource}
                sidebarOpen={sidebarOpen}
                emptyStateContent={homeEmptyState}
                placeholder="Posez votre question pour commencer une nouvelle conversation..."
            />
        </div>
    )
}
