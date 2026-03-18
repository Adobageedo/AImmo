import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * POST /api/threads/[threadId]/title
 * Génère un titre pour le thread basé sur les messages
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const supabase = await createClient();
    const { threadId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    // Vérifier que le thread appartient à l'utilisateur
    const { data: thread, error: threadError } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Extraire le contenu textuel des premiers messages
    const conversationContext = messages
      .slice(0, 3) // Prendre les 3 premiers messages
      .map((m: any) => {
        if (Array.isArray(m.content)) {
          return m.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ");
        }
        return m.content;
      })
      .join("\n");

    // Générer un titre avec OpenAI
    const { text: title } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Generate a short, concise title (max 6 words) for this conversation. Only return the title, nothing else.

Conversation:
${conversationContext}

Title:`,
    });

    // Mettre à jour le thread avec le nouveau titre
    await supabase
      .from("chat_threads")
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId)
      .eq("user_id", user.id);

    return NextResponse.json({ title: title.trim() });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
