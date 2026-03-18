import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PATCH - Mettre à jour les métadonnées d'une relation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId, relationshipId } = await params;
    const body = await request.json();

    const { data: relationship, error } = await supabase
      .from('lease_relationships')
      .update({
        metadata: body.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', relationshipId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: relationship });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Terminer une relation (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId, relationshipId } = await params;

    const { error } = await supabase
      .from('lease_relationships')
      .update({
        status: 'terminated',
        terminated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', relationshipId)
      .eq('organization_id', organizationId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
