"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Message, Citation } from "@/lib/types/chat"
import { Send, Square, Copy, Check } from "lucide-react"

/**
 * ChatBox Component - Simplifié
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
    const [copied, setCopied] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
            {/* Avatar - only for assistant */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    AI
                </div>
            )}
            
            {/* Message bubble */}
            <div 
                className="relative group max-w-[75%]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    isUser 
                        ? "bg-indigo-500 text-white rounded-br-sm" 
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                }`}>
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                        {isUser ? (
                            <div className="whitespace-pre-wrap break-words text-white font-medium leading-relaxed">{message.content}</div>
                        ) : (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Style pour les titres
                                    h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-1">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-2">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2">{children}</h3>,
                                    
                                    // Style pour les paragraphes
                                    p: ({children}) => <p className="mb-3 last:mb-0 text-gray-800">{children}</p>,
                                    
                                    // Style pour le gras
                                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    
                                    // Style pour l'italique
                                    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                                    
                                    // Style pour les listes
                                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800">{children}</ol>,
                                    li: ({children}) => <li className="text-gray-800">{children}</li>,
                                    
                                    // Style pour les liens
                                    a: ({href, children}) => (
                                        <a 
                                            href={href} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                                        >
                                            {children}
                                        </a>
                                    ),
                                    
                                    // Style pour le code inline
                                    code: ({children}) => (
                                        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                            {children}
                                        </code>
                                    ),
                                    
                                    // Style pour les blocs de code
                                    pre: ({children}) => (
                                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-xs">
                                            {children}
                                        </pre>
                                    ),
                                    
                                    // Style pour les blocs de citation
                                    blockquote: ({children}) => (
                                        <blockquote className="border-l-4 border-indigo-300 pl-4 py-2 mb-3 bg-indigo-50 rounded-r text-gray-700 italic">
                                            {children}
                                        </blockquote>
                                    ),
                                    
                                    // Style pour les tableaux
                                    table: ({children}) => (
                                        <div className="overflow-x-auto mb-3">
                                            <table className="min-w-full border border-gray-200 rounded-lg">
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
                                    th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-gray-200">{children}</th>,
                                    td: ({children}) => <td className="px-3 py-2 text-xs text-gray-700 border-b border-gray-100">{children}</td>,
                                    
                                    // Style pour les séparateurs
                                    hr: () => <hr className="border-gray-200 my-3" />,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>

                {/* Copy button - only for assistant messages, visible on hover */}
                {!isUser && (
                    <button
                        onClick={handleCopy}
                        className={`absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all ${
                            isHovered ? "opacity-100" : "opacity-0"
                        }`}
                        title="Copier le message"
                    >
                        {copied ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {/* Avatar - only for user */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    U
                </div>
            )}
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
        <div className="flex gap-3 mb-4 justify-start">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                AI
            </div>
            
            {/* Message bubble */}
            <div className="max-w-[75%]">
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-gray-200 shadow-sm">
                    {content ? (
                        <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Réutiliser les mêmes styles que pour les messages normaux
                                    h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-1">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-2">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2">{children}</h3>,
                                    p: ({children}) => <p className="mb-3 last:mb-0 text-gray-800">{children}</p>,
                                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800">{children}</ol>,
                                    li: ({children}) => <li className="text-gray-800">{children}</li>,
                                    a: ({href, children}) => (
                                        <a 
                                            href={href} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                                        >
                                            {children}
                                        </a>
                                    ),
                                    code: ({children}) => (
                                        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                            {children}
                                        </code>
                                    ),
                                    pre: ({children}) => (
                                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-xs">
                                            {children}
                                        </pre>
                                    ),
                                    blockquote: ({children}) => (
                                        <blockquote className="border-l-4 border-indigo-300 pl-4 py-2 mb-3 bg-indigo-50 rounded-r text-gray-700 italic">
                                            {children}
                                        </blockquote>
                                    ),
                                    table: ({children}) => (
                                        <div className="overflow-x-auto mb-3">
                                            <table className="min-w-full border border-gray-200 rounded-lg">
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
                                    th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-gray-200">{children}</th>,
                                    td: ({children}) => <td className="px-3 py-2 text-xs text-gray-700 border-b border-gray-100">{children}</td>,
                                    hr: () => <hr className="border-gray-200 my-3" />,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                            <span className="inline-block w-1 h-4 bg-indigo-500 ml-1 animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-gray-500 text-sm">Réflexion...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// Chat Input
// ============================================

interface ChatInputProps {
    onSend: (message: string) => void
    onStop?: () => void
    isLoading?: boolean
    isStreaming?: boolean
    disabled?: boolean
    placeholder?: string
    ragSettingsButton?: React.ReactNode
}

export function ChatInput({
    onSend,
    onStop,
    isLoading = false,
    isStreaming = false,
    placeholder = "Posez votre question...",
    disabled = false,
    ragSettingsButton,
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
        <div className="border-t bg-white">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    {/* Bouton RAG Settings */}
                    {ragSettingsButton && (
                        <div className="flex-shrink-0">
                            {ragSettingsButton}
                        </div>
                    )}

                    {/* Zone de texte principale */}
                    <div className="flex-1 flex items-center">
                        <textarea
                            ref={textareaRef}
                            className="w-full resize-none border-0 bg-transparent placeholder:text-gray-400 focus:outline-none text-sm leading-6 min-h-[24px] max-h-[120px]"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            rows={1}
                        />
                    </div>

                    {/* Bouton d'envoi/stop */}
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={onStop}
                            className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                            title="Arrêter"
                        >
                            <Square className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!value.trim() || isLoading || disabled}
                            className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Envoyer"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Indicateur d'état */}
                {(isLoading || isStreaming) && (
                    <div className="flex items-center justify-center pt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                            {isStreaming ? "Génération en cours..." : "Envoi..."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
