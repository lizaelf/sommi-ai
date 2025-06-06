// Real-time streaming client for first-token TTS triggering
export interface StreamingEvent {
  type: 'first_token' | 'token' | 'complete' | 'error';
  content?: string;
  start_tts?: boolean;
  conversationId?: number;
  message?: string;
}

export class StreamingChatClient {
  private eventSource: EventSource | null = null;
  private onStreamEvent: (event: StreamingEvent) => void;
  private onComplete: (fullContent: string, conversationId?: number) => void;
  private onError: (error: string) => void;
  
  constructor(
    onStreamEvent: (event: StreamingEvent) => void,
    onComplete: (fullContent: string, conversationId?: number) => void,
    onError: (error: string) => void
  ) {
    this.onStreamEvent = onStreamEvent;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async startStreaming(
    messages: { role: string; content: string }[],
    conversationId?: number,
    wineData?: any
  ): Promise<void> {
    try {
      // Create request payload
      const requestData = {
        messages,
        conversationId,
        wineData,
        optimize_for_speed: true
      };

      // Send initial request to start streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
      }

      // Handle Server-Sent Events for real-time streaming
      this.eventSource = new EventSource('/api/chat');
      let fullContent = '';
      let completedConversationId: number | undefined;

      this.eventSource.onmessage = (event) => {
        try {
          const data: StreamingEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'first_token':
              // Trigger TTS immediately with first token
              if (data.start_tts && data.content) {
                this.onStreamEvent(data);
                fullContent += data.content;
              }
              break;
              
            case 'token':
              // Accumulate tokens for real-time display
              if (data.content) {
                fullContent += data.content;
                this.onStreamEvent(data);
              }
              break;
              
            case 'complete':
              // Streaming completed
              completedConversationId = data.conversationId;
              this.onComplete(fullContent, completedConversationId);
              this.cleanup();
              break;
              
            case 'error':
              // Handle streaming errors
              this.onError(data.message || 'Streaming error occurred');
              this.cleanup();
              break;
          }
        } catch (parseError) {
          console.error('Error parsing streaming event:', parseError);
          this.onError('Failed to parse streaming response');
          this.cleanup();
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        this.onError('Connection to streaming service lost');
        this.cleanup();
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.onError('Failed to start real-time streaming');
    }
  }

  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public stop(): void {
    this.cleanup();
  }
}

// Utility function to check if streaming is supported
export function isStreamingSupported(): boolean {
  return typeof EventSource !== 'undefined';
}

// Factory function to create streaming client
export function createStreamingClient(
  onFirstToken: (content: string) => void,
  onToken: (content: string) => void,
  onComplete: (fullContent: string, conversationId?: number) => void,
  onError: (error: string) => void
): StreamingChatClient {
  return new StreamingChatClient(
    (event) => {
      if (event.type === 'first_token' && event.start_tts && event.content) {
        onFirstToken(event.content);
      } else if (event.type === 'token' && event.content) {
        onToken(event.content);
      }
    },
    onComplete,
    onError
  );
}