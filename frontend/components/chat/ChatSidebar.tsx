"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Conversation } from "@/lib/types/chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
    MessageSquare, 
    Plus, 
    Edit2, 
    Trash2, 
    X, 
    Check, 
    Calendar,
    Clock,
    Hash
} from "lucide-react"
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
    const router = useRouter()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")

    const handleSelectConversation = (id: string) => {
        onSelectConversation(id)
        router.push(`/dashboard/conversations/${id}`)
    }

    // Empêcher le défilement du body quand le sidebar est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        // Nettoyer quand le composant est démonté
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

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
            className={`fixed left-0 top-0 h-full bg-background border-r shadow-lg transition-transform duration-300 ease-in-out z-50 flex flex-col ${
                !isOpen ? "-translate-x-full" : "translate-x-0"
            } ${className}`}
            style={{ width: "320px" }}
        >
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Conversations
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    onClick={onNewConversation}
                    className="w-full justify-start gap-2"
                    size="sm"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle conversation
                </Button>
            </div>

            {/* History */}
            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {Object.entries(groupedConversations).map(([date, convs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-2 px-2 py-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {convs.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                            conv.id === currentConversationId
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-muted/50"
                                        }`}
                                        onClick={() => handleSelectConversation(conv.id)}
                                    >
                                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                                        {editingId === conv.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, conv.id)}
                                                    onBlur={() => handleSaveEdit(conv.id)}
                                                    autoFocus
                                                    className="h-8 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSaveEdit(conv.id)
                                                    }}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingId(null)
                                                        setEditTitle("")
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {conv.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(conv.updated_at).toLocaleTimeString("fr-FR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                        {conv.messages_count > 0 && (
                                                            <>
                                                                <Separator orientation="vertical" className="h-3" />
                                                                <span>{conv.messages_count} messages</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleStartEdit(conv)
                                                        }}
                                                        title="Renommer"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm("Supprimer cette conversation ?")) {
                                                                onDeleteConversation(conv.id)
                                                            }
                                                        }}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {conversations.length === 0 && (
                        <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                                Aucune conversation
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Commencez une nouvelle conversation pour voir l'historique
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export default ChatSidebar
