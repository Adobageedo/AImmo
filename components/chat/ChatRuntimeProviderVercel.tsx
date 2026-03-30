import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useAui,
  Tools,
  Suggestions,
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { appToolkit } from "@/lib/tools/toolkit";

export function MyRuntimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const aui = useAui({
      tools: Tools({ toolkit: appToolkit }),
      suggestions: Suggestions([
        {
          title: "Rechercher des baux",
          label: "Chercher mes baux",
          prompt: "Recherche tous mes baux actifs",
        },
        {
          title: "Résumé d'un bail",
          label: "Résumé de bail",
          prompt: "Donne-moi un résumé du dernier bail",
        },
        {
          title: "Rechercher des locataires",
          label: "Mes locataires",
          prompt: "Liste tous mes locataires",
        },
        {
          title: "Date du jour",
          label: "Quelle date sommes-nous ?",
          prompt: "Quelle est la date et l'heure actuelle ?",
        },
      ]),
    });
  
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new AssistantChatTransport({
      api: "/api/chatvercel",
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, options);
          
          // Gérer les erreurs du serveur
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
            
            // Afficher l'erreur dans le chat
            throw new Error(`❌ ${errorMessage}`);
          }
          
          return response;
        } catch (error) {
          // Laisser les erreurs réseau passer normalement
          throw error;
        }
      },
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime} aui={aui}>
      {children}
    </AssistantRuntimeProvider>
  );
}