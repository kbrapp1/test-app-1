/**
 * Conversation Context Builder Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Build conversation context for AI processing
 * - Handle compression, entity injection, and system prompt building
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on context orchestration only
 * - Follow DDD application service patterns
 * - Use centralized logging service for consistent tracking
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IAIConversationService, ConversationContext } from '../../../domain/services/interfaces/IAIConversationService';
import { SystemPromptBuilderService } from '../conversation-management/SystemPromptBuilderService';
import { ApiDrivenCompressionService } from '../conversation-management/ApiDrivenCompressionService';
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';

export class ConversationContextBuilderService {
  private readonly systemPromptBuilderService: SystemPromptBuilderService;
  private readonly loggingService: IChatbotLoggingService;
  private readonly errorTrackingService: ErrorTrackingFacade;
  private sessionId?: string;
  private organizationId?: string;
  private conversationId?: string;

  constructor(
    private readonly aiConversationService: IAIConversationService
  ) {
    /**
     * AI INSTRUCTIONS:
     * - Initialize system prompt builder for enhanced prompts
     * - Initialize centralized logging service
     * - Initialize error tracking service for database persistence
     * - Follow composition over inheritance patterns
     */
    this.systemPromptBuilderService = new SystemPromptBuilderService(
      aiConversationService,
      ChatbotWidgetCompositionRoot.getDynamicPromptService()
    );
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  /**
   * Build conversation context with compression and entity injection
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate compression, entity analysis, and system prompt building
   * - Use centralized logging for consistent tracking
   * - Delegate complex operations to specialized services
   * - Return complete conversation context for AI processing
   */
  async buildConversationContext(
    config: any,
    session: any,
    messages: ChatMessage[],
    userMessage: ChatMessage,
    summary: string | undefined,
    enhancedContext: any,
    logFileName?: string
  ): Promise<ConversationContext> {
    // Store context for error tracking
    this.sessionId = session.id;
    this.organizationId = config.organizationId;
    this.conversationId = session.conversationId;
    
    // AI: Validate organization ID is available for error tracking
    if (!this.organizationId) {
      throw new Error('Organization ID is required for conversation context building');
    }
    
    // Create session logger with context - shared log file is required
    if (!logFileName) {
      throw new Error('LogFileName is required for conversation context building - all logging must be conversation-specific');
    }
    const logger = this.loggingService.createSessionLogger(
      session.id,
      logFileName,
      {
        sessionId: session.id,
        operation: 'conversation-context-building',
        messageId: userMessage.id
      }
    );
    
    // Apply conversation compression if needed
    const { finalMessages, conversationSummary } = await this.applyCompressionIfNeeded(
      messages,
      userMessage,
      summary,
      logger
    );

    // Analyze and inject accumulated entities
    const entityContextPrompt = this.analyzeAndInjectEntities(session, logger);

    // Build complete enhanced context
    const completeEnhancedContext = {
      ...enhancedContext,
      entityContextPrompt,
      sharedLogFile: logFileName
    };

    // Build enhanced system prompt with knowledge base integration
    const systemPrompt = this.systemPromptBuilderService.buildEnhancedSystemPrompt(
      config,
      session,
      finalMessages,
      completeEnhancedContext
    );

    return {
      chatbotConfig: config,
      session,
      messageHistory: finalMessages,
      systemPrompt,
      conversationSummary
    };
  }



  /**
   * Apply conversation compression if needed
   * 
   * AI INSTRUCTIONS:
   * - Check if compression is needed using token analysis
   * - Apply API-driven compression with proper configuration
   * - Return final messages and conversation summary
   * - Use centralized logging for tracking
   */
  private async applyCompressionIfNeeded(
    messages: ChatMessage[],
    userMessage: ChatMessage,
    summary: string | undefined,
    logger: ISessionLogger
  ): Promise<{ finalMessages: ChatMessage[]; conversationSummary: string | undefined }> {
    const allMessages = [...messages, userMessage];
    const tokenAnalysis = ApiDrivenCompressionService.analyzeTokenUsage(allMessages);
    
    let finalMessages = allMessages;
    let conversationSummary = summary;
    
    if (tokenAnalysis.needsCompression) {
      logger.logStep('Applying conversation compression due to token limits', {
        originalMessageCount: allMessages.length,
        tokenAnalysis
      });
      
      const compressionResult = await ApiDrivenCompressionService.compressConversation(
        allMessages,
        this.createSummarizationFunction(),
        {
          tokenThresholdPercentage: 85,
          maxTokenLimit: 16000,
          recentTurnsToPreserve: 6
        }
      );
      
      finalMessages = compressionResult.recentMessages;
      conversationSummary = compressionResult.conversationSummary;
      
      logger.logStep('Compression completed', {
        originalMessageCount: allMessages.length,
        finalMessageCount: finalMessages.length,
        compressionRatio: `${allMessages.length} → ${finalMessages.length}`
      });
    }

    return { finalMessages, conversationSummary };
  }

  /**
   * Analyze and inject accumulated entities
   * 
   * AI INSTRUCTIONS:
   * - Analyze session context for accumulated entities
   * - Log entity analysis for debugging
   * - Build entity context prompt for system prompt injection
   * - Return entity context prompt string
   * - Use centralized logging for tracking
   */
  private analyzeAndInjectEntities(session: any, logger: ISessionLogger): string {
    logger.logStep('Entity injection analysis started', {
      hasContextData: !!session.contextData,
      hasAccumulatedEntities: !!session.contextData?.accumulatedEntities
    });
    
    if (!session.contextData?.accumulatedEntities) {
      logger.logStep('No accumulated entities found - no injection will occur');
      return '';
    }

    // Analyze entities for injection
    this.logEntityAnalysis(session.contextData.accumulatedEntities, logger);

    // Build entity context prompt
    const entityContextPrompt = EntityAccumulationService.buildEntityContextPrompt(
      AccumulatedEntities.fromObject(session.contextData.accumulatedEntities)
    );
    
    if (entityContextPrompt) {
      logger.logStep('Generated entity context prompt', {
        promptLength: entityContextPrompt.length,
        prompt: entityContextPrompt
      });
    } else {
      logger.logStep('No entity context prompt generated (empty or no entities)');
    }

    return entityContextPrompt;
  }

  /**
   * Log detailed entity analysis
   * 
   * AI INSTRUCTIONS:
   * - Log which entities have values for injection
   * - Include confidence scores and array entity counts
   * - Provide comprehensive debugging information
   * - Use centralized logging for tracking
   */
  private logEntityAnalysis(entities: any, logger: ISessionLogger): void {
    logger.logStep('Raw accumulated entities structure', {
      entities: entities
    });
    
    const entitiesToInject: string[] = [];
    
    // Check single entities
    const singleEntityTypes = ['visitorName', 'role', 'company', 'industry', 'teamSize', 'budget', 'timeline', 'urgency'];
    singleEntityTypes.forEach(entityType => {
      if (entities[entityType]?.value) {
        entitiesToInject.push(`${entityType}: "${entities[entityType].value}" (confidence: ${entities[entityType].confidence})`);
      }
    });
    
    // Check array entities
    const arrayEntityTypes = ['painPoints', 'decisionMakers', 'integrationNeeds', 'evaluationCriteria'];
    arrayEntityTypes.forEach(entityType => {
      if (entities[entityType]?.length > 0) {
        const valuesList = entities[entityType].map((item: any) => `"${item.value}"`).join(', ');
        entitiesToInject.push(`${entityType}: [${valuesList}]`);
      }
    });
    
    if (entitiesToInject.length > 0) {
      logger.logStep('Entities to be injected into prompt', {
        entityCount: entitiesToInject.length,
        entities: entitiesToInject
      });
    } else {
      logger.logStep('No entities have values - empty injection');
    }
  }

  /**
   * Create AI summarization function for compression
   * 
   * AI INSTRUCTIONS:
   * - Use existing AI service to generate conversation summaries
   * - Handle errors gracefully with fallback messages
   * - Focus on business-critical information
   */
  private createSummarizationFunction() {
    return async (messages: ChatMessage[], instruction: string): Promise<string> => {
      const conversationText = messages
        .map(msg => `${msg.messageType === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const summaryPrompt = `${instruction}

CONVERSATION TO SUMMARIZE:
${conversationText}

Provide a concise but comprehensive summary focusing on business-critical information.`;

      try {
        const result = await this.aiConversationService.generateResponse(summaryPrompt, {
          chatbotConfig: { name: 'Summary Assistant' } as any,
          session: { id: 'summary-session' } as any,
          messageHistory: [],
          systemPrompt: 'You are a conversation summarization assistant. Create concise, business-focused summaries.'
        });
        
        return result.content || 'Conversation summary unavailable';
      } catch (error) {
        console.error('Failed to generate conversation summary:', error);
        
        // Track critical chatbot error to database (organizationId is validated to be non-null)
        if (this.organizationId) {
          await this.errorTrackingService.trackConversationAnalysisError(
            'conversation_summary_generation',
            {
              sessionId: this.sessionId,
              organizationId: this.organizationId,
              conversationId: this.conversationId,
              metadata: {
                messageCount: messages.length,
                error: error instanceof Error ? error.message : String(error)
              }
            }
          );
        }
        
        return 'Previous conversation context available but summary generation failed';
      }
    };
  }
} 