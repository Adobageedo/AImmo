"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
  useLocalRuntime,
  useAui,
  Suggestions,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { threadListAdapter } from "@/lib/chat/thread-list-adapter";
import { GetCurrentDateToolUI } from "@/components/assistant-ui/tools/GetCurrentDateToolUI";

/**
 * ChatModelAdapter that sends messages to /api/chat and parses the NDJSON stream.
 * Handles text deltas and tool calls from the backend.
 */
const chatModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal, context }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        tools: context.tools,
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentText = "";
    const toolCallsMap = new Map<
      string,
      {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: any;
        argsText: string;
        result?: any;
      }
    >();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const part = JSON.parse(line);
          console.log("📡 Stream:", part.type, JSON.stringify(part).slice(0, 200));

          if (part.type === "text-delta" && part.text) {
            currentText += part.text;
          }

          if (part.type === "tool-call") {
            const args = part.args ?? part.input ?? {};
            toolCallsMap.set(part.toolCallId, {
              type: "tool-call" as const,
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args,
              argsText: JSON.stringify(args),
            });
          }

          if (part.type === "tool-result") {
            const existing = toolCallsMap.get(part.toolCallId);
            if (existing) {
              toolCallsMap.set(part.toolCallId, {
                ...existing,
                result: part.output ?? part.result,
              });
            }
          }

          // Build content from accumulated state
          const content = [
            ...(currentText
              ? [{ type: "text" as const, text: currentText }]
              : []),
            ...Array.from(toolCallsMap.values()),
          ];

          if (content.length > 0) {
            yield { content };
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }
  },
};

export function MyRuntimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const aui = useAui({
    suggestions: Suggestions([
      {
        title: "Test search leases tool",
        label: "Test Search leases",
        prompt: "test Search leases with random values",
      },
      {
        title: "Test search get_lease_summary tool",
        label: "Search properties",
        prompt: "test get_lease_summary",
      },
      {
        title: "Test search tenants tool",
        label: "Search tenants",
        prompt: "Search tenants",
      },
      {
        title: "Get current date",
        label: "What's today's date?",
        prompt: "What's the current date and time?",
      },
    ]),
  });

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () =>
      useLocalRuntime(chatModelAdapter, {
        maxSteps: 5,
      }),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime} aui={aui}>
      <GetCurrentDateToolUI />
      {children}
    </AssistantRuntimeProvider>
  );
}
