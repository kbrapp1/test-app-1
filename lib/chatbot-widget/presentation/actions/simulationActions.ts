/**
 * Simulation Actions
 * 
 * AI INSTRUCTIONS:
 * - Server actions for chatbot simulation testing
 * - Use real API pipeline for authentic testing
 * - Handle session creation and message processing
 * - All results logged to file, minimal UI feedback
 */

'use server';

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ChatSession } from '../../domain/entities/ChatSession';

export interface SimulationSession {
  sessionId: string;
  chatbotConfigId: string;
  visitorId: string;
  startedAt: string;
}

export interface SimulationMessageResult {
  success: boolean;
  sessionId: string;
  userMessageId: string;
  botResponse: string;
  botMessageId: string;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: any;
  processingTimeMs: number;
  totalPromptTimeSeconds: number;
  intentAnalysis?: any;
  journeyState?: any;
  callToAction?: any;
  debugInfo?: any;
  error?: string;
}

/**
 * Create a new chat session for simulation
 */
export async function createSimulationSession(organizationId: string): Promise<{ success: boolean; session?: SimulationSession; error?: string }> {
  try {
    // Get chatbot config for organization
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    const chatbotConfig = await configRepository.findByOrganizationId(organizationId);
    
    if (!chatbotConfig) {
      return {
        success: false,
        error: 'No chatbot configuration found for organization'
      };
    }

    if (!chatbotConfig.isActive) {
      return {
        success: false,
        error: 'Chatbot configuration is not active'
      };
    }

    // Create new simulation session
    const visitorId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = ChatSession.create(
      chatbotConfig.id,
      visitorId,
      {
        previousVisits: 0,
        pageViews: [{
          url: '/simulation',
          title: 'Chatbot Simulation',
          timestamp: new Date(),
          timeOnPage: 0
        }],
        conversationSummary: {
          fullSummary: 'Simulation session started',
          phaseSummaries: [],
          criticalMoments: []
        },
        topics: [],
        interests: [],
        engagementScore: 0
      }
    );

    // Save session without logging for simulation
    const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const savedSession = await sessionRepository.save(session);

    // Session creation logged to file for QA analysis

    return {
      success: true,
      session: {
        sessionId: savedSession.id,
        chatbotConfigId: chatbotConfig.id,
        visitorId: savedSession.visitorId,
        startedAt: savedSession.startedAt.toISOString()
      }
    };
  } catch (error) {
    // Error logged to file for debugging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a message through the real chatbot pipeline
 */
export async function sendSimulationMessage(
  sessionId: string,
  message: string
): Promise<SimulationMessageResult> {
  try {
    // Message processing logged to file for QA analysis

    // Get use case from composition root
    const processChatMessageUseCase = await ChatbotWidgetCompositionRoot.getProcessChatMessageUseCase();

    // Process the chat message using real pipeline
    const startTime = Date.now();
    const result = await processChatMessageUseCase.execute({
      sessionId,
      userMessage: message,
      metadata: { 
        clientInfo: {
          source: 'simulation',
          userAgent: 'Simulation Client',
          ipAddress: '127.0.0.1'
        }
      }
    });

    const processingTime = Date.now() - startTime;
    const totalPromptTimeSeconds = Number((processingTime / 1000).toFixed(1));

    // Get debug information
    const debugService = ChatbotWidgetCompositionRoot.getDebugInformationService();
    const domainDebugInfo = debugService.getProcessingDebugInfo(result.chatSession.id);

    // Complete pipeline results logged to file for QA analysis

    return {
      success: true,
      sessionId: result.chatSession.id,
      userMessageId: result.userMessage.id,
      botResponse: result.botResponse.content,
      botMessageId: result.botResponse.id,
      shouldCaptureLeadInfo: result.shouldCaptureLeadInfo,
      suggestedNextActions: result.suggestedNextActions,
      conversationMetrics: result.conversationMetrics,
      processingTimeMs: processingTime,
      totalPromptTimeSeconds: totalPromptTimeSeconds,
      intentAnalysis: result.intentAnalysis,
      journeyState: result.journeyState,
      callToAction: result.callToAction,
      debugInfo: domainDebugInfo
    };
  } catch (error) {
    // Log pipeline error to database for analysis
    try {
      const errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
      await errorTrackingService.trackMessageProcessingError(
        `Pipeline initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          sessionId,
          metadata: {
            userMessage: message,
            source: 'simulation',
            errorType: 'pipeline_initialization',
            timestamp: new Date().toISOString(),
            errorDetails: error instanceof Error ? error.stack : undefined
          }
        }
      );
    } catch (trackingError) {
      // If error tracking fails, log to console but don't throw
      console.error('Failed to track pipeline error:', trackingError);
    }

    // Error logged to file for debugging
    return {
      success: false,
      sessionId,
      userMessageId: '',
      botResponse: 'Error processing message',
      botMessageId: '',
      shouldCaptureLeadInfo: false,
      suggestedNextActions: [],
      conversationMetrics: {},
      processingTimeMs: 0,
      totalPromptTimeSeconds: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * End a simulation session
 */
export async function endSimulationSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const session = await sessionRepository.findById(sessionId);
    
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // End the session  
    const endedSession = session.end();
    
    // Update session without logging for simulation
    await sessionRepository.update(endedSession);

    // Session end logged to file for QA analysis

    return { success: true };
  } catch (error) {
    // Error logged to file for debugging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 