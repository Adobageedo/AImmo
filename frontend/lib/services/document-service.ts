import { 
  Document, 
  DocumentUploadRequest, 
  DocumentUpdateRequest,
  OrganizationQuota,
  DocumentType 
} from "@/lib/types/document"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class DocumentService {
  private getAuthHeader(): HeadersInit {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw new Error("Not authenticated")
    }
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async getQuota(organizationId: string): Promise<OrganizationQuota> {
    const response = await fetch(
      `${API_URL}/documents/quota?organization_id=${organizationId}`,
      {
        headers: this.getAuthHeader(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch quota")
    }

    return response.json()
  }

  async uploadDocument(request: DocumentUploadRequest): Promise<Document> {
    const formData = new FormData()
    formData.append("file", request.file)
    formData.append("organization_id", request.organization_id)
    formData.append("title", request.title)
    formData.append("document_type", request.document_type || DocumentType.AUTRE)
    formData.append("folder_path", request.folder_path || "/")
    
    if (request.description) {
      formData.append("description", request.description)
    }
    if (request.property_id) {
      formData.append("property_id", request.property_id)
    }
    if (request.lease_id) {
      formData.append("lease_id", request.lease_id)
    }
    if (request.tags && request.tags.length > 0) {
      formData.append("tags", request.tags.join(","))
    }

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to upload document")
    }

    const result = await response.json()
    return result.document
  }

  async listDocuments(
    organizationId: string,
    filters?: {
      folder_path?: string
      document_type?: DocumentType
      property_id?: string
      lease_id?: string
    }
  ): Promise<Document[]> {
    const params = new URLSearchParams({
      organization_id: organizationId,
    })

    if (filters?.folder_path !== undefined) {
      params.append("folder_path", filters.folder_path)
    }
    if (filters?.document_type) {
      params.append("document_type", filters.document_type)
    }
    if (filters?.property_id) {
      params.append("property_id", filters.property_id)
    }
    if (filters?.lease_id) {
      params.append("lease_id", filters.lease_id)
    }

    const response = await fetch(`${API_URL}/documents?${params.toString()}`, {
      headers: this.getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch documents")
    }

    return response.json()
  }

  async getDocument(documentId: string, organizationId: string): Promise<Document> {
    const response = await fetch(
      `${API_URL}/documents/${documentId}?organization_id=${organizationId}`,
      {
        headers: this.getAuthHeader(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch document")
    }

    return response.json()
  }

  async updateDocument(
    documentId: string,
    organizationId: string,
    update: DocumentUpdateRequest
  ): Promise<Document> {
    const response = await fetch(
      `${API_URL}/documents/${documentId}?organization_id=${organizationId}`,
      {
        method: "PUT",
        headers: {
          ...this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update document")
    }

    return response.json()
  }

  async deleteDocument(documentId: string, organizationId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/documents/${documentId}?organization_id=${organizationId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeader(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to delete document")
    }
  }

  async getDownloadUrl(
    documentId: string,
    organizationId: string
  ): Promise<{ document_id: string; filename: string; download_url: string }> {
    const response = await fetch(
      `${API_URL}/documents/${documentId}/download-url?organization_id=${organizationId}`,
      {
        headers: this.getAuthHeader(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to get download URL")
    }

    return response.json()
  }
}

export const documentService = new DocumentService()
