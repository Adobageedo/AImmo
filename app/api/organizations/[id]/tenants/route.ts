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

    console.log('👥 Creating tenant for organization:', organizationId);

    // Determine tenant type and parse name
    let type = body.type || 'individual';
    let firstName = body.first_name;
    let lastName = body.last_name;
    let companyName = body.company_name;

    // If company_name is provided, it's a company
    if (body.company_name) {
      type = 'company';
    } else if (!firstName && !lastName && body.name) {
      // Parse full name into first and last name
      const nameParts = body.name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || nameParts[0];
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        organization_id: organizationId,
        type: type,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
        place_of_birth: body.place_of_birth,
        nationality: body.nationality,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country || 'France',
        payment_status: body.payment_status || 'ok',
        employment: body.employment,
        references: body.references || [],
        guarantors: body.guarantors || [],
        notes: body.notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating tenant:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Tenant created successfully:', tenant.id);

    return NextResponse.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('❌ Tenant creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create tenant' 
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
    const includeRelationships = searchParams.get('include_relationships') === 'true';

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Si includeRelationships, utiliser le relationshipService
    if (includeRelationships && tenants && tenants.length > 0) {
      try {
        const tenantIds = tenants.map(t => t.id);
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          tenantIds,
          'tenant'
        );

        // Ajouter les relationships à chaque tenant
        const tenantsWithRelationships = tenants.map(tenant => ({
          ...tenant,
          relationships: relationshipsMap.get(tenant.id)?.relationships || {
            leases: [],
            properties: [],
            owners: [],
            tenants: []
          }
        }));

        return NextResponse.json({
          success: true,
          data: tenantsWithRelationships
        });
      } catch (relError) {
        // Fallback: retourner tenants sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: tenants
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tenants' 
      },
      { status: 500 }
    );
  }
}
