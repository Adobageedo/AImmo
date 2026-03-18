"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChatView } from "@/components/chat/ChatView"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { Button } from "@/components/ui/button"
import { useChatMvp as useChat } from "@/lib/hooks/use-chat-mvp"
import { useRagOptions } from "@/lib/hooks/useRagOptions"
import { useCanvas } from "@/lib/hooks/use-canvas"
import { ChatMode, Citation } from "@/lib/types/chat"
import { MessageSquare, Menu, PlusCircle } from "lucide-react"

export default function ConversationDetailPage() {
    const router = useRouter()
    const params = useParams()
    const conversationId = params.id as string
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isLoadingConversation, setIsLoadingConversation] = useState(true)

    const {
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,
        suggestions,
        sendUserMessage,
        sendUserMessageWithTempConversation,
        updateConversationId,
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
        if (!conversation && !conversationId) {
            console.error('❌ No conversation and no conversationId')
            return
        }
        
        try {
            await sendUserMessage(message, {
                mode: strictMode ? ChatMode.RAG_ONLY : (ragEnabled ? ChatMode.RAG_ENHANCED : ChatMode.NORMAL),
                requestedSources: ragEnabled ? selectedSources : [],
                stream: true,
            })
        } catch (err) {
            console.error('Erreur lors de l\'envoi du message:', err)
        }
    }

    const handleNewConversation = () => {
        // Navigate to home page
        router.push('/dashboard/conversations')
    }

    const handleCitationClick = (citation: Citation) => {
        console.log('Citation clicked:', citation)
    }

    // Load conversations list and specific conversation
    useEffect(() => {
        const loadConv = async () => {
            if (!conversationId) return
            
            // Check if there's a message in URL (new conversation)
            const urlParams = new URLSearchParams(window.location.search)
            const message = urlParams.get('message')
            
            if (message) {
                // Nouvelle conversation avec ID temporaire
                setIsLoadingConversation(false)
                
                // Nettoyer l'URL immédiatement (enlever le message)
                const cleanUrl = window.location.pathname
                window.history.replaceState({}, '', cleanUrl)
                
                // Envoyer le message avec la conversation temporaire
                const isTemporary = conversationId.startsWith('temp-')
                
                if (isTemporary) {
                    // Utiliser la nouvelle fonction pour gérer le flux optimisé
                    try {
                        const realConvId = await sendUserMessageWithTempConversation(message, conversationId, {
                            mode: strictMode ? ChatMode.RAG_ONLY : (ragEnabled ? ChatMode.RAG_ENHANCED : ChatMode.NORMAL),
                            requestedSources: ragEnabled ? selectedSources : [],
                            stream: true,
                        })
                        
                        // Mettre à jour l'URL silencieusement avec l'ID réel
                        if (realConvId !== conversationId) {
                            window.history.replaceState({}, '', `/dashboard/conversations/${realConvId}`)
                        }
                    } catch (err) {
                        console.error('Erreur lors de l\'envoi du message:', err)
                    }
                } else {
                    // Conversation existante, utiliser la méthode classique
                    setTimeout(() => {
                        handleSendMessage(message)
                    }, 100)
                }
                return
            }
            
            // Vérifier si c'est une conversation temporaire sans message
            const isTemporary = conversationId.startsWith('temp-')
            if (isTemporary) {
                // Conversation temporaire mais pas de message, juste afficher l'interface
                setIsLoadingConversation(false)
                return
            }
            
            // Existing conversation - load conversations list and from Supabase
            loadConversations()
            
            setIsLoadingConversation(true)
            try {
                await selectConversation(conversationId)
            } catch (err) {
                console.error('Failed to load conversation:', err)
                // Conversation not found, redirect to home
                router.push('/dashboard/conversations')
            } finally {
                setIsLoadingConversation(false)
            }
        }
        
        loadConv()
    }, [conversationId, selectConversation, router, loadConversations, sendUserMessageWithTempConversation, ragEnabled, strictMode, selectedSources])

    // Empty state for individual conversation
    const conversationEmptyState = (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600">Cette conversation est vide</p>
                <p className="text-sm text-gray-500">Commencez par envoyer un message</p>
            </div>
        </div>
    )

    // Optimisation : Pas de page blanche - toujours afficher l'interface
    // Le loading est géré en interne par ChatView
    
    // Pour les conversations temporaires, afficher immédiatement
    const isTemporary = conversationId?.startsWith('temp-')
    const shouldShowEmptyState = !isTemporary && !conversation && !isLoadingConversation && messages.length === 0

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
                emptyStateContent={shouldShowEmptyState ? conversationEmptyState : undefined}
                placeholder="Posez votre question..."
            />
        </div>
    )
}
