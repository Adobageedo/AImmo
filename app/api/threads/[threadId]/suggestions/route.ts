import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * POST /api/threads/[threadId]/suggestions
 * Génère des suggestions de suivi basées sur la conversation
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { messages } = await req.json();

    // Extraire le contenu textuel des derniers messages
    const conversationContext = messages
      .slice(-5) // Prendre les 5 derniers messages pour le contexte
      .map((m: any) => {
        const role = m.role === "user" ? "User" : "Assistant";
        if (Array.isArray(m.content)) {
          const text = m.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ");
          return `${role}: ${text}`;
        }
        return `${role}: ${m.content}`;
      })
      .join("\n");

    // Générer des suggestions avec OpenAI
    const { text: suggestionsText } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Based on this conversation, generate 3 helpful follow-up questions or prompts the user might want to ask next. 
Return ONLY a JSON array of strings, nothing else. Each suggestion should be a complete question or prompt (max 10 words).

Conversation:
${conversationContext}

Example format: ["Question 1?", "Question 2?", "Question 3?"]

Suggestions:`,
    });

    // Parser les suggestions
    let suggestions: string[];
    try {
      suggestions = JSON.parse(suggestionsText.trim());
      if (!Array.isArray(suggestions)) {
        throw new Error("Invalid format");
      }
    } catch (parseError) {
      // Fallback: extraire les suggestions manuellement
      suggestions = suggestionsText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 3);
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
