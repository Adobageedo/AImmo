import { NextRequest, NextResponse } from 'next/server';
import { fileStorageService } from '@/lib/services/file-storage.service';

/**
 * GET /api/files/download?path={storagePath}&mode=url|raw
 *
 * mode=url  → returns JSON with a signed URL (default)
 * mode=raw  → streams the file content directly
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');
    const mode = searchParams.get('mode') || 'url';

    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: 'Missing "path" query parameter' },
        { status: 400 }
      );
    }

    // Basic path traversal protection
    if (storagePath.includes('..')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    if (mode === 'raw') {
      // Stream the file directly
      const buffer = await fileStorageService.downloadFile(storagePath);
      const isText = storagePath.endsWith('.txt');

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': isText ? 'text/plain; charset=utf-8' : 'application/octet-stream',
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': `inline; filename="${storagePath.split('/').pop()}"`,
        },
      });
    }

    // Default: return a signed URL
    const signedUrl = await fileStorageService.getSignedUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrl,
        expires_in: 3600,
        path: storagePath,
      },
    });
  } catch (error) {
    console.error('❌ File download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file',
      },
      { status: 500 }
    );
  }
}
