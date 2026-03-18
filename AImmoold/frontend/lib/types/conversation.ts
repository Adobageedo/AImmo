/**
 * Conversation Types
 * Types simplifiés pour les conversations
 */

export interface Conversation {
  id: string;
  title: string;
  organization_id: string;
  user_id: string;
  messages_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreateRequest {
  title: string;
  organization_id: string;
  initial_message?: string;
}

export interface ConversationUpdateRequest {
  title?: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}
