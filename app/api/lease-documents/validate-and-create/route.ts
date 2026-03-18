import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { extraction_id, validated_data } = await request.json();
    
    if (!extraction_id || !validated_data) {
      return NextResponse.json(
        { success: false, message: 'extraction_id and validated_data are required' },
        { status: 400 }
      );
    }

    // Get organization_id from the extraction
    const { data: extraction, error: extractionError } = await supabase
      .from('lease_document_extractions')
      .select('organization_id')
      .eq('id', extraction_id)
      .single();

    if (extractionError || !extraction) {
      return NextResponse.json(
        { success: false, message: 'Extraction not found' },
        { status: 404 }
      );
    }

    const organization_id = extraction.organization_id;

    const { 
      lease_data, 
      property_action, 
      property_id, 
      owner_action, 
      owner_id, 
      tenant_action, 
      tenant_id
    } = validated_data;

    let createdPropertyId = property_id;
    let createdOwnerId = owner_id;
    let createdTenantId = tenant_id;
    let propertyCreated = false;
    let ownerCreated = false;
    let tenantCreated = false;

    // Create or link property
    if (property_action === 'create') {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .insert({
          name: lease_data.property_address || 'Propriété',
          address: lease_data.property_address || '',
          city: lease_data.property_city || '',
          postal_code: lease_data.property_postal_code || '',
          country: 'France',
          type: lease_data.property_type || 'residential',
          surface: lease_data.property_surface || 0,
          estimated_value: 0,
          organization_id: organization_id
        })
        .select()
        .single();

      if (propError) throw new Error(`Property creation failed: ${propError.message}`);
      createdPropertyId = propData.id;
      propertyCreated = true;
    }

    // Create or link owner
    if (owner_action === 'create') {
      const nameParts = (lease_data.landlord_name || '').split(' ');
      const { data: ownerData, error: ownerError } = await supabase
        .from('owners')
        .insert({
          first_name: nameParts[0] || 'Propriétaire',
          last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Inconnu',
          email: lease_data.landlord_email || 'noemail@example.com',
          phone: lease_data.landlord_phone || '',
          address: lease_data.landlord_address || '',
          city: '',
          postal_code: '',
          country: 'France',
          organization_id: organization_id
        })
        .select()
        .single();

      if (ownerError) throw new Error(`Owner creation failed: ${ownerError.message}`);
      createdOwnerId = ownerData.id;
      ownerCreated = true;
    }

    // Create or link tenant
    if (tenant_action === 'create') {
      const nameParts = (lease_data.tenant_name || '').split(' ');
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          first_name: nameParts[0] || 'Locataire',
          last_name: nameParts.slice(1).join(' ') || nameParts[0] || 'Inconnu',
          company_name: lease_data.tenant_company_name,
          email: lease_data.tenant_email || 'noemail@example.com',
          phone: lease_data.tenant_phone || '',
          address: lease_data.tenant_address || '',
          city: '',
          postal_code: '',
          country: 'France',
          type: lease_data.tenant_company_name ? 'company' : 'individual',
          organization_id: organization_id
        })
        .select()
        .single();

      if (tenantError) throw new Error(`Tenant creation failed: ${tenantError.message}`);
      createdTenantId = tenantData.id;
      tenantCreated = true;
    }

    // Create lease
    const { data: leaseData, error: leaseError } = await supabase
      .from('leases')
      .insert({
        property_id: createdPropertyId,
        owner_ids: [createdOwnerId],
        tenant_ids: [createdTenantId],
        lease_type: lease_data.lease_type || 'residential',
        start_date: lease_data.start_date,
        end_date: lease_data.end_date,
        duration_months: lease_data.duration_months,
        monthly_rent: lease_data.monthly_rent,
        charges: lease_data.charges,
        deposit: lease_data.deposit,
        payment_day: lease_data.payment_day || 1,
        status: 'draft',
        organization_id: organization_id
      })
      .select()
      .single();

    if (leaseError) throw new Error(`Lease creation failed: ${leaseError.message}`);

    return NextResponse.json({
      success: true,
      lease_id: leaseData.id,
      property_id: createdPropertyId,
      owner_id: createdOwnerId,
      tenant_id: createdTenantId,
      created_entities: {
        property_created: propertyCreated,
        owner_created: ownerCreated,
        tenant_created: tenantCreated
      }
    });

  } catch (error) {
    console.error('❌ Validate and create error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create lease'
      },
      { status: 500 }
    );
  }
}
