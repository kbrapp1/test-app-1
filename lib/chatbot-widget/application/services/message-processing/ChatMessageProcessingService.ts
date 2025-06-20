/**
 * Chat Message Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle AI response generation and message processing
 * - Coordinate AI services and message creation
 * - Keep under 200-250 lines
 * - Focus on message processing operations only
 * - Follow @golden-rule patterns exactly
 */

import {
  MessageProcessingWorkflowService,
  WorkflowContext
} from './MessageProcessingWorkflowService';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { IAIConversationService, ConversationContext } from '../../../domain/services/interfaces/IAIConversationService';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { SystemPromptBuilderService } from '../conversation-management/SystemPromptBuilderService';
import { ChatMessageFactoryService } from '../../../domain/services/utilities/ChatMessageFactoryService';
import { ConversationFlowService, AIConversationFlowDecision } from '../../../domain/services/conversation-management/ConversationFlowService';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId?: string;
  metadata?: any;
}

export interface AnalysisResult {
  session: any;
  userMessage: ChatMessage;
  contextResult: any;
  config: any;
  enhancedContext: any;
}

export interface MessageProcessingContext {
  session: any;
  config: any;
  userMessage: ChatMessage;
}

export interface ResponseResult {
  session: any;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  allMessages: ChatMessage[];
  config: any;
  enhancedContext: any;
}

export class ChatMessageProcessingService {
  private readonly systemPromptBuilderService: SystemPromptBuilderService;

  constructor(
    private readonly aiConversationService: IAIConversationService,
    private readonly messageRepository: IChatMessageRepository,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.systemPromptBuilderService = new SystemPromptBuilderService(aiConversationService);
  }

  async processUserMessage(
    workflowContext: WorkflowContext,
    request: ProcessMessageRequest
  ): Promise<MessageProcessingContext> {
    const { session, config, userMessage } = workflowContext;

    return {
      session,
      config,
      userMessage
    };
  }

  async generateAIResponse(analysisResult: AnalysisResult, sharedLogFile?: string): Promise<ResponseResult> {
    const { session, userMessage, contextResult, config, enhancedContext } = analysisResult;
    
    // Check if userMessage is already in contextResult.messages to avoid duplication
    const isUserMessageInContext = contextResult.messages.some((msg: ChatMessage) => msg.id === userMessage.id);
    const allMessages = isUserMessageInContext 
      ? contextResult.messages 
      : [...contextResult.messages, userMessage];

    // Use provided shared log file or create new one as fallback
    const logFileName = sharedLogFile || `chatbot-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;

    // Try unified processing first (1 API call)
    if (this.intentClassificationService && 'processChatbotInteractionComplete' in this.intentClassificationService) {
      try {
        // Build conversation context for unified processing
        const conversationContext = this.buildConversationContext(
          config,
          session,
          contextResult.messages,
          userMessage,
          contextResult.summary,
          enhancedContext
        );

        // Add shared log file to context
        conversationContext.sharedLogFile = logFileName;

        const apiCallStart = Date.now();
        
        // Make single unified API call
        const unifiedResult = await (this.intentClassificationService as any).processChatbotInteractionComplete(
          userMessage.content,
          conversationContext
        );
        
        const apiCallDuration = Date.now() - apiCallStart;

        // Log unified result structure for debugging
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, logFileName);
        
        // Optimized logging: Check environment variable once and return appropriate function
        const createLogEntry = () => {
          const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
          
          if (!fileLoggingEnabled) {
            // Return no-op function when logging disabled - zero overhead
            return () => {};
          }
          
          // Return active logging function when enabled
          return (logMessage: string) => {
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] ${logMessage}\\n`;
            fs.appendFileSync(logFile, logLine);
          };
        };
        
        const logEntry = createLogEntry();
        
        logEntry('🔍 CHAT MESSAGE PROCESSING - UNIFIED RESULT VALIDATION:');
        logEntry(`📋 Unified result type: ${typeof unifiedResult}`);
        logEntry(`📋 Unified result keys: ${Object.keys(unifiedResult || {}).join(', ')}`);
        logEntry(`📋 Has analysis: ${!!unifiedResult?.analysis}`);
        logEntry(`📋 Has conversationFlow: ${!!unifiedResult?.conversationFlow}`);
        logEntry(`📋 Has leadScore: ${!!unifiedResult?.leadScore}`);
        logEntry(`📋 Has response: ${!!unifiedResult?.response}`);
        
        // Log AI conversation flow decisions
        if (unifiedResult?.conversationFlow) {
          logEntry('🔄 AI CONVERSATION FLOW DECISIONS:');
          logEntry(`📋 Should capture lead now: ${unifiedResult.conversationFlow.shouldCaptureLeadNow}`);
          logEntry(`📋 Should ask qualification: ${unifiedResult.conversationFlow.shouldAskQualificationQuestions}`);
          logEntry(`📋 Should escalate to human: ${unifiedResult.conversationFlow.shouldEscalateToHuman}`);
          logEntry(`📋 Next best action: ${unifiedResult.conversationFlow.nextBestAction}`);
          logEntry(`📋 Conversation phase: ${unifiedResult.conversationFlow.conversationPhase}`);
          logEntry(`📋 Engagement level: ${unifiedResult.conversationFlow.engagementLevel}`);
          logEntry(`📋 Flow reasoning: ${unifiedResult.conversationFlow.flowReasoning}`);
        }
        
        if (unifiedResult?.leadScore) {
          logEntry(`📋 LeadScore structure: ${JSON.stringify(unifiedResult.leadScore, null, 2)}`);
        }

        // Create bot message from unified result (with shared log file)
        const botMessage = await this.createBotMessageUnified(session, unifiedResult, logFileName);

        // Update session with unified processing results (with shared log file)
        const updatedSession = this.updateSessionContextUnified(
          session,
          botMessage,
          allMessages,
          unifiedResult,
          logFileName
        );

        // Process AI conversation flow decisions if available
        let aiFlowDecision: AIConversationFlowDecision | null = null;
        if (unifiedResult?.conversationFlow) {
          aiFlowDecision = unifiedResult.conversationFlow as AIConversationFlowDecision;
          
          // Log AI flow decision processing
          logEntry('🔄 PROCESSING AI CONVERSATION FLOW DECISIONS:');
          logEntry(`📋 AI recommends lead capture: ${ConversationFlowService.shouldTriggerLeadCapture(aiFlowDecision)}`);
          logEntry(`📋 AI recommends qualification: ${ConversationFlowService.shouldAskQualificationQuestions(aiFlowDecision)}`);
          logEntry(`📋 AI recommends escalation: ${ConversationFlowService.shouldEscalateToHuman(aiFlowDecision)}`);
          logEntry(`📋 Readiness score: ${ConversationFlowService.calculateReadinessScore(aiFlowDecision.readinessIndicators)}`);
          
          const recommendedActions = ConversationFlowService.getRecommendedActions(aiFlowDecision);
          logEntry(`📋 Recommended actions: ${recommendedActions.join(', ')}`);
        }

        return {
          session: updatedSession,
          userMessage,
          botMessage,
          allMessages,
          config,
          enhancedContext: {
            ...enhancedContext,
            unifiedAnalysis: unifiedResult?.analysis || { primaryIntent: 'unknown', primaryConfidence: 0 },
            conversationFlow: aiFlowDecision, // Include AI flow decision
            leadScore: unifiedResult?.leadScore || { totalScore: 0 },
            callToAction: unifiedResult?.response?.callToAction || { type: 'none', priority: 'low' }
          }
        };

      } catch (error) {        
        // API-only approach: Still use OpenAI for error responses
        try {
          const errorContext = this.buildConversationContext(
            config,
            session,
            contextResult.messages,
            userMessage,
            contextResult.summary,
            enhancedContext
          );

          // Use OpenAI to generate an appropriate error response
          const errorPrompt = this.buildErrorRecoveryPrompt(error, userMessage.content);
          const errorConversationContext = { ...errorContext, systemPrompt: errorPrompt };
          
          const aiErrorResponse = await this.aiConversationService.generateResponse(
            userMessage.content,
            errorConversationContext
          );

          // Create bot message from AI error response
          const botMessage = await this.createBotMessage(session, aiErrorResponse, logFileName);
          
          // Check if userMessage is already in contextResult.messages to avoid duplication
          const isUserMessageInErrorContext = contextResult.messages.some((msg: ChatMessage) => msg.id === userMessage.id);
          const allMessages = isUserMessageInErrorContext 
            ? [...contextResult.messages, botMessage]
            : [...contextResult.messages, userMessage, botMessage];
            
          const updatedSession = this.updateSessionContext(session, botMessage, allMessages, enhancedContext);

          return {
            session: updatedSession,
            userMessage,
            botMessage,
            allMessages,
            config,
            enhancedContext: {
              ...enhancedContext,
              fallbackUsed: false, // API-generated error response, not fallback
              errorRecovery: true,
              originalError: error instanceof Error ? error.message : 'Unknown error'
            }
          };

        } catch (secondaryError) {
          // If API fails completely, throw error instead of static fallback
          throw new Error(`API unavailable. Primary error: ${error instanceof Error ? error.message : 'Unknown'}. Secondary error: ${secondaryError instanceof Error ? secondaryError.message : 'Unknown'}`);
        }
      }
    }

    // If unified processing is not available, throw error instead of static fallback
    throw new Error('Unified processing not available and no alternative API methods configured');
  }

  private buildConversationContext(
    config: any,
    session: any,
    messages: ChatMessage[],
    userMessage: ChatMessage,
    summary: string | undefined,
    enhancedContext: any
  ): ConversationContext {
    // Build enhanced system prompt with knowledge base integration
    const systemPrompt = this.systemPromptBuilderService.buildEnhancedSystemPrompt(
      config,
      session,
      messages,
      enhancedContext
    );

    return {
      chatbotConfig: config,
      session,
      messageHistory: [...messages, userMessage],
      systemPrompt,
      conversationSummary: summary
    };
  }

  private async createBotMessage(session: any, aiResponse: any, sharedLogFile: string): Promise<ChatMessage> {
    // Create bot message with enhanced metadata using factory service
    let botMessage = ChatMessageFactoryService.createBotMessageWithFullMetadata(
      session.id,
      aiResponse.content,
      aiResponse.metadata?.model || 'unknown',
      aiResponse.metadata?.promptTokens || 0,
      aiResponse.metadata?.completionTokens || 0,
      aiResponse.confidence || 0,
      aiResponse.intentDetected?.toString() || 'false',
      [], // entities - will be extracted separately if needed
      aiResponse.processingTimeMs || 0
    );

    // Add cost tracking if available
    if (aiResponse.metadata?.cost) {
      botMessage = botMessage.addCostTracking(
        aiResponse.metadata.cost.totalCents,
        aiResponse.metadata.cost
      );
    }

    // Add sentiment if provided
    if (aiResponse.sentiment) {
      botMessage = botMessage.updateSentiment(aiResponse.sentiment);
    }

    // Save bot message to database with shared log file
    return await this.messageRepository.save(botMessage, sharedLogFile);
  }

  private updateSessionContext(
    session: any,
    botMessage: ChatMessage,
    allMessages: ChatMessage[],
    enhancedContext: any
  ): any {
    // Extract API-provided data and format according to ApiAnalysisData interface
    const apiProvidedData = {
      entities: {
        urgency: enhancedContext?.urgency as 'low' | 'medium' | 'high' | undefined || 'low'
      },
      leadScore: {
        scoreBreakdown: {
          engagementLevel: enhancedContext?.engagementLevel === 'high' ? 20 : 
                          enhancedContext?.engagementLevel === 'medium' ? 10 : 5
        }
      }
    };

    // Use ConversationContextOrchestrator to update session with API data
    return this.conversationContextOrchestrator.updateSessionContext(
      session,
      botMessage,
      allMessages,
      apiProvidedData
    );
  }

  async retrieveKnowledge(query: string, context?: any): Promise<any> {
    if (!this.knowledgeRetrievalService) {
      return null;
    }

    const searchContext = {
      userQuery: query,
      intentResult: context?.intentResult,
      conversationHistory: context?.conversationHistory,
      userPreferences: context?.userPreferences,
      maxResults: context?.maxResults || 5,
      minRelevanceScore: context?.minRelevanceScore || 0.5
    };

    const result = await this.knowledgeRetrievalService.searchKnowledge(searchContext);
    return result.items;
  }

  /**
   * Build error recovery prompt for OpenAI API
   * 
   * AI INSTRUCTIONS:
   * - Create a system prompt that helps AI generate appropriate error responses
   * - Include context about the error for better response generation
   * - Follow @golden-rule patterns for single responsibility
   */
  private buildErrorRecoveryPrompt(error: unknown, userMessage: string): string {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return `You are a helpful AI assistant for a business website. The system encountered a technical issue while processing the user's message, but you should still provide a helpful response.

ERROR CONTEXT:
- Technical issue: ${errorMessage}
- User's message: "${userMessage}"

INSTRUCTIONS:
1. Acknowledge there was a brief technical issue
2. Still try to address the user's question or need as best you can
3. Be helpful and professional
4. If you can't fully address their request due to the technical issue, suggest alternative ways to get help
5. Don't mention specific technical details about the error

Respond as if you're a knowledgeable business assistant who experienced a brief hiccup but is still ready to help.`;
  }

  /**
   * Create bot message from unified processing result
   * 
   * AI INSTRUCTIONS:
   * - Extract response content and metadata from unified result
   * - Include lead scoring and CTA information in metadata
   * - Follow @golden-rule patterns for single responsibility
   * - Add proper validation for API response structure
   * - FIXED: Now properly extracts token usage AND entity data from unified API response
   */
  private async createBotMessageUnified(session: any, unifiedResult: any, sharedLogFile: string): Promise<ChatMessage> {
    // Safely extract response content with fallback
    const responseContent = unifiedResult?.response?.content || 
      "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.";
    
    // Safely extract confidence with fallback
    const confidence = unifiedResult?.analysis?.primaryConfidence || 0;

    // FIXED: Extract token usage from unified result (available in API response)
    const promptTokens = unifiedResult?.usage?.prompt_tokens || 0;
    const completionTokens = unifiedResult?.usage?.completion_tokens || 0;
    const totalTokens = unifiedResult?.usage?.total_tokens || promptTokens + completionTokens;

    // FIXED: Extract entity data from unified analysis and convert to required format
    const entitiesExtracted = this.extractEntitiesFromUnified(unifiedResult?.analysis?.entities);
    
    // Create bot message with proper token usage AND entity data using factory service
    let botMessage = ChatMessageFactoryService.createBotMessageWithFullMetadata(
      session.id,
      responseContent,
      unifiedResult?.model || 'gpt-4o-mini',
      promptTokens,
      completionTokens,
      confidence,
      unifiedResult?.analysis?.primaryIntent || 'unified_processing',
      entitiesExtracted,
      0 // processingTime - will be calculated by provider
    );

    // Add cost tracking using the actual token usage
    if (promptTokens > 0 || completionTokens > 0) {
      // Calculate costs consistently using the same rates
      const promptRate = 0.00015; // $0.15 per 1K tokens
      const completionRate = 0.0006; // $0.60 per 1K tokens
      
      const promptCostDollars = (promptTokens / 1000) * promptRate;
      const completionCostDollars = (completionTokens / 1000) * completionRate;
      const totalCostDollars = promptCostDollars + completionCostDollars;
      
      const promptTokensCents = promptCostDollars * 100;
      const completionTokensCents = completionCostDollars * 100;
      const totalCostCents = totalCostDollars * 100;
      
      botMessage = botMessage.addCostTracking(totalCostCents, {
        promptTokensCents,
        completionTokensCents,
        totalCents: totalCostCents,
        displayCents: Math.round(totalCostCents * 10000) / 10000,
        modelRate: promptRate
      });
    }

    // Save bot message to database with shared log file
    return await this.messageRepository.save(botMessage, sharedLogFile);
  }

  /**
   * Extract entities from unified API response into factory service format
   * 
   * AI INSTRUCTIONS:
   * - Transform unified API entity structure to factory service format
   * - Handle missing or malformed entity data gracefully
   * - Follow @golden-rule patterns for data transformation
   * - Use the format expected by ChatMessageFactoryService
   */
  private extractEntitiesFromUnified(entities: any): Array<{ type: string; value: string; confidence: number; start?: number; end?: number }> {
    if (!entities || typeof entities !== 'object') {
      return [];
    }

    return Object.entries(entities).map(([type, value]) => ({
      type,
      value: String(value),
      confidence: 0.9, // Unified API doesn't provide per-entity confidence
      start: undefined, // Position data not available from unified API
      end: undefined
    }));
  }

  /**
   * Calculate cost from token usage using proper pricing
   * 
   * AI INSTRUCTIONS:
   * - Use correct GPT-4o-mini pricing
   * - Return cost in cents for precision
   * - Follow domain service patterns
   */
  private calculateCostFromTokens(promptTokens: number, completionTokens: number, model: string): number {
    // GPT-4o-mini pricing (per 1K tokens)
    const promptRate = 0.00015; // $0.15 per 1K tokens
    const completionRate = 0.0006; // $0.60 per 1K tokens
    
    const promptCost = (promptTokens / 1000) * promptRate;
    const completionCost = (completionTokens / 1000) * completionRate;
    const totalCostDollars = promptCost + completionCost;
    
    return totalCostDollars * 100; // Convert to cents
  }

  /**
   * Map API engagement score (0-25) to engagement level
   * 
   * AI INSTRUCTIONS:
   * - Convert numerical score from OpenAI API to categorical level
   * - Use thresholds that match business logic
   */
  private mapEngagementScoreToLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 20) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  /**
   * Update session context with unified processing results
   * 
   * AI INSTRUCTIONS:
   * - Include lead scoring and qualification data in session context
   * - Track unified processing analytics
   * - Follow @golden-rule patterns for data consistency
   * - Preserve domain entity integrity
   * - Add proper validation for API response structure
   */
  private updateSessionContextUnified(
    session: any,
    botMessage: ChatMessage,
    allMessages: ChatMessage[],
    unifiedResult: any,
    sharedLogFile: string
  ): any {
    // Extract API-provided data and format according to ApiAnalysisData interface
    const apiProvidedData = {
      entities: {
        urgency: 'medium' as const, // Default since not directly provided in current schema
        painPoints: unifiedResult?.analysis?.entities?.painPoints || [],
        integrationNeeds: unifiedResult?.analysis?.entities?.integrationNeeds || [],
        evaluationCriteria: unifiedResult?.analysis?.entities?.evaluationCriteria || []
      },
      personaInference: {
        role: unifiedResult?.analysis?.entities?.role,
        industry: unifiedResult?.analysis?.entities?.industry,
        evidence: unifiedResult?.analysis?.personaInference?.evidence || []
      },
      leadScore: {
        scoreBreakdown: {
          engagementLevel: unifiedResult?.leadScore?.scoreBreakdown?.engagementLevel || 0
        }
      }
    };

    // Use ConversationContextOrchestrator to update session (returns ChatSession entity)
    const updatedSession = this.conversationContextOrchestrator.updateSessionContext(
      session,
      botMessage,
      allMessages,
      apiProvidedData
    );

    // Enhanced context data with unified processing metadata using domain methods
    const enhancedContextData = {
      ...updatedSession.contextData,
      lastLeadScore: unifiedResult?.leadScore?.totalScore || 0,
      sharedLogFile
    };

    // Use domain entity method to update context data
    return updatedSession.updateContextData(enhancedContextData);
  }

  /**
   * Process chatbot interaction with optimized performance
   * AI INSTRUCTIONS: Parallel operations to reduce total processing time
   * NOTE: This is a demonstration of optimization techniques
   */
  private async optimizedProcessingExample(
    sessionId: string,
    userMessage: string,
    timestamp: Date
  ): Promise<any> {
    const startTime = Date.now();
    
    // OPTIMIZATION TECHNIQUES TO IMPLEMENT:
    // 1. Parallel initial database operations
    // 2. Load conversation context in parallel
    // 3. Background non-critical operations
    // 4. Database connection pooling
    // 5. Prepared statements for frequent queries
    
    const endTime = Date.now();
    console.log(`🚀 Potential optimized processing time: ${endTime - startTime}ms`);
    
    // This demonstrates the optimization approach
    // Implementation would need to be integrated with existing methods
    return null;
  }
} 