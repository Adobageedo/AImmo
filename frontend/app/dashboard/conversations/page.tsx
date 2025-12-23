"use client"

import { useEffect } from "react"
import { ChatBox } from "@/components/chat/ChatBox"
import { useChat } from "@/lib/hooks/use-chat"
import { ChatMode } from "@/lib/types/chat"

export default function ConversationsPage() {
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

    return (
        <div className="h-[calc(100vh-6rem)] w-full flex flex-col">
            <ChatBox
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                error={error}
                suggestions={suggestions}
                mode={mode}
                onSendMessage={sendUserMessage}
                onModeChange={setMode}
                onStopStreaming={stopStreaming}
                onRetry={retryLastMessage}
                title="Assistant Immobilier"
                className="flex-1 h-full shadow-none border-none"
            />
        </div>
    )
}
