/**
 * useChat Hook
 * Hook principal pour la gestion du chat
 */

import { useState, useCallback } from "react";
import { ChatMode, ChatRequest } from "../types/chat";
import { Message, MessageRole, Citation } from "../types/message";
import { chatService } from "../services/chatService";
import { SourceType } from "../types/document";

interface UseChatOptions {
  conversationId: string;
  mode?: ChatMode;
  onError?: (error: Error) => void;
}

export function useChat({ conversationId, mode = ChatMode.NORMAL, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Options RAG (gérées par le frontend, traitées par MCP)
  const [ragSources, setRagSources] = useState<SourceType[]>([
    SourceType.DOCUMENT,
    SourceType.LEASE,
    SourceType.PROPERTY,
  ]);
  const [strictMode, setStrictMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Créer le message utilisateur
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: MessageRole.USER,
        content,
        citations: [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const request: ChatRequest = {
          conversation_id: conversationId,
          message: content,
          mode,
          source_types: ragSources,
          document_ids: selectedDocuments.length > 0 ? selectedDocuments : undefined,
          include_citations: true,
          stream: false,
        };

        const response = await chatService.sendMessage(request);

        // Ajouter le message assistant
        setMessages((prev) => [...prev, response.message]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
        // Retirer le message utilisateur en cas d'erreur
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, mode, ragSources, selectedDocuments, isLoading, onError]
  );

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedMessages = await chatService.getMessages(conversationId);
      setMessages(loadedMessages);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load messages");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    clearMessages,
    // RAG options
    ragSources,
    setRagSources,
    strictMode,
    setStrictMode,
    selectedDocuments,
    setSelectedDocuments,
  };
}
