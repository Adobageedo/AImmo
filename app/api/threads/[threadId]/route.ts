import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { UpdateThreadInput } from "@/types/chat";

/**
 * GET /api/threads/[threadId]
 * Récupère un thread spécifique
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

    const { data: thread, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      is_archived: thread.is_archived,
      status: thread.is_archived ? "archived" : "regular",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/threads/[threadId]
 * Met à jour un thread (titre, archivage, etc.)
 */
export async function PATCH(
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

    const body: UpdateThreadInput = await req.json();

    const { data: thread, error } = await supabase
      .from("chat_threads")
      .update({
        title: body.title,
        is_archived: body.is_archived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !thread) {
      console.error("Error updating thread:", error);
      return NextResponse.json(
        { error: "Failed to update thread" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/threads/[threadId]
 * Supprime un thread et tous ses messages
 */
export async function DELETE(
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

    // Supprimer le thread (les messages seront supprimés en cascade)
    const { error } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting thread:", error);
      return NextResponse.json(
        { error: "Failed to delete thread" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
