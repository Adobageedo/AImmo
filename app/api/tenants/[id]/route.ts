import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { RelationshipService } from "@/lib/services/relationship.service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeRelationships = searchParams.get('include_relationships') !== 'false'

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Si includeRelationships, utiliser le relationshipService
    if (includeRelationships) {
      try {
        const relationshipService = new RelationshipService()
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          [id],
          'tenant'
        )

        const relationships = relationshipsMap.get(id)?.relationships || {
          leases: [],
          properties: [],
          owners: [],
          tenants: []
        }

        return NextResponse.json({
          success: true,
          data: {
            ...tenant,
            relationships
          }
        })
      } catch (relError) {
        // Fallback: retourner tenant sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: tenant
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tenant' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = await params
    const body = await request.json()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update tenant' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = await params

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete tenant' 
      },
      { status: 500 }
    )
  }
}
