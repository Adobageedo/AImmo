import type { ApiResponse, ApiError } from "@/types/common";

class ApiClient {
  private baseURL: string;

  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        code: "UNKNOWN_ERROR",
        message: "Une erreur est survenue",
      }));
      
      return {
        success: false,
        error: error.message,
      };
    }

    const responseData = await response.json();
    
    // If the API already returns { success, data } structure, extract it
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return responseData as ApiResponse<T>;
    }
    
    // Otherwise, wrap the data
    return {
      success: true,
      data: responseData,
    };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return this.handleResponse<T>(response);
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, JSON.stringify(value));
      });
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
