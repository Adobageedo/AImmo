"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Message, Citation, ChatMode } from "@/lib/types/chat"
import { SourceType } from "@/lib/types/document"
import styles from "@/styles/chat.module.css"

/**
 * ChatBox Component - Phase 5 Chat MVP
 * Interface type ChatGPT avec streaming
 */

// ============================================
// Message Component
// ============================================

interface ChatMessageProps {
    message: Message
    onCitationClick?: (citation: Citation) => void
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
    const isUser = message.role === "user"

    return (
        <div
            className={`${styles["chat__message"]} ${isUser ? styles["chat__message--user"] : styles["chat__message--assistant"]
                }`}
        >
            <div
                className={`${styles["chat__message-avatar"]} ${isUser
                        ? styles["chat__message-avatar--user"]
                        : styles["chat__message-avatar--assistant"]
                    }`}
            >
                {isUser ? "👤" : "🤖"}
            </div>
            <div className={styles["chat__message-content"]}>
                <div className={styles["chat__message-text"]}>{message.content}</div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                    <div className={styles["chat__citations"]}>
                        {message.citations.map((citation) => (
                            <button
                                key={citation.id}
                                className={styles["chat__citation"]}
                                onClick={() => onCitationClick?.(citation)}
                                type="button"
                            >
                                <span className={styles["chat__citation-icon"]}>📄</span>
                                <span className={styles["chat__citation-title"]}>
                                    {citation.document_title}
                                </span>
                                <span className={styles["chat__citation-score"]}>
                                    {Math.round(citation.relevance_score * 100)}%
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================
// Streaming Indicator
// ============================================

interface StreamingIndicatorProps {
    content: string
}

export function StreamingIndicator({ content }: StreamingIndicatorProps) {
    return (
        <div className={`${styles["chat__message"]} ${styles["chat__message--assistant"]}`}>
            <div
                className={`${styles["chat__message-avatar"]} ${styles["chat__message-avatar--assistant"]}`}
            >
                🤖
            </div>
            <div className={styles["chat__message-content"]}>
                {content ? (
                    <div className={styles["chat__message-text"]}>{content}</div>
                ) : (
                    <div className={styles["chat__streaming"]}>
                        <div className={styles["chat__streaming-dots"]}>
                            <span className={styles["chat__streaming-dot"]} />
                            <span className={styles["chat__streaming-dot"]} />
                            <span className={styles["chat__streaming-dot"]} />
                        </div>
                        <span className={styles["chat__streaming-text"]}>Réflexion en cours...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================
// Chat Input
// ============================================

interface ChatInputProps {
    onSend: (message: string) => void
    isLoading?: boolean
    isStreaming?: boolean
    onStop?: () => void
    placeholder?: string
    disabled?: boolean
}

export function ChatInput({
    onSend,
    isLoading = false,
    isStreaming = false,
    onStop,
    placeholder = "Posez votre question...",
    disabled = false,
}: ChatInputProps) {
    const [value, setValue] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [value])

    const handleSubmit = useCallback(() => {
        if (value.trim() && !isLoading && !disabled) {
            onSend(value.trim())
            setValue("")
        }
    }, [value, isLoading, disabled, onSend])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className={styles["chat__input"]}>
            <div className={styles["chat__input-wrapper"]}>
                <textarea
                    ref={textareaRef}
                    className={styles["chat__textarea"]}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isLoading}
                    rows={1}
                />
                <div className={styles["chat__input-actions"]}>
                    {isStreaming ? (
                        <button
                            type="button"
                            className={`${styles["chat__button"]} ${styles["chat__button--stop"]}`}
                            onClick={onStop}
                        >
                            ⏹️ Stop
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`${styles["chat__button"]} ${styles["chat__button--send"]}`}
                            onClick={handleSubmit}
                            disabled={!value.trim() || isLoading || disabled}
                        >
                            {isLoading ? "..." : "Envoyer"} ➤
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// Suggestions
// ============================================

interface SuggestionProps {
    icon: string
    title: string
    prompt: string
    onClick: () => void
}

export function Suggestion({ icon, title, prompt, onClick }: SuggestionProps) {
    return (
        <button type="button" className={styles["chat__suggestion"]} onClick={onClick}>
            <span className={styles["chat__suggestion-icon"]}>{icon}</span>
            <div className={styles["chat__suggestion-content"]}>
                <div className={styles["chat__suggestion-title"]}>{title}</div>
                <div className={styles["chat__suggestion-prompt"]}>{prompt}</div>
            </div>
        </button>
    )
}

interface SuggestionsListProps {
    suggestions: Array<{ id: string; icon: string; title: string; prompt: string }>
    onSelect: (prompt: string) => void
}

export function SuggestionsList({ suggestions, onSelect }: SuggestionsListProps) {
    return (
        <div className={styles["chat__suggestions"]}>
            {suggestions.map((suggestion) => (
                <Suggestion
                    key={suggestion.id}
                    icon={suggestion.icon}
                    title={suggestion.title}
                    prompt={suggestion.prompt}
                    onClick={() => onSelect(suggestion.prompt)}
                />
            ))}
        </div>
    )
}

// ============================================
// Mode Selector
// ============================================

interface ModeSelectorProps {
    mode: ChatMode
    onModeChange: (mode: ChatMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
    const modes = [
        { value: ChatMode.RAG_ENHANCED, label: "RAG + IA" },
        { value: ChatMode.RAG_ONLY, label: "RAG seul" },
        { value: ChatMode.NORMAL, label: "IA seule" },
    ]

    return (
        <div className={styles["chat__mode-selector"]}>
            {modes.map((m) => (
                <button
                    key={m.value}
                    type="button"
                    className={`${styles["chat__mode-option"]} ${mode === m.value ? styles["chat__mode-option--active"] : ""
                        }`}
                    onClick={() => onModeChange(m.value)}
                >
                    {m.label}
                </button>
            ))}
        </div>
    )
}

// ============================================
// Error Display
// ============================================

interface ErrorDisplayProps {
    message: string
    onRetry?: () => void
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
    return (
        <div className={styles["chat__error"]}>
            <span className={styles["chat__error-icon"]}>⚠️</span>
            <span className={styles["chat__error-message"]}>{message}</span>
            {onRetry && (
                <button type="button" className={styles["chat__error-retry"]} onClick={onRetry}>
                    Réessayer
                </button>
            )}
        </div>
    )
}

// ============================================
// Main ChatBox Component
// ============================================

interface ChatBoxProps {
    messages: Message[]
    isLoading?: boolean
    isStreaming?: boolean
    streamingContent?: string
    error?: string | null
    suggestions?: Array<{ id: string; icon: string; title: string; prompt: string }>
    mode?: ChatMode
    onSendMessage: (message: string) => void
    onModeChange?: (mode: ChatMode) => void
    onStopStreaming?: () => void
    onRetry?: () => void
    onCitationClick?: (citation: Citation) => void
    showHeader?: boolean
    title?: string
    darkMode?: boolean
    className?: string
}

export function ChatBox({
    messages,
    isLoading = false,
    isStreaming = false,
    streamingContent = "",
    error = null,
    suggestions = [],
    mode = ChatMode.RAG_ENHANCED,
    onSendMessage,
    onModeChange,
    onStopStreaming,
    onRetry,
    onCitationClick,
    showHeader = true,
    title = "Assistant AImmo",
    darkMode = false,
    className = "",
}: ChatBoxProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isEmpty = messages.length === 0 && !isLoading && !isStreaming

    return (
        <div className={`${styles["chat"]} ${darkMode ? styles["chat--dark"] : ""} ${className}`}>
            {/* Header */}
            {showHeader && (
                <div className={styles["chat__header"]}>
                    <div className={styles["chat__header-left"]}>
                        <h2 className={styles["chat__title"]}>{title}</h2>
                    </div>
                    <div className={styles["chat__header-right"]}>
                        {onModeChange && <ModeSelector mode={mode} onModeChange={onModeChange} />}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                className={`${styles["chat__messages"]} ${isEmpty ? styles["chat__messages--empty"] : ""
                    }`}
            >
                {isEmpty ? (
                    <>
                        <div className={styles["chat__empty-icon"]}>💬</div>
                        <h3 className={styles["chat__empty-title"]}>Comment puis-je vous aider ?</h3>
                        <p className={styles["chat__empty-text"]}>
                            Posez une question sur vos baux, biens immobiliers ou documents. Je peux
                            résumer, comparer et générer des rapports.
                        </p>
                        {suggestions.length > 0 && (
                            <SuggestionsList suggestions={suggestions} onSelect={onSendMessage} />
                        )}
                    </>
                ) : (
                    <>
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                onCitationClick={onCitationClick}
                            />
                        ))}

                        {/* Streaming message */}
                        {isStreaming && streamingContent && (
                            <div className={`${styles["chat__message"]} ${styles["chat__message--assistant"]}`}>
                                <div className={styles["chat__message-content"]}>
                                    <div className={styles["chat__message-text"]}>
                                        {streamingContent}
                                        <span className={styles["chat__streaming-cursor"]}>▋</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && <ErrorDisplay message={error} onRetry={onRetry} />}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <ChatInput
                onSend={onSendMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStop={onStopStreaming}
                disabled={!!error}
            />
        </div>
    )
}

export default ChatBox
