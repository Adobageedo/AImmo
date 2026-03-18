import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CreateMessageInput } from "@/types/chat";

/**
 * GET /api/threads/[threadId]/messages
 * Récupère tous les messages d'un thread
 */
export async function GET(
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

    // Récupérer les messages
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads/[threadId]/messages
 * Ajoute un message à un thread
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

    const body: Omit<CreateMessageInput, "thread_id"> = await req.json();

    // Valider le role et le content
    if (!body.role || !body.content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    // S'assurer que le role est valide
    const validRoles = ['user', 'assistant', 'system', 'tool'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Créer le message
    const { data: message, error } = await supabase
      .from("chat_messages")
      .insert({
        thread_id: threadId,
        role: body.role,
        content: body.content,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
