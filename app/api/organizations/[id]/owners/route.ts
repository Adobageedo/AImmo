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

    console.log('👤 Creating owner for organization:', organizationId);

    // Parse full name into first and last name if needed
    let firstName = body.first_name;
    let lastName = body.last_name;
    
    if (!firstName && !lastName && body.name) {
      const nameParts = body.name.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || nameParts[0];
    }

    const { data: owner, error } = await supabase
      .from('owners')
      .insert({
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
        place_of_birth: body.place_of_birth,
        nationality: body.nationality,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country || 'France',
        iban: body.iban,
        bic: body.bic,
        bank_name: body.bank_name,
        preferred_contact_method: body.preferred_contact_method,
        preferred_language: body.preferred_language || 'fr',
        notes: body.notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating owner:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Owner created successfully:', owner.id);

    return NextResponse.json({
      success: true,
      data: owner
    });

  } catch (error) {
    console.error('❌ Owner creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create owner' 
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

    const { data: owners, error } = await supabase
      .from('owners')
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
    if (includeRelationships && owners && owners.length > 0) {
      try {
        const ownerIds = owners.map(o => o.id);
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          ownerIds,
          'owner'
        );

        // Ajouter les relationships à chaque owner
        const ownersWithRelationships = owners.map(owner => ({
          ...owner,
          relationships: relationshipsMap.get(owner.id)?.relationships || {
            leases: [],
            properties: [],
            owners: [],
            tenants: []
          }
        }));

        return NextResponse.json({
          success: true,
          data: ownersWithRelationships
        });
      } catch (relError) {
        // Fallback: retourner owners sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: owners
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch owners' 
      },
      { status: 500 }
    );
  }
}
