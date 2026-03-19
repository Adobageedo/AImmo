"use client";

import { useMemo } from "react";
import { useAui } from "@assistant-ui/react";
import type { ThreadHistoryAdapter } from "@assistant-ui/react";

/**
 * Thread History Adapter Hook
 * Gère la persistance des messages pour un thread spécifique
 */
export function useThreadHistoryAdapter(): ThreadHistoryAdapter {
  const aui = useAui();

  return useMemo<ThreadHistoryAdapter>(
    () => ({
      /**
       * Charge les messages d'un thread depuis la base de données
       */
      async load() {
        try {
          const { remoteId } = aui.threadListItem().getState();

          if (!remoteId) {
            return { messages: [] };
          }

          const response = await fetch(`/api/threads/${remoteId}/messages`);

          if (!response.ok) {
            console.error("Failed to load messages:", response.statusText);
            return { messages: [] };
          }

          const { messages } = await response.json();

          if (!messages || messages.length === 0) {
            return { messages: [] };
          }

          // Convert to { parentId, message } wrapper format expected by useLocalRuntime
          return {
            messages: messages.map((msg: any, index: number) => ({
              parentId: index > 0 ? (messages[index - 1].metadata?.messageId || messages[index - 1].id) : null,
              message: {
                id: msg.metadata?.messageId || msg.id,
                role: msg.role,
                content: Array.isArray(msg.content) ? msg.content : [{ type: "text", text: String(msg.content) }],
                createdAt: new Date(msg.created_at),
                attachments: [],
                ...(msg.role === "assistant" && {
                  status: { type: "complete" as const, reason: "unknown" as const },
                }),
                metadata: {
                  ...(msg.metadata || {}),
                  custom: {},
                },
              },
            })),
          };
        } catch (error) {
          console.error("Error loading messages:", error);
          return { messages: [] };
        }
      },

      /**
       * Ajoute un message au thread
       * IMPORTANT: Attend l'initialisation pour éviter les race conditions
       */
      async append(message) {
        try {
          const wrapper = message as any;
          const messageData = wrapper?.message ?? message;

          // Skip messages with empty content (called before stream completes)
          if (
            !messageData?.content ||
            (Array.isArray(messageData.content) && messageData.content.length === 0)
          ) {
            return;
          }

          const { remoteId } = await aui.threadListItem().initialize();

          const validRoles = ["user", "assistant", "system", "tool"];
          if (!messageData?.role || !validRoles.includes(messageData.role)) {
            return;
          }

          const response = await fetch(`/api/threads/${remoteId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: messageData.role,
              content: messageData.content,
              metadata: {
                messageId: messageData.id,
                createdAt: messageData.createdAt?.toISOString?.(),
              },
            }),
          });

          if (!response.ok) {
            console.error("Failed to save message:", response.statusText);
          }
        } catch (error) {
          console.error("Error appending message:", error);
        }
      },
    }),
    [aui],
  );
}
