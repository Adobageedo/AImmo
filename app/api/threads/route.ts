import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ChatThread, CreateThreadInput } from "@/types/chat";

/**
 * GET /api/threads
 * Liste tous les threads de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les threads de l'utilisateur
    const { data: threads, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching threads:", error);
      return NextResponse.json(
        { error: "Failed to fetch threads" },
        { status: 500 }
      );
    }

    return NextResponse.json({ threads: threads || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads
 * Crée un nouveau thread
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer l'organization_id de l'utilisateur
    const { data: userOrg, error: orgError } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json(
        { error: "User organization not found" },
        { status: 404 }
      );
    }

    const body: CreateThreadInput = await req.json();

    // Créer le thread
    const { data: thread, error } = await supabase
      .from("chat_threads")
      .insert({
        organization_id: userOrg.organization_id,
        user_id: user.id,
        title: body.title || null,
        external_id: body.external_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating thread:", error);
      return NextResponse.json(
        { error: "Failed to create thread" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: thread.id,
      external_id: thread.external_id,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
