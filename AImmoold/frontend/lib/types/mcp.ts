/**
 * MCP (Model Context Protocol) Types
 * Types pour l'intégration avec les serveurs MCP
 */

import { SourceType } from "./document";

// Options RAG pour MCP
export interface MCPRagOptions {
  enabled: boolean;
  sources: SourceType[];
  document_ids?: string[];
  lease_ids?: string[];
  property_ids?: string[];
  strict_mode: boolean;
  max_results?: number;
}

// Payload envoyé au serveur MCP
export interface MCPChatPayload {
  message: string;
  conversation_id: string;
  rag_options: MCPRagOptions;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// Réponse du serveur MCP
export interface MCPChatResponse {
  message_id: string;
  content: string;
  citations?: Array<{
    chunk_id: string;
    document_id: string;
    content: string;
    score: number;
  }>;
  metadata?: Record<string, unknown>;
}

// Événement de streaming MCP
export interface MCPStreamEvent {
  type: "token" | "citation" | "done" | "error";
  data?: string;
  citation?: {
    chunk_id: string;
    document_id: string;
    title: string;
    content: string;
    score: number;
  };
  error?: string;
}

// Configuration du serveur MCP
export interface MCPServerConfig {
  name: string;
  url: string;
  api_key?: string;
  capabilities: string[];
}
