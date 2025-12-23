import {
  DocumentProcessing,
  ProcessingRequest,
  ValidationRequest,
  EntityCreationResult,
  OCRProvider,
} from "@/lib/types/processing"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class ProcessingService {
  private getAuthHeader(): HeadersInit {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw new Error("Not authenticated")
    }
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async processDocument(request: ProcessingRequest): Promise<DocumentProcessing> {
    const response = await fetch(`${API_URL}/processing/process`, {
      method: "POST",
      headers: {
        ...this.getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to process document")
    }

    return response.json()
  }

  async getProcessing(processingId: string): Promise<DocumentProcessing> {
    const response = await fetch(`${API_URL}/processing/${processingId}`, {
      headers: this.getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch processing")
    }

    return response.json()
  }

  async getProcessingByDocument(documentId: string): Promise<DocumentProcessing> {
    const response = await fetch(`${API_URL}/processing/document/${documentId}`, {
      headers: this.getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch processing")
    }

    return response.json()
  }

  async validateAndCreate(request: ValidationRequest): Promise<EntityCreationResult> {
    const response = await fetch(`${API_URL}/processing/validate`, {
      method: "POST",
      headers: {
        ...this.getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to validate")
    }

    return response.json()
  }
}

export const processingService = new ProcessingService()
