import { apiClient } from "./api-client";
import type { Document, UpdateDocumentRequest, DocumentSearchParams } from "@/types/document";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const documentService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams & DocumentSearchParams
  ): Promise<ApiResponse<PaginatedResponse<Document>>> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.query) queryParams.query = params.query;
    if (params?.type) queryParams.type = params.type;
    if (params?.folder_path) queryParams.folder_path = params.folder_path;

    return apiClient.get<PaginatedResponse<Document>>(
      `/organizations/${organizationId}/documents`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getById(id: string): Promise<ApiResponse<Document>> {
    return apiClient.get<Document>(`/documents/${id}`);
  },

  async upload(
    organizationId: string,
    file: File,
    metadata: Omit<UpdateDocumentRequest, "name">
  ): Promise<ApiResponse<Document>> {
    return apiClient.upload<Document>(
      `/organizations/${organizationId}/documents/upload`,
      file,
      metadata
    );
  },

  async update(id: string, data: UpdateDocumentRequest): Promise<ApiResponse<Document>> {
    return apiClient.put<Document>(`/documents/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/documents/${id}`);
  },

  async downloadUrl(id: string): Promise<string> {
    return `/api/documents/${id}/download`;
  },
};
