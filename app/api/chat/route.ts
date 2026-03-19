import { openai } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText, jsonSchema, stepCountIs, type JSONSchema7, type ToolSet } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, tools }: {
    messages: Array<{ role: string; content: any }>;
    tools?: Record<string, { description?: string; parameters: JSONSchema7 }>;
  } = await req.json();

  // Convert ThreadMessage format (from useLocalRuntime) to model messages
  const modelMessages = messages.map((msg: any) => {
    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        content: Array.isArray(msg.content)
          ? msg.content.map((part: any) => ({
              type: "tool-result" as const,
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              result: part.result,
            }))
          : msg.content,
      };
    }

    if (msg.role === "assistant") {
      return {
        role: "assistant" as const,
        content: Array.isArray(msg.content)
          ? msg.content.map((part: any) => {
              if (part.type === "tool-call") {
                return {
                  type: "tool-call" as const,
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  args: part.args ?? {},
                };
              }
              return { type: "text" as const, text: part.text || "" };
            }).filter((part: any) => part.type !== "text" || part.text)
          : [{ type: "text" as const, text: String(msg.content) }],
      };
    }

    // User and system messages - extract text content
    return {
      role: msg.role as "user" | "system",
      content: Array.isArray(msg.content)
        ? msg.content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("\n")
        : String(msg.content),
    };
  });

  // Backend tools with execute functions (AI SDK handles execution + multi-step)
  const backendTools = {
    getCurrentDate: {
      description: "Get the current date and time",
      inputSchema: jsonSchema({
        type: "object" as const,
        properties: {},
      }),
      execute: async () => {
        const now = new Date();
        return now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
  } as ToolSet;

  const result = streamText({
    model: openai("gpt-4o"),
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    tools: {
      ...backendTools,
      ...frontendTools(tools ?? {}),
    },
  });

  // Stream fullStream as NDJSON for easy parsing by ChatModelAdapter
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          controller.enqueue(
            encoder.encode(JSON.stringify(part) + "\n"),
          );
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  });
}
