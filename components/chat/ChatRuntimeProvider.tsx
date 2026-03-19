"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
  useLocalRuntime,
  useAui,
  Tools,
  Suggestions,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { appToolkit } from "@/lib/tools";
import { threadListAdapter } from "@/lib/chat/thread-list-adapter";

/**
 * ChatModelAdapter that sends messages to /api/chat and parses the NDJSON stream.
 * Handles text deltas and tool calls from the backend.
 */
const chatModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal, context }) {
    console.log("🔧 Adapter run called. context.tools:", context.tools);

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

    // Track tool calls: id -> { toolName, argsText (accumulated), args (parsed) }
    const toolCallsMap = new Map<
      string,
      {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: any;
        argsText: string;
      }
    >();
    // Accumulate raw arg text per tool call during streaming
    const toolArgsTextMap = new Map<string, string>();

    const processLine = (line: string) => {
      if (!line.trim()) return;
      try {
        const part = JSON.parse(line);
        console.log("📡 Stream event:", part.type, part);

        if (part.type === "text-delta" && part.text) {
          currentText += part.text;
        }

        // Tool input streaming: start a new tool call entry
        if (part.type === "tool-input-start") {
          toolArgsTextMap.set(part.id, "");
          toolCallsMap.set(part.id, {
            type: "tool-call" as const,
            toolCallId: part.id,
            toolName: part.toolName,
            args: {},
            argsText: "",
          });
        }

        // Tool input streaming: accumulate arg JSON deltas
        if (part.type === "tool-input-delta") {
          const prev = toolArgsTextMap.get(part.id) || "";
          toolArgsTextMap.set(part.id, prev + part.delta);
          // Try to parse partial args for UI preview
          const accumulated = toolArgsTextMap.get(part.id) || "";
          try {
            const parsed = JSON.parse(accumulated);
            const existing = toolCallsMap.get(part.id);
            if (existing) {
              existing.args = parsed;
              existing.argsText = accumulated;
            }
          } catch {
            // Partial JSON, not parseable yet — update argsText only
            const existing = toolCallsMap.get(part.id);
            if (existing) {
              existing.argsText = accumulated;
            }
          }
        }

        // Tool input complete: final parse of args
        if (part.type === "tool-input-end") {
          const accumulated = toolArgsTextMap.get(part.id) || "";
          try {
            const parsed = JSON.parse(accumulated);
            const existing = toolCallsMap.get(part.id);
            if (existing) {
              existing.args = parsed;
              existing.argsText = accumulated;
            }
          } catch {
            // Should not happen
          }
        }

        // Final tool-call event: ensure args are set from input field
        if (part.type === "tool-call") {
          const toolArgs = part.input ?? part.args ?? {};
          const existing = toolCallsMap.get(part.toolCallId);
          if (existing) {
            existing.args = toolArgs;
            existing.argsText = JSON.stringify(toolArgs);
          } else {
            toolCallsMap.set(part.toolCallId, {
              type: "tool-call" as const,
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              args: toolArgs,
              argsText: JSON.stringify(toolArgs),
            });
          }
        }
      } catch {
        // Skip unparseable lines
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        processLine(line);
      }

      // Build content from accumulated state and yield
      const content = [
        ...(currentText
          ? [{ type: "text" as const, text: currentText }]
          : []),
        ...Array.from(toolCallsMap.values()),
      ];

      if (content.length > 0) {
        yield { content };
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      processLine(buffer);
    }

    // Final yield with complete content
    const finalContent = [
      ...(currentText
        ? [{ type: "text" as const, text: currentText }]
        : []),
      ...Array.from(toolCallsMap.values()),
    ];

    if (finalContent.length > 0) {
      console.log("✅ Adapter final yield:", finalContent);
      yield { content: finalContent };
    }

    console.log("✅ Adapter generator complete");
  },
};

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
    runtimeHook: () =>
      useLocalRuntime(chatModelAdapter, {
        maxSteps: 5,
      }),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime} aui={aui}>
      {children}
    </AssistantRuntimeProvider>
  );
}
