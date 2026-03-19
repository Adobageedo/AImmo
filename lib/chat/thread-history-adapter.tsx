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
          // Récupérer le remoteId du thread
          const { remoteId } = aui.threadListItem().getState();
          
          if (!remoteId) {
            return { messages: [] };
          }

          // Récupérer les messages depuis l'API
          const response = await fetch(`/api/threads/${remoteId}/messages`);
          
          if (!response.ok) {
            console.error("Failed to load messages");
            return { messages: [] };
          }

          const { messages } = await response.json();

          // Convertir au format assistant-ui
          return {
            messages: messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
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
          // Attendre l'initialisation du thread (safe to call multiple times)
          const { remoteId } = await aui.threadListItem().initialize();

          // Debug: Log the raw message received by the adapter
          console.log(`� DEBUG: ThreadHistoryAdapter - Message reçu: ${JSON.stringify(message, null, 2)}`);

          // Ensure message is not null or undefined
          if (!message) {
            console.error("🔥 DEBUG: Message is null or undefined");
            return;
          }

          // Check if the message is wrapped by assistant-ui's internal structure
          const messageWrapper = message as any;
          let messageData: any;

          if (messageWrapper && messageWrapper.message) {
            messageData = messageWrapper.message;
          } else {
            messageData = message;
          }

          // Log the extracted message data
          console.log(`🔥 DEBUG: MessageData extrait: ${JSON.stringify(messageData, null, 2)}`);

          // Valider le role et le content
          if (!messageData?.role || !messageData?.content) {
            console.error("❌ Message role or content is missing", {
              role: messageData?.role,
              content: messageData?.content,
              wrapperKeys: Object.keys(messageWrapper || {}),
              messageKeys: Object.keys(messageData || {})
            });
            return;
          }

          // S'assurer que le role est valide
          const validRoles = ['user', 'assistant', 'system', 'tool'];
          if (!validRoles.includes(messageData.role)) {
            console.error(`Invalid role: ${messageData.role}`);
            return;
          }

          // Log before saving to API
          console.log(` DEBUG: Envoi vers /api/threads/${remoteId}/messages`);

          // Préparer le contenu pour la sauvegarde
          let contentToSave = messageData.content;
          if (messageData.parts && Array.isArray(messageData.parts)) {
            contentToSave = messageData.parts;
          }

          console.log(` DEBUG: Contenu à sauvegarder:`, JSON.stringify(contentToSave, null, 2));

          // Sauvegarder le message
          const response = await fetch(`/api/threads/${remoteId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: messageData.role,
              content: contentToSave,
              metadata: {
                messageId: messageData.id,
                createdAt: messageData.createdAt?.toISOString?.(),
              },
            }),
          });

          console.log(` DEBUG: Response status:`, response.status);

          if (!response.ok) {
            console.error(" DEBUG: Failed to save message:", response.statusText);
            const errorText = await response.text();
            console.error(" DEBUG: Error response:", errorText);
            return;
          }

          const result = await response.json();
          console.log(` DEBUG: Message saved successfully:`, result);
        } catch (error) {
          console.error("Error appending message:", error);
        }
      },
    }),
    [aui]
  );
}
