import { NextRequest, NextResponse } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { withErrorHandling } from '@/lib/middleware/error';
import { getActiveOrganizationId } from '@/lib/auth';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { DebugInfoMapper } from '@/lib/chatbot-widget/application/mappers/DebugInfoMapper';
import { checkChatbotWidgetFeatureFlag } from '@/lib/chatbot-widget/application/services/ChatbotWidgetFeatureFlagService';

/**
 * POST /api/chatbot-widget/chat
 * Process user chat message and return AI response
 */
async function postHandler(
  request: NextRequest,
  _user: User,
  _supabase: SupabaseClient
) {
  // Check if chatbot widget feature is enabled
  await checkChatbotWidgetFeatureFlag();

  // Parse request body
  const body = await request.json();
  const { 
    message, 
    sessionId, 
    clientInfo 
  } = body;

  // Validate required fields
  if (!message || !sessionId) {
    return NextResponse.json(
      { error: 'Missing required fields: message, sessionId' },
      { status: 400 }
    );
  }

  // Get organization context for proper error logging and permissions
  const organizationId = await getActiveOrganizationId();
  
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization context required' },
      { status: 400 }
    );
  }

  // Get use case from composition root
  const processChatMessageUseCase = await ChatbotWidgetCompositionRoot.getProcessChatMessageUseCase();

  // Process the chat message with organization context
  const startTime = Date.now();
  const result = await processChatMessageUseCase.execute({
    sessionId,
    userMessage: message,
    organizationId, // Include organization context for proper error logging
    metadata: { clientInfo }
  });

  const processingTime = Date.now() - startTime;

  // Note: System prompt generation removed as it was not being used in the response
  // The debug information is handled by DebugInfoMapper instead

  // Get debug information if available and transform to DTO
  const debugService = ChatbotWidgetCompositionRoot.getDebugInformationService();
  const domainDebugInfo = debugService.getProcessingDebugInfo(result.chatSession.id);
  
  // Transform domain debug data to presentation DTO using mapper
  const debugInfo = DebugInfoMapper.toDto(
    domainDebugInfo,
    result.intentAnalysis,
    result.journeyState,
    result.conversationMetrics,
    result.shouldCaptureLeadInfo,
[...result.suggestedNextActions]
  );

  // Debug info available in response for client-side debugging

  // Return successful response
  return NextResponse.json({
    sessionId: result.chatSession.id,
    userMessageId: result.userMessage.id,
    botResponse: result.botResponse.content,
    botMessageId: result.botResponse.id,
    shouldCaptureLeadInfo: result.shouldCaptureLeadInfo,
    suggestedNextActions: result.suggestedNextActions,
    conversationMetrics: result.conversationMetrics,
    processingTimeMs: processingTime,
    intentAnalysis: result.intentAnalysis,
    journeyState: result.journeyState,
    callToAction: result.callToAction, // Include CTA information
    debugInfo: debugInfo, // Include transformed debug data
  });
}

// Export the POST handler with authentication and error handling
export const POST = withErrorHandling(withAuth(postHandler) as (...args: unknown[]) => Promise<NextResponse>);