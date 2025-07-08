/**
 * AI Instructions: Server actions for chatbot simulation testing
 * - Use real API pipeline for authentic testing
 * - Maintain proper session management for simulations
 * - Follow DDD principles with composition root
 * - Include debug information for QA analysis
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

// Create new chat session for simulation
export async function createSimulationSession(organizationId: string): Promise<{ success: boolean; session?: SimulationSession; error?: string }> {
  try {
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

    // NEW: Use InitializeChatSessionUseCase with comprehensive background cache warming
    const sessionRepository = ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const knowledgeRetrievalService = ChatbotWidgetCompositionRoot.getKnowledgeRetrievalService(chatbotConfig);
    
    const initializeSessionUseCase = new (await import('../../application/use-cases/InitializeChatSessionUseCase')).InitializeChatSessionUseCase(
      sessionRepository,
      configRepository,
      knowledgeRetrievalService
    );

    const visitorId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Execute session initialization with comprehensive cache warming
    const result = await initializeSessionUseCase.execute({
      chatbotConfigId: chatbotConfig.id,
      visitorId,
      initialContext: {},
      warmKnowledgeCache: true // Always warm cache for optimal performance
    });

    return {
      success: true,
      session: {
        sessionId: result.session.id,
        chatbotConfigId: chatbotConfig.id,
        visitorId: result.session.visitorId,
        startedAt: result.session.startedAt.toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send message through real chatbot pipeline
export async function sendSimulationMessage(
  sessionId: string,
  message: string,
  organizationId: string
): Promise<SimulationMessageResult> {
  try {

    const processChatMessageUseCase = await ChatbotWidgetCompositionRoot.getProcessChatMessageUseCase();

    const startTime = Date.now();
    const result = await processChatMessageUseCase.execute({
      sessionId,
      userMessage: message,
      organizationId,
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

    const debugService = ChatbotWidgetCompositionRoot.getDebugInformationService();
    const domainDebugInfo = debugService.getProcessingDebugInfo(result.chatSession.id);


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
    try {
      const errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
      await errorTrackingService.trackMessageProcessingError(
        `Pipeline initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          sessionId,
          organizationId,
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
        console.error('Failed to track pipeline error:', trackingError);
    }

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

// End simulation session
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

    const endedSession = session.end();
    
    await sessionRepository.update(endedSession);


    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 