"use client"

import { useEffect, useState } from "react"
import { ChatBox } from "@/components/chat/ChatBox"
import { useChat } from "@/lib/hooks/use-chat"
import { useRagOptions } from "@/lib/hooks/useRagOptions"
import { ChatMode } from "@/lib/types/chat"
import { SourceType } from "@/lib/types/document"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  FileText,
  Home,
  Users,
  BarChart3,
  MessageSquare,
  Lock,
  Zap
} from "lucide-react"

export default function ConversationsPage() {
    const [showRagPanel, setShowRagPanel] = useState(true)

    // Initialize chat hook
    const {
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,
        suggestions,
        mode,
        sendUserMessage,
        setMode,
        stopStreaming,
        retryLastMessage,
        loadSuggestions,
        activeSources,
        toggleSource,
    } = useChat({
        autoLoadSuggestions: true,
        defaultMode: ChatMode.RAG_ENHANCED
    })

    // RAG options hook
    const {
        enabled: ragEnabled,
        strictMode,
        selectedSources,
        selectedDocuments,
        selectedLeases,
        selectedProperties,
        toggleSource: toggleRagSource,
        toggleStrictMode,
        toggleRAG,
        setSelectedDocuments,
        setSelectedLeases,
        setSelectedProperties,
    } = useRagOptions()

    // Source icons mapping
    const sourceIcons: Record<SourceType, any> = {
        [SourceType.DOCUMENT]: FileText,
        [SourceType.LEASE]: FileText,
        [SourceType.PROPERTY]: Home,
        [SourceType.TENANT]: Users,
        [SourceType.KPI]: BarChart3,
        [SourceType.CONVERSATION]: MessageSquare,
    }

    // Source labels
    const sourceLabels: Record<SourceType, string> = {
        [SourceType.DOCUMENT]: "Documents",
        [SourceType.LEASE]: "Baux",
        [SourceType.PROPERTY]: "Propriétés",
        [SourceType.TENANT]: "Locataires",
        [SourceType.KPI]: "KPIs",
        [SourceType.CONVERSATION]: "Conversations",
    }

    // Handle send with RAG options
    const handleSendMessage = async (message: string) => {
        await sendUserMessage(message, {
            mode: strictMode ? ChatMode.RAG_ONLY : mode,
            sourceTypes: selectedSources,
            documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined,
            leaseIds: selectedLeases.length > 0 ? selectedLeases : undefined,
            stream: true,
        })
    }

    return (
        <div className="h-[calc(100vh-6rem)] w-full flex">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <ChatBox
                    messages={messages}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                    streamingContent={streamingContent}
                    error={error}
                    suggestions={suggestions}
                    mode={mode}
                    onSendMessage={handleSendMessage}
                    onModeChange={setMode}
                    onStopStreaming={stopStreaming}
                    onRetry={retryLastMessage}
                    title="Assistant Immobilier"
                    className="flex-1 h-full shadow-none border-none"
                />
            </div>

            {/* RAG Options Panel */}
            {showRagPanel && (
                <aside className="w-80 border-l bg-background p-4 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                <h3 className="font-semibold">Options RAG</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRagPanel(false)}
                            >
                                ✕
                            </Button>
                        </div>

                        <Separator />

                        {/* Enable RAG */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="rag-enabled" className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Activer RAG
                            </Label>
                            <Switch
                                id="rag-enabled"
                                checked={ragEnabled}
                                onCheckedChange={toggleRAG}
                            />
                        </div>

                        {ragEnabled && (
                            <>
                                {/* Strict Mode */}
                                <Card className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="strict-mode" className="flex items-center gap-2">
                                            <Lock className="h-4 w-4" />
                                            Mode Strict
                                        </Label>
                                        <Switch
                                            id="strict-mode"
                                            checked={strictMode}
                                            onCheckedChange={toggleStrictMode}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Réponses uniquement basées sur vos documents (pas de connaissances générales)
                                    </p>
                                </Card>

                                <Separator />

                                {/* Sources Selection */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Sources de données</Label>
                                    <div className="space-y-2">
                                        {Object.values(SourceType).map((source) => {
                                            const Icon = sourceIcons[source]
                                            const isSelected = selectedSources.includes(source)
                                            return (
                                                <button
                                                    key={source}
                                                    onClick={() => toggleRagSource(source)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                        isSelected
                                                            ? "bg-primary/10 border-primary"
                                                            : "bg-background hover:bg-accent"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        <span className="text-sm">{sourceLabels[source]}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <Badge variant="default" className="text-xs">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <Separator />

                                {/* Stats */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Sélection active</Label>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 bg-accent rounded">
                                            <div className="font-medium">{selectedSources.length}</div>
                                            <div className="text-muted-foreground">Sources</div>
                                        </div>
                                        <div className="p-2 bg-accent rounded">
                                            <div className="font-medium">
                                                {selectedDocuments.length + selectedLeases.length + selectedProperties.length}
                                            </div>
                                            <div className="text-muted-foreground">Filtres</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <p className="text-xs text-blue-900 dark:text-blue-100">
                                        💡 Les options sont envoyées au backend qui gère la logique RAG via MCP
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </aside>
            )}

            {/* Toggle RAG Panel Button (when hidden) */}
            {!showRagPanel && (
                <Button
                    variant="outline"
                    size="sm"
                    className="fixed right-4 top-20"
                    onClick={() => setShowRagPanel(true)}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Options RAG
                </Button>
            )}
        </div>
    )
}
