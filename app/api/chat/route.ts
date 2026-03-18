import { openai } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
  zodSchema,
  JSONSchema7,
} from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, tools }: { messages: UIMessage[]; tools?: Record<string, { description?: string; parameters: JSONSchema7 }> } = await req.json();


  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages),
    tools: {
      ...frontendTools(tools ?? {}),
    },
  });

  return result.toUIMessageStreamResponse();
}
