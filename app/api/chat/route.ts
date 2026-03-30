import { openai } from "@ai-sdk/openai";
import { streamText, jsonSchema, stepCountIs } from "ai";
import { z } from "zod";
import { LLMConfig } from "@/lib/llm/config";

export const maxDuration = 30;

/**
 * Convert a raw Zod v4 internal structure (sent by assistant-ui's Tools() API)
 * into a proper JSON Schema object that OpenAI accepts.
 */
function zodInternalToJsonSchema(zodObj: any): Record<string, unknown> {
  if (!zodObj || typeof zodObj !== "object") {
    return { type: "object", properties: {} };
  }

  const typeName = zodObj.type ?? zodObj.def?.type;

  if (typeName === "object") {
    const shape = zodObj.def?.shape ?? zodObj.shape ?? {};
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const field = value as any;
      const fieldType = field.type ?? field.def?.type;

      if (fieldType === "optional") {
        properties[key] = zodInternalToJsonSchema(field.def?.innerType ?? field.innerType);
      } else {
        properties[key] = zodInternalToJsonSchema(field);
        required.push(key);
      }
    }

    const schema: Record<string, unknown> = { type: "object", properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  if (typeName === "string") {
    return { type: "string" };
  }

  if (typeName === "number") {
    const isInt = zodObj.isInt ?? zodObj.def?.isInt;
    return { type: isInt ? "integer" : "number" };
  }

  if (typeName === "boolean") {
    return { type: "boolean" };
  }

  if (typeName === "enum") {
    const options = zodObj.options ?? Object.values(zodObj.def?.entries ?? zodObj.enum ?? {});
    return { type: "string", enum: options };
  }

  if (typeName === "array") {
    const items = zodObj.def?.element ?? zodObj.element;
    return { type: "array", items: items ? zodInternalToJsonSchema(items) : {} };
  }

  if (typeName === "optional") {
    return zodInternalToJsonSchema(zodObj.def?.innerType ?? zodObj.innerType);
  }

  // Fallback
  return { type: "string" };
}

/**
 * Convert frontend tool definitions (with raw Zod v4 internals as parameters)
 * into AI SDK tool definitions that OpenAI accepts.
 * These are "frontend tools" — no execute function, so results come from the client.
 */
function buildFrontendTools(
  clientTools: Record<string, { description?: string; parameters: any }>,
) {
  const result: Record<string, any> = {};

  for (const [name, tool] of Object.entries(clientTools)) {
    const schema = zodInternalToJsonSchema(tool.parameters);
    result[name] = {
      description: tool.description ?? "",
      inputSchema: jsonSchema(schema as any),
      // No execute → AI SDK treats this as a tool the caller must handle
    };
  }

  return result;
}

export async function POST(req: Request) {
  const { messages, tools }: {
    messages: Array<{ role: string; content: any }>;
    tools?: Record<string, { description?: string; parameters: any }>;
  } = await req.json();

  // Convert ThreadMessage content format to AI SDK CoreMessage format
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
          ? msg.content
              .map((part: any) => {
                if (part.type === "tool-call") {
                  return {
                    type: "tool-call" as const,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    args: part.args ?? {},
                  };
                }
                return { type: "text" as const, text: part.text || "" };
              })
              .filter((p: any) => p.type !== "text" || p.text)
          : [{ type: "text" as const, text: String(msg.content) }],
      };
    }

    // User and system messages – flatten text parts
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

  // Build frontend tools from raw Zod v4 internals → proper JSON Schema
  const convertedFrontendTools = buildFrontendTools(tools ?? {});

  const result = streamText({
    model: openai("gpt-4o"),
    system: LLMConfig.systemPrompt,
    messages: modelMessages,
    stopWhen: stepCountIs(15),
    tools: {
      ...convertedFrontendTools,
      // All tools are now frontend tools for consistent human-in-the-loop approval
    },
  });

  // Stream fullStream as NDJSON for the ChatModelAdapter to parse
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          controller.enqueue(encoder.encode(JSON.stringify(part) + "\n"));
        }
        controller.close();
      } catch (error) {
        console.error("[chat/route] Stream error:", error);
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
