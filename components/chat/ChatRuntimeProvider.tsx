"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
  useLocalRuntime,
  useAui,
  Suggestions,
  Tools,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { threadListAdapter } from "@/lib/chat/thread-list-adapter";
import { appToolkit } from "@/lib/tools/toolkit";

/**
 * ChatModelAdapter – streams NDJSON from /api/chat and yields
 * ChatModelRunResult updates for the LocalRuntime.
 *
 * Handles:
 *  - text-delta      → accumulates text
 *  - tool-call       → registers tool call
 *  - tool-result     → attaches result to backend-executed tool calls
 *  - finish-step     → tracks finish reason
 *  - Frontend tools  → executed client-side after stream ends
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
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
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
        args: Record<string, unknown>;
        argsText: string;
        result?: unknown;
      }
    >();

    function buildContent() {
      const content: any[] = [];
      for (const tc of toolCallsMap.values()) {
        content.push(tc);
      }
      if (currentText) {
        content.push({ type: "text" as const, text: currentText });
      }
      return content;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        let part: any;
        try {
          part = JSON.parse(line);
        } catch {
          continue;
        }

        if (part.type === "text-delta") {
          const delta = part.textDelta ?? part.text ?? "";
          if (delta) currentText += delta;
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
              result: part.result ?? part.output,
            });
          }
        }

        // Yield intermediate content (shows tool call cards in "running" state)
        const content = buildContent();
        if (content.length > 0) {
          yield { content };
        }
      }
    }

    // ── Execute unresolved frontend tools ──
    // The backend doesn't execute frontend tools (no `execute` function on server).
    // We execute them here using the toolkit's execute functions.
    const unresolvedCalls = Array.from(toolCallsMap.values()).filter(
      (tc) => tc.result === undefined,
    );

    if (unresolvedCalls.length > 0) {
      for (const tc of unresolvedCalls) {
        const toolDef = (appToolkit as any)[tc.toolName];
        if (toolDef?.execute) {
          try {
            const result = await toolDef.execute(tc.args);
            toolCallsMap.set(tc.toolCallId, { ...tc, result });
          } catch (err: any) {
            toolCallsMap.set(tc.toolCallId, {
              ...tc,
              result: { error: err.message ?? "Execution failed" },
            });
          }
        }
      }

      // Yield with results attached
      yield { content: buildContent() };
    }

    // Final yield with complete status
    const finalContent = buildContent();
    if (finalContent.length > 0) {
      yield {
        content: finalContent,
        status: { type: "complete" as const, reason: "stop" },
      };
    }
  },
};

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
