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

    console.log('🏠 Creating property for organization:', organizationId);

    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        organization_id: organizationId,
        name: body.name || body.address,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country || 'France',
        type: body.type || 'residential',
        surface: body.surface,
        rooms: body.rooms,
        bathrooms: body.bathrooms,
        estimated_value: body.estimated_value || 0,
        purchase_price: body.purchase_price,
        purchase_date: body.purchase_date,
        status: body.status || 'available',
        description: body.description,
        features: body.features || []
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating property:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Property created successfully:', property.id);

    return NextResponse.json({
      success: true,
      data: property
    });

  } catch (error) {
    console.error('❌ Property creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create property' 
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

    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching properties:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Si includeRelationships, utiliser le relationshipService
    if (includeRelationships && properties && properties.length > 0) {
      try {
        const propertyIds = properties.map(p => p.id);
        
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          propertyIds,
          'property'
        );

        // Ajouter les relationships à chaque property
        const propertiesWithRelationships = properties.map(property => {
          const relationships = relationshipsMap.get(property.id)?.relationships || {
            leases: [],
            properties: [],
            owners: [],
            tenants: []
          };

          return {
            ...property,
            relationships
          };
        });

        return NextResponse.json({
          success: true,
          data: propertiesWithRelationships
        });
      } catch (relError) {
        // Fallback: retourner properties sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: properties
    });

  } catch (error) {
    console.error('❌ Properties fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch properties' 
      },
      { status: 500 }
    );
  }
}
