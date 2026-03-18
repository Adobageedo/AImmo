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

    const { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Owner not found' },
        { status: 404 }
      )
    }

    // Si includeRelationships, utiliser le relationshipService
    if (includeRelationships) {
      try {
        const relationshipService = new RelationshipService()
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          [id],
          'owner'
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
            ...owner,
            relationships
          }
        })
      } catch (relError) {
        // Fallback: retourner owner sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: owner
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch owner' 
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

    const { data: owner, error } = await supabase
      .from('owners')
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
      data: owner
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update owner' 
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
      .from('owners')
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
        error: error instanceof Error ? error.message : 'Failed to delete owner' 
      },
      { status: 500 }
    )
  }
}
