"use client";

import { useMemo } from "react";
import { useAui } from "@assistant-ui/react";
import type { SuggestionAdapter } from "@assistant-ui/react";

/**
 * Suggestion Adapter Hook
 * Génère des suggestions de suivi basées sur la conversation
 */
export function useSuggestionAdapter(): SuggestionAdapter {
  const aui = useAui();

  return useMemo<SuggestionAdapter>(
    () => ({
      /**
       * Génère des suggestions basées sur les messages de la conversation
       */
      async *generate({ messages }) {
        try {
          // Récupérer le remoteId du thread
          const { remoteId } = aui.threadListItem().getState();
          
          if (!remoteId) {
            console.log("📭 No remoteId, skipping suggestions");
            return;
          }

          console.log(`💡 Generating suggestions for thread ${remoteId}`);

          // Analyser le contexte de la conversation
          const lastMessage = messages[messages.length - 1];
          
          if (!lastMessage || messages.length === 0) {
            console.log("📭 No messages, skipping suggestions");
            return;
          }

          // Appeler l'API pour générer des suggestions
          const response = await fetch(`/api/threads/${remoteId}/suggestions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });

          if (!response.ok) {
            console.error("❌ Failed to generate suggestions:", response.statusText);
            return;
          }

          const { suggestions } = await response.json();
          console.log(`✅ Generated ${suggestions?.length || 0} suggestions`);

          if (!suggestions || suggestions.length === 0) {
            return;
          }

          // Yield les suggestions au format attendu
          yield suggestions.map((prompt: string) => ({
            prompt,
          }));
        } catch (error) {
          console.error("❌ Error generating suggestions:", error);
        }
      },
    }),
    [aui]
  );
}
