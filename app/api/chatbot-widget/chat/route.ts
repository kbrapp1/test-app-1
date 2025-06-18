import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { DebugInfoMapper } from '@/lib/chatbot-widget/application/mappers/DebugInfoMapper';

/**
 * POST /api/chatbot-widget/chat
 * Process user chat message and return AI response
 */
async function postHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
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

  // Get use case from composition root
  const processChatMessageUseCase = await ChatbotWidgetCompositionRoot.getProcessChatMessageUseCase();

  // Process the chat message
  const startTime = Date.now();
  const result = await processChatMessageUseCase.execute({
    sessionId,
    userMessage: message,
    clientInfo
  });

  const processingTime = Date.now() - startTime;

  // Get the system prompt and config for debug info (if available)
  let systemPrompt = 'System prompt not available';
  let fullPrompt = 'Full prompt not available';
  let chatbotConfig = null;
  
  try {
    // Try to get the chatbot config to build the system prompt
    const sessionRepository = await ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const session = await sessionRepository.findById(sessionId);
    
    if (session) {
      const chatbotConfigRepository = await ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
      const config = await chatbotConfigRepository.findById(session.chatbotConfigId);
      
      if (config) {
        chatbotConfig = config;
        systemPrompt = config.generateSystemPrompt();
        // Build a representation of what was sent to the API
        fullPrompt = `System: ${systemPrompt}\n\nUser: ${message}`;
      }
    }
  } catch (error) {
    // If we can't get the system prompt, that's okay for debug purposes
  }

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
    result.suggestedNextActions
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
export const POST = withErrorHandling(withAuth(postHandler));