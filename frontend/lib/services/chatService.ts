/**
 * Chat Service
 * Gère la communication avec l'API de chat
 */

import { ChatRequest, ChatResponse, StreamChunk } from "../types/chat";
import { Message } from "../types/message";
import { useAuthStore } from "../store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ChatService {
  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Envoie un message et reçoit une réponse (non-streaming)
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Envoie un message et stream la réponse
   */
  async *streamMessage(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ...request, stream: true }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              yield chunk;
            } catch (e) {
              console.error("Failed to parse SSE data:", data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Récupère l'historique des messages d'une conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        headers: this.getAuthHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  }
}

export const chatService = new ChatService();
