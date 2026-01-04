/**
 * Supabase Direct Chat Service
 * Fetches conversations directly from Supabase for optimal performance
 */

import { createClient } from '@/lib/supabase/client'
import { Message, Conversation, MessageRole, Citation } from '@/lib/types/chat'
import { SourceType } from '@/lib/types/document'

export class SupabaseChatService {
    private supabase = createClient()

    /**
     * Get conversation metadata only (very fast)
     */
    async getConversationMetadata(conversationId: string): Promise<Conversation> {
        const { data, error } = await this.supabase
            .from('conversations')
            .select(`
                id,
                title,
                user_id,
                organization_id,
                created_at,
                updated_at
            `)
            .eq('id', conversationId)
            .single()

        if (error) {
            throw new Error(`Failed to get conversation metadata: ${error.message}`)
        }

        return {
            id: data.id,
            title: data.title,
            organization_id: data.organization_id,
            user_id: data.user_id,
            messages_count: 0, // Will be updated separately if needed
            created_at: data.created_at,
            updated_at: data.updated_at
        }
    }

    /**
     * Get messages for a conversation with pagination
     */
    async getConversationMessages(
        conversationId: string, 
        page: number = 1, 
        pageSize: number = 50
    ): Promise<{ messages: Message[], total: number, has_more: boolean }> {
        const offset = (page - 1) * pageSize

        // Get messages with pagination
        const { data, error, count } = await this.supabase
            .from('messages')
            .select(`
                id,
                conversation_id,
                role,
                content,
                metadata,
                created_at,
                updated_at
            `, { count: 'exact' })
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .range(offset, offset + pageSize - 1)

        if (error) {
            throw new Error(`Failed to get messages: ${error.message}`)
        }

        // Transform to Message format
        const messages: Message[] = (data || []).map(msg => ({
            id: msg.id,
            conversation_id: msg.conversation_id,
            role: msg.role as MessageRole,
            content: msg.content,
            citations: [], // Citations will be loaded separately if needed
            metadata: msg.metadata,
            created_at: msg.created_at
        }))

        const total = count || 0
        const has_more = offset + pageSize < total

        return {
            messages,
            total,
            has_more
        }
    }

    /**
     * Get conversation with messages (optimized version)
     */
    async getConversationWithMessages(
        conversationId: string, 
        messageLimit: number = 50
    ): Promise<{ conversation: Conversation, messages: Message[] }> {
        // Get conversation metadata
        const conversation = await this.getConversationMetadata(conversationId)

        // Get recent messages
        const { messages } = await this.getConversationMessages(conversationId, 1, messageLimit)

        return {
            conversation,
            messages
        }
    }

    /**
     * Get all conversations for a user (fast)
     */
    async getUserConversations(userId: string, organizationId: string): Promise<Conversation[]> {
        const { data, error } = await this.supabase
            .from('conversations')
            .select(`
                id,
                title,
                user_id,
                organization_id,
                created_at,
                updated_at
            `)
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .order('updated_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to get conversations: ${error.message}`)
        }

        return (data || []).map(conv => ({
            id: conv.id,
            title: conv.title,
            organization_id: conv.organization_id,
            user_id: conv.user_id,
            messages_count: 0, // Can be optimized later with a join
            created_at: conv.created_at,
            updated_at: conv.updated_at
        }))
    }

    /**
     * Create a new conversation
     */
    async createConversation(
        title: string,
        userId: string,
        organizationId: string,
        initialMessage?: string
    ): Promise<Conversation> {
        // Create conversation
        const { data: convData, error: convError } = await this.supabase
            .from('conversations')
            .insert({
                title,
                user_id: userId,
                organization_id: organizationId
            })
            .select()
            .single()

        if (convError) {
            throw new Error(`Failed to create conversation: ${convError.message}`)
        }

        // Add initial message if provided
        if (initialMessage) {
            const { error: msgError } = await this.supabase
                .from('messages')
                .insert({
                    conversation_id: convData.id,
                    role: 'user',
                    content: initialMessage
                })

            if (msgError) {
                // Don't throw here, conversation is still created
            }
        }

        return {
            id: convData.id,
            title: convData.title,
            organization_id: convData.organization_id,
            user_id: convData.user_id,
            messages_count: initialMessage ? 1 : 0,
            created_at: convData.created_at,
            updated_at: convData.updated_at
        }
    }

    /**
     * Add a message to a conversation
     */
    async addMessage(
        conversationId: string,
        role: MessageRole,
        content: string,
        metadata?: any
    ): Promise<Message> {
        const { data, error } = await this.supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                role,
                content,
                metadata: metadata || {}
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to add message: ${error.message}`)
        }

        return {
            id: data.id,
            conversation_id: data.conversation_id,
            role: data.role as MessageRole,
            content: data.content,
            citations: [], // Will be populated by backend if needed
            metadata: data.metadata,
            created_at: data.created_at
        }
    }
}

// Singleton instance
export const supabaseChatService = new SupabaseChatService()
