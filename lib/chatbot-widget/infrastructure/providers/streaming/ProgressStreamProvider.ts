/**
 * Progress Stream Provider - Infrastructure Layer
 * 
 * DDD Infrastructure: Handles Server-Sent Events for real-time progress streaming
 * - Single responsibility: Stream progress updates to clients
 * - Infrastructure concern: HTTP streaming implementation
 * - Clean interface for application layer integration
 */

export interface ProgressUpdate {
  type: 'status' | 'pages_found' | 'pages_processed' | 'complete' | 'error';
  data: {
    sourceId: string;
    status?: string;
    message?: string;
    pagesFound?: number;
    pagesProcessed?: number;
    progress?: number;
    error?: string;
  };
}

export interface IProgressStreamProvider {
  createStream(sourceId: string): ReadableStream<Uint8Array>;
  sendUpdate(sourceId: string, update: ProgressUpdate): void;
  closeStream(sourceId: string): void;
}

/**
 * Server-Sent Events Progress Stream Provider
 * Infrastructure implementation for real-time progress updates
 */
export class SSEProgressStreamProvider implements IProgressStreamProvider {
  private streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
  private encoder = new TextEncoder();

  createStream(sourceId: string): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.streams.set(sourceId, controller);
        
        // Send initial connection message
        this.sendMessage(controller, {
          type: 'status',
          data: {
            sourceId,
            status: 'connected',
            message: 'Progress stream connected'
          }
        });
      },
      cancel: () => {
        this.streams.delete(sourceId);
      }
    });
  }

  sendUpdate(sourceId: string, update: ProgressUpdate): void {
    const controller = this.streams.get(sourceId);
    if (controller) {
      this.sendMessage(controller, update);
    }
  }

  closeStream(sourceId: string): void {
    const controller = this.streams.get(sourceId);
    if (controller) {
      try {
        controller.close();
      } catch {
        // Stream might already be closed
      }
      this.streams.delete(sourceId);
    }
  }

  private sendMessage(
    controller: ReadableStreamDefaultController<Uint8Array>,
    update: ProgressUpdate
  ): void {
    try {
      const message = `data: ${JSON.stringify(update)}\n\n`;
      const encoded = this.encoder.encode(message);
      controller.enqueue(encoded);
    } catch (error) {
      console.error('Failed to send SSE message:', error);
    }
  }
}