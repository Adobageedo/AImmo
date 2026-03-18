import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { data: organizationUsers, error: orgUsersError } = await supabase
      .from("organization_users")
      .select("organization_id, role, organizations(*)")
      .eq("user_id", user.id);

    if (orgUsersError) {
      console.error("Error fetching organization users:", orgUsersError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des organisations" },
        { status: 500 }
      );
    }

    const organizations = organizationUsers?.map((ou) => ({
      ...ou.organizations,
      role: ou.role,
    })) || [];

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue" },
      { status: 500 }
    );
  }
}
