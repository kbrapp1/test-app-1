import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { InitializeChatSessionUseCase } from '@/lib/chatbot-widget/application/use-cases/InitializeChatSessionUseCase';
import { BusinessRuleViolationError, ResourceNotFoundError } from '@/lib/errors/base';

/**
 * POST /api/chatbot-widget/session
 * Initialize a new chat session with knowledge cache warming
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
    initialContext,
    warmKnowledgeCache = true
  } = body;

  try {
    // Get repositories and config first
    const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    // Get chatbot config to initialize knowledge retrieval service with proper context
    const chatbotConfig = await configRepository.findById(chatbotConfigId);
    if (!chatbotConfig) {
      return NextResponse.json(
        { error: 'Chatbot configuration not found', code: 'RESOURCE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get knowledge retrieval service with chatbot config for cache warming
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getKnowledgeRetrievalService(chatbotConfig);

    // Create use case with dependencies
    const initializeSessionUseCase = new InitializeChatSessionUseCase(
      sessionRepository,
      configRepository,
      knowledgeRetrievalService
    );

    // Execute session initialization with cache warming
    const result = await initializeSessionUseCase.execute({
      chatbotConfigId,
      visitorId,
      initialContext,
      warmKnowledgeCache
    });

    return NextResponse.json({
      sessionId: result.session.id,
      chatbotConfig: {
        id: result.chatbotConfig.id,
        name: result.chatbotConfig.name,
        description: result.chatbotConfig.description,
        isActive: result.chatbotConfig.isActive
      },
      visitorId: result.session.visitorId,
      startedAt: result.session.startedAt,
      cacheWarmed: result.cacheWarmed,
      cacheWarmingTimeMs: result.cacheWarmingTimeMs
    });

  } catch (error) {
    // Handle domain-specific errors
    if (error instanceof BusinessRuleViolationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 404 }
      );
    }

    // Re-throw unexpected errors for error middleware
    throw error;
  }
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