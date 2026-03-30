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

    const { data: lease, error } = await supabase
      .from('leases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (!lease) {
      return NextResponse.json(
        { success: false, error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Fetch linked document
    const { data: document } = await supabase
      .from('lease_documents')
      .select('id, file_name, file_type, storage_path, raw_text_path, extraction_status, uploaded_at, lease_id')
      .eq('lease_id', id)
      .single()

    // Si includeRelationships, utiliser le relationshipService
    if (includeRelationships) {
      try {
        const relationshipService = new RelationshipService()
        const relationshipsMap = await relationshipService.getRelationshipsForEntities(
          [id],
          'lease'
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
            ...lease,
            relationships,
            document: document || null
          }
        })
      } catch (relError) {
        // Fallback: retourner lease sans relationships
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...lease,
        document: document || null
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch lease' 
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

    const { data: lease, error } = await supabase
      .from('leases')
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
      data: lease
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update lease' 
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
      .from('leases')
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
        error: error instanceof Error ? error.message : 'Failed to delete lease' 
      },
      { status: 500 }
    )
  }
}
