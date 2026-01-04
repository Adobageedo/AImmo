/**
 * useChatConversations Hook
 * Gère les conversations (liste, CRUD)
 */

import { useState, useCallback, useEffect } from "react";
import { Conversation, ConversationCreateRequest } from "../types/conversation";
import { conversationService } from "../services/conversationService";

interface UseChatConversationsOptions {
  organizationId: string;
  autoLoad?: boolean;
}

export function useChatConversations({
  organizationId,
  autoLoad = true,
}: UseChatConversationsOptions) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await conversationService.listConversations(organizationId);
      setConversations(response.conversations || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load conversations");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const createConversation = useCallback(
    async (title: string, initialMessage?: string): Promise<Conversation | null> => {
      if (!organizationId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const request: ConversationCreateRequest = {
          title,
          organization_id: organizationId,
          initial_message: initialMessage,
        };

        const newConversation = await conversationService.createConversation(request);
        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        return newConversation;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create conversation");
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await conversationService.updateConversation(conversationId, { title });
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? updated : conv))
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updated);
        }
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to update conversation");
        setError(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversation]
  );

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await conversationService.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
        }
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete conversation");
        setError(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversation]
  );

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setCurrentConversation(conversation);
  }, []);

  useEffect(() => {
    if (autoLoad && organizationId) {
      loadConversations();
    }
  }, [autoLoad, organizationId, loadConversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadConversations,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    selectConversation,
  };
}
