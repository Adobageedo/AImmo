import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { relationshipService } from '@/lib/services/relationship.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId } = await params;
    const body = await request.json();

    console.log('📝 Creating lease for organization:', organizationId);
    console.log('📋 Lease data:', body);

    // Note: property_id, owner_ids, tenant_ids sont maintenant optionnels
    // Les relations sont gérées via la table lease_relationships

    // Create lease
    const { data: lease, error } = await supabase
      .from('leases')
      .insert({
        organization_id: organizationId,
        property_id: body.property_id,
        owner_ids: body.owner_ids,
        tenant_ids: body.tenant_ids,
        lease_type: body.lease_type,
        start_date: body.start_date,
        end_date: body.end_date,
        duration_months: body.duration_months,
        monthly_rent: body.monthly_rent,
        charges: body.charges || 0,
        deposit: body.deposit || 0,
        payment_day: body.payment_day || 1,
        payment_frequency: body.payment_frequency || 'monthly',
        indexation_clause: body.indexation_clause || false,
        indexation_rate: body.indexation_rate,
        indexation_index: body.indexation_index,
        indexation_date: body.indexation_date,
        status: body.status || 'draft',
        termination_notice_period: body.termination_notice_period,
        renewal_automatic: body.renewal_automatic || false,
        renewal_conditions: body.renewal_conditions,
        special_clauses: body.special_clauses || [],
        document_id: body.document_id,
        notes: body.notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating lease:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Lease created successfully:', lease.id);

    return NextResponse.json({
      success: true,
      data: lease
    });

  } catch (error) {
    console.error('❌ Lease creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create lease' 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: organizationId } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const includeRelationships = searchParams.get('include_relationships') === 'true';

    
    const { data: leases, error, count } = await supabase
      .from('leases')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch documents for all leases
    let documentsMap = new Map<string, any>();
    if (leases && leases.length > 0) {
      const leaseIds = leases.map(l => l.id);
      const { data: documents } = await supabase
        .from('lease_documents')
        .select('id, file_name, file_type, storage_path, raw_text_path, extraction_status, uploaded_at, lease_id')
        .in('lease_id', leaseIds);
      
      if (documents) {
        documents.forEach(doc => {
          if (doc.lease_id) {
            documentsMap.set(doc.lease_id, doc);
          }
        });
      }
    }

    // Si includeRelationships, utiliser le relationshipService (logique directe pour leases)
    let leasesWithRelationships = leases;
    if (includeRelationships && leases && leases.length > 0) {
      try {
        const leaseIds = leases.map(l => l.id);
        
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          leaseIds,
          'lease'
        );

        // Ajouter les relationships et documents à chaque lease
        leasesWithRelationships = leases.map(lease => {
          const relationships = relationshipsMap.get(lease.id)?.relationships || {
            leases: [],
            properties: [],
            owners: [],
            tenants: []
          };
          
          const document = documentsMap.get(lease.id) || null;
          
          return {
            ...lease,
            relationships,
            document
          };
        });

      } catch (relError) {
        // Fallback: retourner leases avec documents seulement
        leasesWithRelationships = leases.map(lease => ({
          ...lease,
          document: documentsMap.get(lease.id) || null
        }));
      }
    } else {
      // Pas de relationships mais ajouter les documents
      leasesWithRelationships = leases.map(lease => ({
        ...lease,
        document: documentsMap.get(lease.id) || null
      }));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        data: leasesWithRelationships,
        total: count || 0,
        page,
        limit,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch leases' 
      },
      { status: 500 }
    );
  }
}
