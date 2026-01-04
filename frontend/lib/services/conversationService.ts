/**
 * Conversation Service
 * Gère les conversations (CRUD)
 */

import {
  Conversation,
  ConversationCreateRequest,
  ConversationUpdateRequest,
  ConversationListResponse,
} from "../types/conversation";
import { useAuthStore } from "../store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ConversationService {
  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Liste toutes les conversations de l'organisation
   */
  async listConversations(organizationId: string): Promise<ConversationListResponse> {
    const response = await fetch(
      `${API_URL}/conversations?organization_id=${organizationId}`,
      {
        headers: this.getAuthHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupère une conversation par ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Crée une nouvelle conversation
   */
  async createConversation(data: ConversationCreateRequest): Promise<Conversation> {
    const response = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `Failed to create conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Met à jour une conversation
   */
  async updateConversation(
    conversationId: string,
    data: ConversationUpdateRequest
  ): Promise<Conversation> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to update conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }
}

export const conversationService = new ConversationService();
