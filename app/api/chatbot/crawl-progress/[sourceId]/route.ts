/**
 * Crawl Progress Streaming API Route
 * 
 * DDD Application Layer: Provides Server-Sent Events endpoint for real-time crawl progress
 * - Single responsibility: Handle SSE connections for specific crawl sessions
 * - Clean separation: Uses infrastructure providers, delegates to application services
 * - RESTful design: GET /api/chatbot/crawl-progress/[sourceId]
 */

import { NextRequest } from 'next/server';
import { SSEProgressStreamProvider } from '@/lib/chatbot-widget/infrastructure/providers/streaming/ProgressStreamProvider';

// Global stream provider instance for managing active streams
const streamProvider = new SSEProgressStreamProvider();

/**
 * GET /api/chatbot/crawl-progress/[sourceId]
 * Establishes Server-Sent Events connection for crawl progress updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;

  if (!sourceId) {
    return new Response('Source ID required', { status: 400 });
  }

  try {
    // Create progress stream for this source
    const stream = streamProvider.createStream(sourceId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  } catch (error) {
    console.error('Failed to create progress stream:', error);
    return new Response('Failed to create stream', { status: 500 });
  }
}