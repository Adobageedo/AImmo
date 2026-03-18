import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Récupérer toutes les relations d'un bail avec les données complètes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; leaseId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId, leaseId } = await params;

    // Récupérer toutes les relations actives du bail
    const { data: relationships, error: relError } = await supabase
      .from('lease_relationships')
      .select('*')
      .eq('lease_id', leaseId)
      .eq('status', 'active');

    if (relError) {
      return NextResponse.json(
        { success: false, error: 'Error fetching relationships', details: relError.message },
        { status: 500 }
      );
    }

    // Séparer les relations par type
    const ownerRels = relationships?.filter(r => r.entity_type === 'owner') || [];
    const tenantRels = relationships?.filter(r => r.entity_type === 'tenant') || [];
    const propertyRel = relationships?.find(r => r.entity_type === 'property');

    // Récupérer les détails des owners
    const ownerIds = ownerRels.map(r => r.entity_id);
    const { data: ownersData } = ownerIds.length > 0 
      ? await supabase.from('owners').select('*').in('id', ownerIds)
      : { data: [] };

    // Récupérer les détails des tenants
    const tenantIds = tenantRels.map(r => r.entity_id);
    const { data: tenantsData } = tenantIds.length > 0
      ? await supabase.from('tenants').select('*').in('id', tenantIds)
      : { data: [] };

    // Récupérer les détails de la property
    const { data: propertyData } = propertyRel
      ? await supabase.from('properties').select('*').eq('id', propertyRel.entity_id).single()
      : { data: null };

    // Combiner les données avec les métadonnées
    const ownersWithMetadata = ownersData?.map(owner => {
      const rel = ownerRels.find(r => r.entity_id === owner.id);
      return {
        ...owner,
        percentage: rel?.metadata?.percentage,
        is_main_owner: rel?.metadata?.is_main_owner
      };
    }) || [];

    const tenantsWithMetadata = tenantsData?.map(tenant => {
      const rel = tenantRels.find(r => r.entity_id === tenant.id);
      return {
        ...tenant,
        is_main_tenant: rel?.metadata?.is_main_tenant
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        lease_id: leaseId,
        owners: ownersWithMetadata,
        tenants: tenantsWithMetadata,
        property: propertyData
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
