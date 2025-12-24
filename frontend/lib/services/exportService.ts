/**
 * Export Service
 * Gère l'export de conversations et de contenu
 */

import { ExportFormat, ExportRequest, ExportResponse } from "../types/chat";
import { useAuthStore } from "../store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ExportService {
  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Exporte une conversation au format spécifié
   */
  async exportConversation(request: ExportRequest): Promise<ExportResponse> {
    const response = await fetch(`${API_URL}/chat/export`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `Failed to export: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Télécharge le fichier exporté
   */
  async downloadExport(fileUrl: string, fileName: string): Promise<void> {
    const response = await fetch(fileUrl, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Exporte et télécharge directement
   */
  async exportAndDownload(request: ExportRequest): Promise<void> {
    const exportResponse = await this.exportConversation(request);
    await this.downloadExport(exportResponse.file_url, exportResponse.file_name);
  }

  /**
   * Génère un nom de fichier basé sur le format
   */
  generateFileName(conversationTitle: string, format: ExportFormat): string {
    const date = new Date().toISOString().split("T")[0];
    const sanitizedTitle = conversationTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const extensions: Record<ExportFormat, string> = {
      [ExportFormat.EXCEL]: "xlsx",
      [ExportFormat.PDF]: "pdf",
      [ExportFormat.MARKDOWN]: "md",
      [ExportFormat.JSON]: "json",
    };
    return `${sanitizedTitle}_${date}.${extensions[format]}`;
  }
}

export const exportService = new ExportService();
