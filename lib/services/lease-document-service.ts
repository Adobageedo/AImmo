import type { 
  LeaseDocumentUploadRequest, 
  LeaseDocumentUploadResponse,
  LeaseDocumentExtraction,
  ValidateAndCreateLeaseRequest,
  ValidateAndCreateLeaseResponse
} from '@/types/lease-document';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class LeaseDocumentService {
  /**
   * Upload a lease document and trigger extraction
   */
  static async uploadLeaseDocument(
    file: File,
    organizationId: string
  ): Promise<LeaseDocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organization_id', organizationId);

    const response = await fetch(`${API_BASE_URL}/api/lease-documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // No Content-Type header for FormData - browser sets it with boundary
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }

    return response.json();
  }

  /**
   * Get extraction status and results
   */
  static async getExtraction(extractionId: string): Promise<LeaseDocumentExtraction> {
    const response = await fetch(`${API_BASE_URL}/api/lease-documents/extractions/${extractionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch extraction');
    }

    return response.json();
  }

  /**
   * Validate extracted data and create/link entities
   */
  static async validateAndCreateLease(
    request: ValidateAndCreateLeaseRequest
  ): Promise<ValidateAndCreateLeaseResponse> {
    const response = await fetch(`${API_BASE_URL}/api/lease-documents/validate-and-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create lease');
    }

    return response.json();
  }

  /**
   * Poll extraction status until completed or failed
   */
  static async pollExtractionStatus(
    extractionId: string,
    onProgress?: (extraction: LeaseDocumentExtraction) => void,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<LeaseDocumentExtraction> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const extraction = await this.getExtraction(extractionId);
          
          if (onProgress) {
            onProgress(extraction);
          }

          if (extraction.status === 'completed') {
            resolve(extraction);
            return;
          }

          if (extraction.status === 'failed') {
            reject(new Error(extraction.error_message || 'Extraction failed'));
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Extraction timeout'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}
