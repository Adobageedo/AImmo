import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Créer plusieurs relations en une seule transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId } = await params;
    const body = await request.json();

    if (!body.relationships || !Array.isArray(body.relationships)) {
      return NextResponse.json(
        { success: false, error: 'relationships array is required' },
        { status: 400 }
      );
    }

    // Préparer toutes les relations
    const relationshipsToInsert = body.relationships.map((rel: any) => ({
      organization_id: organizationId,
      lease_id: rel.lease_id,
      entity_type: rel.entity_type,
      entity_id: rel.entity_id,
      metadata: rel.metadata || {},
      status: 'active'
    }));

    // Insérer toutes les relations en une seule transaction
    const { data: relationships, error } = await supabase
      .from('lease_relationships')
      .insert(relationshipsToInsert)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: relationships,
      count: relationships.length 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
