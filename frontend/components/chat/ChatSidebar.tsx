"use client"

import React, { useState } from "react"
import { Conversation } from "@/lib/types/chat"
import styles from "@/styles/chat.module.css"

/**
 * Chat Sidebar - Historique des conversations
 * Phase 5: Chat MVP
 */

interface ChatSidebarProps {
    conversations: Conversation[]
    currentConversationId?: string
    isOpen: boolean
    onToggle: () => void
    onSelectConversation: (id: string) => void
    onNewConversation: () => void
    onRenameConversation: (id: string, title: string) => void
    onDeleteConversation: (id: string) => void
    className?: string
}

export function ChatSidebar({
    conversations,
    currentConversationId,
    isOpen,
    onToggle,
    onSelectConversation,
    onNewConversation,
    onRenameConversation,
    onDeleteConversation,
    className = "",
}: ChatSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")

    const handleStartEdit = (conv: Conversation) => {
        setEditingId(conv.id)
        setEditTitle(conv.title)
    }

    const handleSaveEdit = (id: string) => {
        if (editTitle.trim()) {
            onRenameConversation(id, editTitle.trim())
        }
        setEditingId(null)
        setEditTitle("")
    }

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === "Enter") {
            handleSaveEdit(id)
        } else if (e.key === "Escape") {
            setEditingId(null)
            setEditTitle("")
        }
    }

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Aujourd'hui"
        if (diffDays === 1) return "Hier"
        if (diffDays < 7) return `Il y a ${diffDays} jours`
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }

    // Grouper les conversations par date
    const groupedConversations = conversations.reduce(
        (groups, conv) => {
            const key = formatDate(conv.updated_at)
            if (!groups[key]) groups[key] = []
            groups[key].push(conv)
            return groups
        },
        {} as Record<string, Conversation[]>
    )

    return (
        <div
            className={`${styles["chat__sidebar"]} ${!isOpen ? styles["chat__sidebar--collapsed"] : ""
                } ${className}`}
        >
            {/* Header */}
            <div className={styles["chat__sidebar-header"]}>
                <button
                    type="button"
                    className={styles["chat__new-chat-btn"]}
                    onClick={onNewConversation}
                >
                    <span>➕</span>
                    <span>Nouvelle conversation</span>
                </button>
            </div>

            {/* History */}
            <div className={styles["chat__history"]}>
                {Object.entries(groupedConversations).map(([date, convs]) => (
                    <div key={date}>
                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--chat-muted)",
                                padding: "8px 12px",
                                fontWeight: 500,
                            }}
                        >
                            {date}
                        </div>
                        {convs.map((conv) => (
                            <div
                                key={conv.id}
                                className={`${styles["chat__history-item"]} ${conv.id === currentConversationId
                                        ? styles["chat__history-item--active"]
                                        : ""
                                    }`}
                                onClick={() => onSelectConversation(conv.id)}
                            >
                                <span className={styles["chat__history-icon"]}>💬</span>

                                {editingId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, conv.id)}
                                        onBlur={() => handleSaveEdit(conv.id)}
                                        autoFocus
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: "transparent",
                                            fontSize: "0.875rem",
                                            outline: "none",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className={styles["chat__history-title"]}>{conv.title}</span>
                                )}

                                <div className={styles["chat__history-actions"]}>
                                    <button
                                        type="button"
                                        className={styles["chat__history-action"]}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEdit(conv)
                                        }}
                                        title="Renommer"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        className={styles["chat__history-action"]}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm("Supprimer cette conversation ?")) {
                                                onDeleteConversation(conv.id)
                                            }
                                        }}
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {conversations.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            color: "var(--chat-muted)",
                            fontSize: "0.875rem",
                        }}
                    >
                        Aucune conversation
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatSidebar
