import { NextRequest, NextResponse } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { withErrorHandling } from '@/lib/middleware/error';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { InitializeChatSessionUseCase } from '@/lib/chatbot-widget/application/use-cases/InitializeChatSessionUseCase';
import { BusinessRuleViolationError, ResourceNotFoundError } from '@/lib/errors/base';
import { checkChatbotWidgetFeatureFlag } from '@/lib/chatbot-widget/application/services/ChatbotWidgetFeatureFlagService';

/**
 * POST /api/chatbot-widget/session
 * Initialize a new chat session with per-request cache warming
 * 
 * AI INSTRUCTIONS:
 * - Trigger vector cache initialization during session creation
 * - Use per-request cache warming optimized for serverless
 * - Validate feature flags and chatbot configuration
 * - Return comprehensive session information including cache status
 */
async function postHandler(
  request: NextRequest,
  _user: User,
  _supabase: SupabaseClient
) {
  const body = await request.json();
  const { 
    chatbotConfigId,
    visitorId,
    initialContext,
    warmKnowledgeCache = true
  } = body;

  try {
    // Check if chatbot widget feature is enabled
    await checkChatbotWidgetFeatureFlag();

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

    // Execute session initialization with per-request cache warming
    const result = await initializeSessionUseCase.execute({
      chatbotConfigId,
      visitorId,
      initialContext,
      warmKnowledgeCache // Use provided value or default true
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.session.id,
        sessionToken: result.session.sessionToken,
        chatbotConfig: {
          id: result.chatbotConfig.id,
          name: result.chatbotConfig.name,
          organizationId: result.chatbotConfig.organizationId,
        },
        cacheWarmed: result.cacheWarmed,
        cacheWarmingTimeMs: result.cacheWarmingTimeMs
      }
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
  _user: User,
  _supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    );
  }

  try {
    // Check if chatbot widget feature is enabled
    await checkChatbotWidgetFeatureFlag();

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
  } catch (error) {
    // Handle feature flag errors
    if (error instanceof Error && error.message.includes('not enabled')) {
      return NextResponse.json(
        { error: error.message, code: 'FEATURE_DISABLED' },
        { status: 403 }
      );
    }
    
    // Re-throw other errors for error middleware
    throw error;
  }
}

export const POST = withErrorHandling(withAuth(postHandler) as (...args: unknown[]) => Promise<NextResponse>);
export const GET = withErrorHandling(withAuth(getHandler) as (...args: unknown[]) => Promise<NextResponse>); 