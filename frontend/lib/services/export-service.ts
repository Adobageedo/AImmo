import { ExportFormat } from "@/lib/types/chat"
import { useAuthStore } from "@/lib/store/auth-store"

export interface ExportOptions {
  format: ExportFormat
  conversationId?: string
  content?: string
  artifactId?: string
  includeMetadata?: boolean
  filename?: string
}

export interface ExportResult {
  url: string
  filename: string
  format: ExportFormat
  expiresAt: string
}

export class ExportService {
  private apiUrl: string

  constructor(apiUrl: string = '/api/v1/sdk/export') {
    this.apiUrl = apiUrl
  }

  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw new Error('Not authenticated')
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async exportToExcel(options: Omit<ExportOptions, 'format'>): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/conversation/excel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        conversation_id: options.conversationId,
        include_citations: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Excel export failed: ${response.statusText}`)
    }

    return await response.blob()
  }

  async exportToPDF(options: Omit<ExportOptions, 'format'>): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/conversation/pdf`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        conversation_id: options.conversationId,
        include_citations: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`PDF export failed: ${response.statusText}`)
    }

    return await response.blob()
  }

  async exportConversation(conversationId: string, format: ExportFormat): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, format }),
    })

    if (!response.ok) {
      throw new Error(`Conversation export failed: ${response.statusText}`)
    }

    return await response.blob()
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  async exportArtifact(artifactId: string, format: 'excel' | 'pdf'): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/artifact/${artifactId}/excel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Artifact export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const timestamp = new Date().toISOString().split('T')[0]
      const extension = 'xlsx'
      const filename = `artifact-${artifactId}-${timestamp}.${extension}`

      this.downloadBlob(blob, filename)
    } catch (error) {
      console.error('Export artifact error:', error)
      throw error
    }
  }
}

export const exportService = new ExportService()
