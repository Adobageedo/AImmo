/**
 * MCP Service
 * Service pour communiquer avec les serveurs MCP (Model Context Protocol)
 * Note: Le frontend ne gère PAS la logique RAG, il envoie seulement les options
 */

import { MCPChatPayload, MCPChatResponse, MCPStreamEvent } from "../types/mcp";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class MCPService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Envoie un message via MCP (non-streaming)
   */
  async sendMessage(payload: MCPChatPayload): Promise<MCPChatResponse> {
    const response = await fetch(`${API_URL}/api/v1/mcp/chat`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `MCP error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Stream la réponse via MCP
   */
  async *streamMessage(payload: MCPChatPayload): AsyncGenerator<MCPStreamEvent> {
    const response = await fetch(`${API_URL}/api/v1/mcp/stream`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ...payload, stream: true }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `MCP stream error: ${response.status}`);
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
              const event = JSON.parse(data) as MCPStreamEvent;
              yield event;
            } catch (e) {
              console.error("Failed to parse MCP SSE data:", data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Récupère les capabilities du serveur MCP
   */
  async getCapabilities(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/mcp/capabilities`, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to get MCP capabilities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.capabilities || [];
  }
}

export const mcpService = new MCPService();
