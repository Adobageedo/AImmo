"use client";

import { useMemo, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useAui,
  RuntimeAdapterProvider,
  Tools,
} from "@assistant-ui/react";
import { threadListAdapter } from "@/lib/chat/thread-list-adapter";
import { useThreadHistoryAdapter } from "@/lib/chat/thread-history-adapter";
import { appToolkit } from "@/lib/tools";
import {
  type ChatModelAdapter,
} from "@assistant-ui/react";


import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";

/**
 * Thread Provider Component
 * Fournit les adapters spécifiques à chaque thread
 */
function ThreadProvider({ children }: { children: ReactNode }) {
  const history = useThreadHistoryAdapter();

  const adapters = useMemo(
    () => ({
      history,
    }),
    [history]
  );

  return (
    <RuntimeAdapterProvider adapters={adapters}>
      {children}
    </RuntimeAdapterProvider>
  );
}

/**
 * Chat Runtime Provider
 * Provider principal qui gère le multi-thread avec persistance Supabase
 * 
 * Uses the recommended Tools() API for centralized tool registration.
 * All tools are defined in lib/tools/ and aggregated in appToolkit.
 */
export function ChatRuntimeProvider({ children }: { children: ReactNode }) {
  console.log("🏗️ DEBUG: ChatRuntimeProvider initializing");
  
  // Register tools using the Tools() API
  const aui = useAui({
    tools: Tools({ toolkit: appToolkit }),
  });

  console.log("🔧 DEBUG: Tools registered in AUI:", Object.keys(appToolkit));
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  // const runtime = useRemoteThreadListRuntime({
  //   // Runtime hook pour chaque thread
  //   runtimeHook: () => {
  //     console.log("🚀 DEBUG: Runtime hook called - creating LocalRuntime");
      
  //     // Create LocalRuntime with tools from context
  //     const localRuntime = useLocalRuntime(MyModelAdapter, {
  //       maxSteps: 5, // Allow up to 5 sequential tool calls
  //     });
      
  //     console.log("✅ DEBUG: LocalRuntime created");
  //     return localRuntime;
  //   },    

  //   // Adapter pour gérer la liste des threads
  //   adapter: {
  //     ...threadListAdapter,

  //     // Provider pour injecter les adapters spécifiques à chaque thread
  //     unstable_Provider: ThreadProvider,
  //   },
  // });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
