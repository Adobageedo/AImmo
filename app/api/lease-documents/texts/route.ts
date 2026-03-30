import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fileStorageService } from '@/lib/services/file-storage.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/lease-documents/texts
 * 
 * Fetch all raw lease texts for the authenticated user's organization
 * Authentication required via Authorization: Bearer {token}
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get organization_id from user session metadata or fetch from organization_users table
    let organizationId = user.user_metadata?.organization_id;
    
    if (!organizationId) {
      // Fallback: get from organization_users table (your app's structure)
      const { data: orgUserData, error: orgUserError } = await supabaseAuth
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id);

      if (orgUserError || !orgUserData || orgUserData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User organization not found' },
          { status: 404 }
        );
      }
      
      // Use the first organization found
      organizationId = orgUserData[0].organization_id;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all lease documents for this organization
    const { data: documents, error } = await supabase
      .from('lease_documents')
      .select('id, lease_id, file_name, raw_text_path, extraction_status, organization_id')
      .eq('organization_id', organizationId)
      .not('raw_text_path', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        total_characters: 0,
        texts: [],
        message: "Aucun document de bail avec texte brut trouvé pour cette organisation",
      });
    }

    // Fetch raw text from Storage for each document
    const results = [];
    
    for (const doc of documents) {
      if (!doc.raw_text_path) continue;

      try {
        const rawText = await fileStorageService.getRawText(doc.raw_text_path);
        
        results.push({
          lease_id: doc.lease_id || 'N/A',
          document_id: doc.id,
          file_name: doc.file_name,
          raw_text: rawText,
          text_length: rawText.length,
          extraction_status: doc.extraction_status,
        });
      } catch (err) {
        console.error(`Failed to fetch text for document ${doc.id}:`, err);
        // Continue with other documents
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      total_characters: results.reduce((sum, r) => sum + r.text_length, 0),
      texts: results,
    });

  } catch (error) {
    console.error('❌ Fetch lease texts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lease texts',
        count: 0,
        texts: [],
      },
      { status: 500 }
    );
  }
}
