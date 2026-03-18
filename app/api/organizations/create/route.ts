import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'organisation est requis" },
        { status: 400 }
      );
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'organisation" },
        { status: 500 }
      );
    }

    const { error: userOrgError } = await supabase
      .from("organization_users")
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        role: "admin",
      });

    if (userOrgError) {
      console.error("Error creating organization user:", userOrgError);
      await supabase.from("organizations").delete().eq("id", organization.id);
      return NextResponse.json(
        { error: "Erreur lors de l'association de l'utilisateur" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization,
      message: "Organisation créée avec succès",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue" },
      { status: 500 }
    );
  }
}
