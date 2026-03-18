import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Récupérer les relations d'un bail ou d'une entité
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId } = await params;
    const { searchParams } = new URL(request.url);
    
    const leaseId = searchParams.get('lease_id');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    let query = supabase
      .from('lease_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (leaseId) {
      query = query.eq('lease_id', leaseId);
    }

    if (entityType && entityId) {
      query = query.eq('entity_type', entityType).eq('entity_id', entityId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle relation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId } = await params;
    const body = await request.json();

    // Validation
    if (!body.lease_id || !body.entity_type || !body.entity_id) {
      return NextResponse.json(
        { success: false, error: 'lease_id, entity_type et entity_id sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'entité existe
    const entityExists = await verifyEntityExists(supabase, body.entity_type, body.entity_id);
    if (!entityExists) {
      return NextResponse.json(
        { success: false, error: `L'entité ${body.entity_type} avec l'ID ${body.entity_id} n'existe pas` },
        { status: 404 }
      );
    }

    // Créer la relation
    const { data: relationship, error } = await supabase
      .from('lease_relationships')
      .insert({
        organization_id: organizationId,
        lease_id: body.lease_id,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        metadata: body.metadata || {},
        status: 'active'
      })
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

// Helper function to verify entity exists
async function verifyEntityExists(
  supabase: any,
  entityType: string,
  entityId: string
): Promise<boolean> {
  let tableName: string;
  
  switch (entityType) {
    case 'owner':
      tableName = 'owners';
      break;
    case 'tenant':
      tableName = 'tenants';
      break;
    case 'property':
      tableName = 'properties';
      break;
    default:
      return false;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', entityId)
    .single();

  return !error && !!data;
}
