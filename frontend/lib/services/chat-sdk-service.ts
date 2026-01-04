/**
 * Chat SDK Service - Service complet pour l'API Chat SDK
 * Intégration avec le nouveau backend complet
 */

import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// ============================================
// CONVERSATIONS
// ============================================

export interface Conversation {
  id: string
  title: string
  organization_id: string
  user_id: string
  messages_count: number
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface ConversationList {
  conversations: Conversation[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ConversationCreate {
  title: string
  organization_id: string
  initial_message?: string
}

export interface ConversationUpdate {
  title?: string
}

// ============================================
// MESSAGES
// ============================================

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Citation[]
  artifacts?: any[]
  created_at: string
  updated_at?: string
}

export interface Citation {
  id: string
  chunk_id: string
  document_id: string
  document_title: string
  content_preview: string
  source_type: string
  relevance_score: number
  metadata?: any
}

// ============================================
// CHAT
// ============================================

export interface ChatRequest {
  conversation_id: string
  message: string
  mode?: 'normal' | 'rag_only' | 'rag_enhanced'
  requested_sources?: string[]  // Renommé de source_types pour correspondre au backend
  document_ids?: string[]
  lease_ids?: string[]
  property_ids?: string[]
  include_citations?: boolean
  max_citations?: number
  stream?: boolean
}

export interface ChatResponse {
  message: Message
  citations: Citation[]
  artifacts: any[]
  processing_time_ms: number
}

export interface StreamChunk {
  event: 'chunk' | 'citation' | 'artifact' | 'done' | 'error'
  content?: string
  citation?: Citation
  artifact?: any
  error?: string
  done?: boolean
}

// ============================================
// SUGGESTIONS
// ============================================

export interface PromptSuggestion {
  id: string
  category: string
  title: string
  prompt: string
  icon: string
  description?: string
}

// ============================================
// SERVICE PRINCIPAL
// ============================================

class ChatSDKService {
  private getAuthHeader(): HeadersInit {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw new Error("Not authenticated")
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  public getAuthHeaders(): HeadersInit {
    return this.getAuthHeader()
  }

  // ============================================
  // CONVERSATIONS
  // ============================================

  async createConversation(
    title: string,
    organizationId: string,
    initialMessage?: string
  ): Promise<Conversation> {
    const headers = this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/sdk/chat/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        organization_id: organizationId,
        initial_message: initialMessage,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create conversation')
    }
    
    return response.json()
  }

  async listConversations(
    organizationId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ConversationList> {
    const headers = this.getAuthHeader()
    
    const url = new URL(`${API_BASE_URL}/sdk/chat/conversations`)
    url.searchParams.set('organization_id', organizationId)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())
    
    const response = await fetch(url.toString(), { headers })
    
    if (!response.ok) {
      throw new Error('Failed to list conversations')
    }
    
    return response.json()
  }

  async getConversation(conversationId: string): Promise<ConversationWithMessages> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/conversations/${conversationId}`,
      { headers }
    )
    
    if (!response.ok) {
      throw new Error('Failed to get conversation')
    }
    
    return response.json()
  }

  async updateConversation(
    conversationId: string,
    title: string
  ): Promise<Conversation> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/conversations/${conversationId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title }),
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to update conversation')
    }
    
    return response.json()
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/conversations/${conversationId}`,
      {
        method: 'DELETE',
        headers,
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to delete conversation')
    }
  }

  // ============================================
  // CHAT STREAMING SSE
  // ============================================

  async streamChatMessage(
    request: ChatRequest,
    callbacks: {
      onChunk?: (content: string) => void
      onCitation?: (citation: Citation) => void
      onArtifact?: (artifact: any) => void
      onDone?: () => void
      onError?: (error: string) => void
    },
    signal?: AbortSignal
  ): Promise<void> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/chat/stream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: request.conversation_id,
          message: request.message,
          mode: request.mode || 'rag_enhanced',
          requested_sources: request.requested_sources,  // ← CORRIGÉ : utiliser le bon nom
          document_ids: request.document_ids,
          lease_ids: request.lease_ids,
          property_ids: request.property_ids,
          include_citations: request.include_citations ?? true,
          max_citations: request.max_citations ?? 5,
          stream: true,
        }),
        signal, // Ajouter le signal d'abort
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to start stream')
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) {
      throw new Error('No reader available')
    }
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.event === 'chunk' && callbacks.onChunk) {
                callbacks.onChunk(data.content)
              } else if (data.event === 'citation' && callbacks.onCitation) {
                callbacks.onCitation(data.citation)
              } else if (data.event === 'artifact' && callbacks.onArtifact) {
                callbacks.onArtifact(data.artifact)
              } else if (data.event === 'done' && callbacks.onDone) {
                callbacks.onDone()
              } else if (data.event === 'error' && callbacks.onError) {
                callbacks.onError(data.error)
              }
            } catch (parseError) {
              // Ignorer les erreurs de parsing
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
      // Ne pas appeler onError si c'est une interruption volontaire
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      reader.releaseLock()
    }
  }

  // ============================================
  // MESSAGES
  // ============================================

  async deleteMessage(messageId: string): Promise<void> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/messages/${messageId}`,
      {
        method: 'DELETE',
        headers,
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to delete message')
    }
  }

  async retryMessage(messageId: string): Promise<void> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/chat/messages/${messageId}/retry`,
      {
        method: 'POST',
        headers,
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to retry message')
    }
  }

  // ============================================
  // SUGGESTIONS
  // ============================================

  async getSuggestions(count: number = 5): Promise<PromptSuggestion[]> {
    // Endpoint public, pas besoin d'auth
    const response = await fetch(
      `${API_BASE_URL}/sdk/suggestions/?count=${count}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to get suggestions')
    }
    
    return response.json()
  }

  async getContextualSuggestions(
    organizationId: string,
    conversationId?: string,
    count: number = 5
  ): Promise<{ suggestions: PromptSuggestion[], context_based: boolean }> {
    const headers = this.getAuthHeader()
    
    const response = await fetch(
      `${API_BASE_URL}/sdk/suggestions/contextual`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: organizationId,
          conversation_id: conversationId,
          count,
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to get contextual suggestions')
    }
    return response.json()
  }
}

export const chatSDKService = new ChatSDKService()

// ============================================
// EXPORTS
// ============================================

export async function exportConversationExcel(
  conversationId: string,
  includeCitations: boolean = true
): Promise<void> {
  const headers = chatSDKService.getAuthHeaders()
  
  const response = await fetch(
    `${API_BASE_URL}/sdk/export/conversation/excel`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        include_citations: includeCitations,
      }),
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to export conversation')
  }
  
  // Télécharger le fichier
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversation_${conversationId}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function exportConversationPDF(
  conversationId: string,
  includeCitations: boolean = true
): Promise<void> {
  const headers = chatSDKService.getAuthHeaders()
  
  const response = await fetch(
    `${API_BASE_URL}/sdk/export/conversation/pdf`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        include_citations: includeCitations,
      }),
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to export conversation')
  }
  
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversation_${conversationId}.pdf`
  a.click()
  window.URL.revokeObjectURL(url)
}
