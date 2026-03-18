import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/threads/[threadId]/unarchive
 * Désarchive un thread
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

    const { error } = await supabase
      .from("chat_threads")
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq("id", threadId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error unarchiving thread:", error);
      return NextResponse.json(
        { error: "Failed to unarchive thread" },
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
