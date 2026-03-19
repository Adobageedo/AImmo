"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
  useAui,
  Tools,
  Suggestions,
  type RemoteThreadListAdapter,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { appToolkit } from "@/lib/tools";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { threadListAdapter } from "@/lib/chat/thread-list-adapter";

// In-memory storage for threads (simulating a database)
const threadsStore = new Map<
  string,
  {
    remoteId: string;
    status: "regular" | "archived";
    title?: string;
  }
>();

export function MyRuntimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const aui = useAui({
    tools: Tools({ toolkit: appToolkit }),
    suggestions: Suggestions([
      {
        title: "Test search leases tool",
        label: "Test Search leases",
        prompt: "Search leases",
      },
      {
        title: "Test search properties tool",
        label: "Search properties",
        prompt: "Search properties",
      },
      {
        title: "Test search tenants tool",
        label: "Search tenants",
        prompt: "Search tenants",
      },
    ]),

  });

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => useChatRuntime({
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    }),
    adapter: threadListAdapter,
  });
  

  return (
    <AssistantRuntimeProvider runtime={runtime} aui={aui}>
      {children}
    </AssistantRuntimeProvider>
  );
}
