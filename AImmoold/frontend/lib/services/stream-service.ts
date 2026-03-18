"use client"

import { StreamChunk, Citation } from "@/lib/types/chat"

export interface StreamOptions {
  onStart?: () => void
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
  onMetadata?: (metadata: StreamMetadata) => void
  onCitation?: (citation: any) => void
  onArtifact?: (artifact: any) => void
  signal?: AbortSignal
}

export interface StreamMetadata {
  sources?: any[]
  citations?: Citation[]
  artifacts?: any[]
  model?: string
  tokensUsed?: number
}

export class StreamManager {
  private controller: AbortController | null = null

  async startStream(
    url: string,
    body: any,
    options: StreamOptions
  ): Promise<void> {
    this.controller = new AbortController()
    
    try {
      options.onStart?.()

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: options.signal || this.controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          const data = line.slice(6)
          
          if (data === '[DONE]') {
            options.onComplete?.(fullContent)
            return
          }

          try {
            const chunk = JSON.parse(data)

            switch (chunk.event) {
              case 'chunk':
                if (chunk.content) {
                  fullContent += chunk.content
                  options.onChunk?.(chunk.content)
                }
                break

              case 'citation':
                if (chunk.citation) {
                  options.onCitation?.(chunk.citation)
                }
                break

              case 'artifact':
                if (chunk.artifact) {
                  options.onArtifact?.(chunk.artifact)
                }
                break

              case 'done':
                options.onComplete?.(fullContent)
                return

              case 'error':
                throw new Error(chunk.error || 'Stream error')
            }
          } catch (parseError) {
            console.error('Failed to parse chunk:', data, parseError)
          }
        }
      }

      options.onComplete?.(fullContent)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
      } else {
        options.onError?.(error as Error)
        throw error
      }
    }
  }

  stopStream(): void {
    this.controller?.abort()
    this.controller = null
  }

  async resumeStream(messageId: string, url: string, options: StreamOptions): Promise<void> {
    await this.startStream(
      `${url}?resumeFrom=${messageId}`,
      {},
      options
    )
  }
}

export const streamManager = new StreamManager()

export async function* createSSEStream(
  url: string,
  body: any
): AsyncGenerator<StreamChunk, void, unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response body')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue

      const data = line.slice(6)
      
      if (data === '[DONE]') {
        return
      }

      try {
        const chunk: StreamChunk = JSON.parse(data)
        yield chunk

        if (chunk.type === 'done') {
          return
        }
      } catch (parseError) {
        console.error('Failed to parse chunk:', data)
      }
    }
  }
}
