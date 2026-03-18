/**
 * Message Types
 */

import { SourceType } from "./document";

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export interface Citation {
  id: string;
  chunk_id: string;
  document_id: string;
  document_title: string;
  content_preview: string;
  page_number?: number;
  source_type: SourceType;
  relevance_score: number;
  url?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MessageCreateRequest {
  conversation_id: string;
  content: string;
  role?: MessageRole;
}
