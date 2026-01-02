# Guide d'Intégration Frontend - Chat SDK

Guide complet pour intégrer l'API Chat SDK dans le frontend Next.js.

## 🎯 Architecture Frontend

```
frontend/
├── app/dashboard/conversations/
│   └── page.tsx                    # Page principale des conversations
├── components/chat/
│   ├── ChatBox.tsx                 # Composant chat principal
│   ├── RagSettingsPopover.tsx     # Paramètres RAG
│   ├── ChatSidebar.tsx            # Sidebar conversations
│   ├── MessageSources.tsx         # Affichage des citations
│   └── MessageArtifact.tsx        # Affichage des artefacts
├── lib/hooks/
│   └── use-chat-mvp.ts            # Hook principal du chat
└── lib/services/
    ├── chat-sdk-service.ts        # Service API chat
    ├── rag-service.ts             # Service API RAG
    └── export-service.ts          # Service API export
```

## 📝 1. Service API Chat

Créer `/lib/services/chat-sdk-service.ts`:

```typescript
import { supabase } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Helper pour récupérer le token Supabase
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// ============================================
// CONVERSATIONS
// ============================================

export async function createConversation(
  title: string,
  organizationId: string,
  initialMessage?: string
) {
  const headers = await getAuthHeaders()
  
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

export async function listConversations(
  organizationId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const headers = await getAuthHeaders()
  
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

export async function getConversation(conversationId: string) {
  const headers = await getAuthHeaders()
  
  const response = await fetch(
    `${API_BASE_URL}/sdk/chat/conversations/${conversationId}`,
    { headers }
  )
  
  if (!response.ok) {
    throw new Error('Failed to get conversation')
  }
  
  return response.json()
}

export async function updateConversation(
  conversationId: string,
  title: string
) {
  const headers = await getAuthHeaders()
  
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

export async function deleteConversation(conversationId: string) {
  const headers = await getAuthHeaders()
  
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

export interface ChatStreamOptions {
  conversationId: string
  message: string
  mode?: 'normal' | 'rag_only' | 'rag_enhanced'
  sourceTypes?: string[]
  onChunk?: (content: string) => void
  onCitation?: (citation: any) => void
  onArtifact?: (artifact: any) => void
  onDone?: () => void
  onError?: (error: string) => void
}

export async function streamChatMessage(options: ChatStreamOptions) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  
  const url = new URL(`${API_BASE_URL}/sdk/chat/chat/stream`)
  
  // Créer la requête avec le body
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: options.conversationId,
      message: options.message,
      mode: options.mode || 'rag_enhanced',
      source_types: options.sourceTypes,
      include_citations: true,
      stream: true,
    }),
  })
  
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
          const data = JSON.parse(line.slice(6))
          
          if (data.event === 'chunk' && options.onChunk) {
            options.onChunk(data.content)
          } else if (data.event === 'citation' && options.onCitation) {
            options.onCitation(data.citation)
          } else if (data.event === 'artifact' && options.onArtifact) {
            options.onArtifact(data.artifact)
          } else if (data.event === 'done' && options.onDone) {
            options.onDone()
          } else if (data.event === 'error' && options.onError) {
            options.onError(data.error)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ============================================
// MESSAGES
// ============================================

export async function deleteMessage(messageId: string) {
  const headers = await getAuthHeaders()
  
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

export async function retryMessage(messageId: string) {
  const headers = await getAuthHeaders()
  
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
  
  return response.json()
}

// ============================================
// SUGGESTIONS
// ============================================

export async function getSuggestions(count: number = 5) {
  // Endpoint public, pas besoin d'auth
  const response = await fetch(
    `${API_BASE_URL}/sdk/suggestions/?count=${count}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to get suggestions')
  }
  
  return response.json()
}

export async function getContextualSuggestions(
  organizationId: string,
  conversationId?: string,
  count: number = 5
) {
  const headers = await getAuthHeaders()
  
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

// ============================================
// EXPORTS
// ============================================

export async function exportConversationExcel(
  conversationId: string,
  includeCitations: boolean = true
) {
  const headers = await getAuthHeaders()
  
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
) {
  const headers = await getAuthHeaders()
  
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
```

## 📝 2. Mise à Jour du Hook useChatMvp

Mettre à jour `/lib/hooks/use-chat-mvp.ts`:

```typescript
import { useState, useCallback, useRef, useEffect } from "react"
import * as ChatSDK from "@/lib/services/chat-sdk-service"
import { Message, Conversation, Citation, PromptSuggestion } from "@/lib/types/chat"

export function useChatMvp(organizationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      const result = await ChatSDK.listConversations(organizationId)
      setConversations(result.conversations)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('Failed to load conversations')
    }
  }, [organizationId])
  
  // Créer une nouvelle conversation
  const createNewConversation = useCallback(async (title: string = "Nouvelle conversation") => {
    try {
      const newConv = await ChatSDK.createConversation(title, organizationId)
      setConversation(newConv)
      setMessages([])
      setCitations([])
      setStreamingContent("")
      await loadConversations()
      return newConv
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setError('Failed to create conversation')
      throw err
    }
  }, [organizationId, loadConversations])
  
  // Sélectionner une conversation
  const selectConversation = useCallback(async (id: string) => {
    try {
      const conv = await ChatSDK.getConversation(id)
      setConversation(conv)
      setMessages(conv.messages || [])
      setCitations([])
      setStreamingContent("")
    } catch (err) {
      console.error('Failed to select conversation:', err)
      setError('Failed to load conversation')
    }
  }, [])
  
  // Renommer une conversation
  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await ChatSDK.updateConversation(id, title)
      await loadConversations()
      if (conversation?.id === id) {
        setConversation(prev => prev ? { ...prev, title } : null)
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err)
      setError('Failed to rename conversation')
    }
  }, [conversation, loadConversations])
  
  // Supprimer une conversation
  const removeConversation = useCallback(async (id: string) => {
    try {
      await ChatSDK.deleteConversation(id)
      await loadConversations()
      if (conversation?.id === id) {
        setConversation(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
      setError('Failed to delete conversation')
    }
  }, [conversation, loadConversations])
  
  // Envoyer un message avec streaming
  const sendUserMessage = useCallback(async (
    message: string,
    options?: {
      mode?: 'normal' | 'rag_only' | 'rag_enhanced'
      sourceTypes?: string[]
    }
  ) => {
    if (!conversation) {
      throw new Error('No active conversation')
    }
    
    setIsLoading(true)
    setIsStreaming(true)
    setStreamingContent("")
    setError(null)
    
    // Ajouter le message utilisateur immédiatement
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      citations: [],
      artifacts: [],
      created_at: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    
    try {
      const streamCitations: Citation[] = []
      
      await ChatSDK.streamChatMessage({
        conversationId: conversation.id,
        message,
        mode: options?.mode || 'rag_enhanced',
        sourceTypes: options?.sourceTypes,
        onChunk: (content) => {
          setStreamingContent(prev => prev + content)
        },
        onCitation: (citation) => {
          streamCitations.push(citation)
          setCitations(prev => [...prev, citation])
        },
        onArtifact: (artifact) => {
          // Gérer les artefacts
          console.log('Artifact received:', artifact)
        },
        onDone: () => {
          // Ajouter le message assistant complet
          const assistantMessage: Message = {
            id: `msg-${Date.now()}`,
            conversation_id: conversation.id,
            role: 'assistant',
            content: streamingContent,
            citations: streamCitations,
            artifacts: [],
            created_at: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent("")
          setIsStreaming(false)
          setIsLoading(false)
        },
        onError: (error) => {
          setError(error)
          setIsStreaming(false)
          setIsLoading(false)
        },
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
      setIsStreaming(false)
      setIsLoading(false)
    }
  }, [conversation, streamingContent])
  
  // Arrêter le streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsLoading(false)
  }, [])
  
  // Retry un message
  const retryLastMessage = useCallback(async () => {
    if (messages.length < 2) return
    
    const lastUserMessage = messages[messages.length - 2]
    if (lastUserMessage.role === 'user') {
      const lastAssistantMessage = messages[messages.length - 1]
      
      // Supprimer la réponse assistant via API
      try {
        await ChatSDK.retryMessage(lastAssistantMessage.id)
        // Retirer les 2 derniers messages localement
        setMessages(prev => prev.slice(0, -2))
        // Renvoyer le message
        await sendUserMessage(lastUserMessage.content)
      } catch (err) {
        console.error('Failed to retry:', err)
        setError('Failed to retry message')
      }
    }
  }, [messages, sendUserMessage])
  
  // Charger les suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      const result = await ChatSDK.getContextualSuggestions(
        organizationId,
        conversation?.id
      )
      setSuggestions(result.suggestions)
    } catch (err) {
      // Fallback sur suggestions générales
      try {
        const generalSuggestions = await ChatSDK.getSuggestions(5)
        setSuggestions(generalSuggestions)
      } catch {
        console.error('Failed to load suggestions')
      }
    }
  }, [organizationId, conversation])
  
  // Charger les suggestions au démarrage
  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])
  
  return {
    // Messages
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    
    // Conversations
    conversation,
    conversations,
    loadConversations,
    selectConversation,
    createNewConversation,
    renameConversation,
    removeConversation,
    
    // Messages
    sendUserMessage,
    stopStreaming,
    retryLastMessage,
    
    // Suggestions
    suggestions,
    loadSuggestions,
    
    // Citations
    citations,
  }
}
```

## 📝 3. Variables d'Environnement

Créer `.env.local`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 🚀 4. Utilisation dans les Composants

```typescript
// Dans app/dashboard/conversations/page.tsx
'use client'

import { useChatMvp } from '@/lib/hooks/use-chat-mvp'
import { ChatBox } from '@/components/chat/ChatBox'
import { useAuth } from '@/lib/hooks/use-auth'

export default function ConversationsPage() {
  const { user, organization } = useAuth()
  
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendUserMessage,
    stopStreaming,
    conversation,
    createNewConversation,
    // ... autres méthodes
  } = useChatMvp(organization.id)
  
  return (
    <div className="h-screen flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
        
        {isStreaming && (
          <div className="streaming-message">
            {streamingContent}
          </div>
        )}
      </div>
      
      {/* Input */}
      <ChatBox
        onSend={sendUserMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onStop={stopStreaming}
      />
    </div>
  )
}
```

## ✅ Checklist d'Intégration

- [ ] Installer les dépendances backend (`pip install -r requirements.txt`)
- [ ] Exécuter le script SQL (`sql/chat_sdk_tables.sql`) dans Supabase
- [ ] Configurer les variables d'environnement backend (.env)
- [ ] Démarrer le serveur backend (`uvicorn app.main:app --reload`)
- [ ] Configurer les variables d'environnement frontend (.env.local)
- [ ] Créer le service `chat-sdk-service.ts`
- [ ] Mettre à jour le hook `use-chat-mvp.ts`
- [ ] Tester la création de conversation
- [ ] Tester le streaming SSE
- [ ] Tester les exports
- [ ] Tester les suggestions

## 🔍 Debugging

### Streaming ne fonctionne pas
- Vérifier que le token Supabase est valide
- Vérifier les CORS dans le backend
- Vérifier que `X-Accel-Buffering: no` est présent

### Erreur 401 Unauthorized
- Le token JWT Supabase a expiré, rafraîchir la session
- Vérifier que `Authorization: Bearer <token>` est présent

### Erreur 403 Forbidden
- L'utilisateur n'appartient pas à l'organisation
- Vérifier la table `organization_users`

### Messages ne s'affichent pas
- Vérifier que `conversation.id` est correct
- Vérifier les permissions RLS dans Supabase

## 📚 Ressources

- [Documentation API complète](./backend/CHAT_SDK_API_DOCUMENTATION.md)
- [Schéma SQL](./backend/sql/chat_sdk_tables.sql)
- [Types TypeScript](./frontend/lib/types/chat.ts)
