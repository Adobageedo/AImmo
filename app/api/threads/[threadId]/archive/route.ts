import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/threads/[threadId]/archive
 * Archive un thread
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
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", threadId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error archiving thread:", error);
      return NextResponse.json(
        { error: "Failed to archive thread" },
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
