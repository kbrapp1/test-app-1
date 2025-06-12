import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ChatSession } from '@/lib/chatbot-widget/domain/entities/ChatSession';

/**
 * POST /api/chatbot-widget/session
 * Initialize a new chat session
 */
async function postHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  const body = await request.json();
  const { 
    chatbotConfigId,
    visitorId,
    initialContext
  } = body;

  // Validate required fields
  if (!chatbotConfigId) {
    return NextResponse.json(
      { error: 'Missing required field: chatbotConfigId' },
      { status: 400 }
    );
  }

  // Get repositories from composition root
  const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
  const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();

  // Verify chatbot config exists and is active
  const config = await configRepository.findById(chatbotConfigId);
  if (!config || !config.isActive) {
    return NextResponse.json(
      { error: 'Chatbot configuration not found or inactive' },
      { status: 404 }
    );
  }

  // Create new session using domain entity
  const session = ChatSession.create(
    chatbotConfigId,
    visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    initialContext
  );

  // Save to repository
  const savedSession = await sessionRepository.save(session);

  return NextResponse.json({
    sessionId: savedSession.id,
    chatbotConfig: {
      id: config.id,
      name: config.name,
      description: config.description,
      isActive: config.isActive
    },
    visitorId: savedSession.visitorId,
    startedAt: savedSession.startedAt
  });
}

/**
 * GET /api/chatbot-widget/session/[sessionId]
 * Retrieve session information
 */
async function getHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    );
  }

  const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
  const session = await sessionRepository.findById(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    chatbotConfigId: session.chatbotConfigId,
    visitorId: session.visitorId,
    startedAt: session.startedAt,
    status: session.status,
    contextData: session.contextData
  });
}

export const POST = withErrorHandling(withAuth(postHandler));
export const GET = withErrorHandling(withAuth(getHandler)); 