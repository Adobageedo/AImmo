/**
 * useChatStreaming Hook
 * Gère le streaming de messages
 */

import { useState, useCallback, useRef } from "react";
import { ChatMode, ChatRequest, StreamChunk } from "../types/chat";
import { Message, MessageRole, Citation } from "../types/message";
import { chatService } from "../services/chatService";
import { SourceType } from "../types/document";

interface UseChatStreamingOptions {
  conversationId: string;
  mode?: ChatMode;
  onError?: (error: Error) => void;
  onComplete?: (message: Message) => void;
}

export function useChatStreaming({
  conversationId,
  mode = ChatMode.NORMAL,
  onError,
  onComplete,
}: UseChatStreamingOptions) {
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamMessage = useCallback(
    async (
      content: string,
      ragSources: SourceType[],
      selectedDocuments?: string[]
    ): Promise<Message | null> => {
      if (!content.trim() || isStreaming) return null;

      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCitations([]);
      abortControllerRef.current = new AbortController();

      try {
        const request: ChatRequest = {
          conversation_id: conversationId,
          message: content,
          mode,
          source_types: ragSources,
          document_ids: selectedDocuments,
          include_citations: true,
          stream: true,
        };

        let fullContent = "";
        const citations: Citation[] = [];

        for await (const chunk of chatService.streamMessage(request)) {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Stream aborted");
          }

          switch (chunk.type) {
            case "content":
              if (chunk.content) {
                fullContent += chunk.content;
                setStreamingContent(fullContent);
              }
              break;

            case "citation":
              if (chunk.citation) {
                citations.push(chunk.citation);
                setStreamingCitations([...citations]);
              }
              break;

            case "done":
              const finalMessage: Message = {
                id: `msg-${Date.now()}`,
                conversation_id: conversationId,
                role: MessageRole.ASSISTANT,
                content: fullContent,
                citations,
                created_at: new Date().toISOString(),
              };
              onComplete?.(finalMessage);
              return finalMessage;

            case "error":
              throw new Error(chunk.error || "Stream error");
          }
        }

        return null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Streaming failed");
        onError?.(error);
        return null;
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingCitations([]);
        abortControllerRef.current = null;
      }
    },
    [conversationId, mode, isStreaming, onError, onComplete]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
    setStreamingCitations([]);
  }, []);

  return {
    streamingContent,
    streamingCitations,
    isStreaming,
    streamMessage,
    stopStreaming,
  };
}
