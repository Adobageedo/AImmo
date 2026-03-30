import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET_NAME = 'documents';

// Signed URL expiration: 1 hour
const SIGNED_URL_EXPIRY = 3600;

export interface UploadResult {
  storagePath: string;
  publicUrl: string | null;
}

/**
 * Centralized file storage service using Supabase Storage.
 *
 * Bucket structure:
 *   documents/
 *     {org_id}/
 *       lease-originals/{document_id}/{filename}
 *       lease-texts/{document_id}/raw.txt
 */
export class FileStorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // ─────────────────────────────────────────────
  // BUCKET INIT (call once on first deploy)
  // ─────────────────────────────────────────────

  async ensureBucketExists(): Promise<void> {
    const { data: buckets } = await this.supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!exists) {
      const { error } = await this.supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 20 * 1024 * 1024, // 20 MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/tiff',
          'text/plain',
        ],
      });
      if (error) {
        console.error('❌ Failed to create bucket:', error.message);
        throw error;
      }
      console.log(`✅ Bucket "${BUCKET_NAME}" created`);
    }
  }

  // ─────────────────────────────────────────────
  // UPLOAD ORIGINAL FILE
  // ─────────────────────────────────────────────

  async uploadOriginal(
    organizationId: string,
    documentId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    const storagePath = `${organizationId}/lease-originals/${documentId}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload original failed:', error.message);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log(`✅ Original file uploaded: ${storagePath}`);
    return { storagePath, publicUrl: null };
  }

  // ─────────────────────────────────────────────
  // UPLOAD RAW PARSED TEXT
  // ─────────────────────────────────────────────

  async uploadRawText(
    organizationId: string,
    documentId: string,
    text: string
  ): Promise<UploadResult> {
    const storagePath = `${organizationId}/lease-texts/${documentId}/raw.txt`;
    const buffer = Buffer.from(text, 'utf-8');

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload raw text failed:', error.message);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log(`✅ Raw text uploaded: ${storagePath} (${text.length} chars)`);
    return { storagePath, publicUrl: null };
  }

  // ─────────────────────────────────────────────
  // DOWNLOAD / SIGNED URL
  // ─────────────────────────────────────────────

  async getSignedUrl(storagePath: string, expiresIn = SIGNED_URL_EXPIRY): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  async downloadFile(storagePath: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message || 'Unknown error'}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getRawText(storagePath: string): Promise<string> {
    const buffer = await this.downloadFile(storagePath);
    return buffer.toString('utf-8');
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  async deleteDocumentFiles(organizationId: string, documentId: string): Promise<void> {
    const paths = [
      `${organizationId}/lease-originals/${documentId}`,
      `${organizationId}/lease-texts/${documentId}`,
    ];

    for (const prefix of paths) {
      const { data: files } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list(prefix);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${prefix}/${f.name}`);
        const { error } = await this.supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (error) {
          console.error(`❌ Failed to delete files in ${prefix}:`, error.message);
        } else {
          console.log(`🗑️ Deleted ${filePaths.length} files in ${prefix}`);
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // DB HELPERS — update lease_documents record
  // ─────────────────────────────────────────────

  async updateDocumentStoragePaths(
    documentId: string,
    storagePath: string,
    rawTextPath: string | null
  ): Promise<void> {
    const update: Record<string, unknown> = {
      storage_path: storagePath,
      file_url: storagePath, // keep file_url in sync for backward compat
      updated_at: new Date().toISOString(),
    };

    if (rawTextPath) {
      update.raw_text_path = rawTextPath;
    }

    const { error } = await this.supabase
      .from('lease_documents')
      .update(update)
      .eq('id', documentId);

    if (error) {
      console.error('❌ Failed to update storage paths:', error.message);
      throw error;
    }
  }

  async linkDocumentToLease(documentId: string, leaseId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lease_documents')
      .update({ lease_id: leaseId, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) {
      console.error('❌ Failed to link document to lease:', error.message);
      throw error;
    }
  }
}

// Singleton
export const fileStorageService = new FileStorageService();
