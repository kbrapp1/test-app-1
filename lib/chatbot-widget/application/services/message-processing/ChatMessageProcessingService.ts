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
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { ExtractedEntities } from '../../../domain/value-objects/message-processing/IntentResult';
import { DomainConstants } from '../../../domain/value-objects/ai-configuration/DomainConstants';

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

    // Unified processing only (single API call approach)
    if (this.intentClassificationService && 'processChatbotInteractionComplete' in this.intentClassificationService) {
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
      // Check if file logging is enabled first, before any file operations
      const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
      
      let logEntry: (message: string) => void = () => {}; // Default no-op function
      
      if (fileLoggingEnabled) {
        // Only import fs and set up logging if enabled
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        
        // Ensure logs directory exists only when logging is enabled
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logFile = path.join(logDir, logFileName);
        
        // Create active logging function when enabled
        logEntry = (logMessage: string) => {
          const timestamp = new Date().toISOString();
          const logLine = `[${timestamp}] ${logMessage}\n`;
          fs.appendFileSync(logFile, logLine);
        };
      }
      
      logEntry('🔍 CHAT MESSAGE PROCESSING - UNIFIED RESULT VALIDATION:');
      logEntry(`📋 Unified result type: ${typeof unifiedResult}`);
      logEntry(`📋 Unified result keys: ${Object.keys(unifiedResult || {}).join(', ')}`);
      logEntry(`📋 Has analysis: ${!!unifiedResult?.analysis}`);
      logEntry(`📋 Has conversationFlow: ${!!unifiedResult?.conversationFlow}`);
      logEntry(`📋 LeadScore: Domain-calculated (not AI-provided) ✅`);
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

      return {
        session: updatedSession,
        userMessage,
        botMessage,
        allMessages,
        config,
        enhancedContext: {
          ...enhancedContext,
          unifiedAnalysis: unifiedResult?.analysis || { primaryIntent: 'unknown', primaryConfidence: 0 },
          conversationFlow: null, // Will be set after session update
          callToAction: unifiedResult?.response?.callToAction || { type: 'none', priority: 'low' }
          // REMOVED: leadScore - now calculated by domain service only
        }
      };
    }

    // If unified processing is not available, throw error instead of fallback processing
    throw new Error('Unified processing service not available - chatbot cannot process messages without unified intent classification service');
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

  // Removed: createBotMessage and updateSessionContext methods 
  // These were used by the secondary processing path that created duplicate messages

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

  // Removed: buildErrorRecoveryPrompt method
  // This was used by the secondary processing path for error recovery

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
   * - FIXED: Extract ALL entities from API response for proper lead scoring
   * - FIXED: Use EntityAccumulationService to properly merge entities into session context
   * - Include all core business entities (company, role, budget, etc.)
   * - Extract visitor name from entities for proper context tracking
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
    // FIXED: Extract ALL entities from API response, not just a subset
    const entities = unifiedResult?.analysis?.entities || {};
    

    
    // FIXED: Use EntityAccumulationService to properly merge entities into session context
    const freshEntities = this.convertToExtractedEntitiesFormat(entities);
    

    
    const existingAccumulatedEntities = session.contextData.accumulatedEntities 
      ? AccumulatedEntities.fromObject(session.contextData.accumulatedEntities)
      : null;
    
    const entityMergeContext = {
      messageId: botMessage.id,
      defaultConfidence: 0.9,
      enableDeduplication: true,
      confidenceThreshold: 0.7
    };
    
    const entityMergeResult = EntityAccumulationService.mergeEntitiesWithCorrections(
      existingAccumulatedEntities,
      freshEntities,
      entityMergeContext
    );
    
    // Extract API-provided data and format according to ApiAnalysisData interface
    const apiProvidedData = {
      entities: {
        urgency: entities.urgency || 'medium' as const,
        painPoints: entities.painPoints || [],
        integrationNeeds: entities.integrationNeeds || [],
        evaluationCriteria: entities.evaluationCriteria || [],
        // ADDED: Core business entities for lead scoring
        company: entities.company,
        role: entities.role,
        budget: entities.budget,
        timeline: entities.timeline,
        teamSize: entities.teamSize,
        industry: entities.industry,
        contactMethod: entities.contactMethod,
        // ADDED: Visitor identification
        visitorName: entities.visitorName || entities.name
      },
      personaInference: {
        role: entities.role,
        industry: entities.industry,
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

    // FIXED: Calculate lead score from accumulated entities using DomainConstants
    const accumulatedEntitiesPlain = entityMergeResult.accumulatedEntities.toPlainObject();
    const leadScoreEntities = this.convertAccumulatedEntitiesToLeadScoringFormat(accumulatedEntitiesPlain);
    const calculatedLeadScore = DomainConstants.calculateLeadScore(leadScoreEntities);
    
    // Log comprehensive lead score calculation for debugging
    if (sharedLogFile && process.env.CHATBOT_FILE_LOGGING !== 'false') {
      try {
        const fs = require('fs');
        
        // Calculate individual component scores for detailed breakdown
        const scoreBreakdown: Record<string, number> = {};
        let totalFromStandardRules = 0;
        let roleAuthorityScore = 0;
        
        // Calculate role authority score separately
        if (leadScoreEntities.role) {
          roleAuthorityScore = DomainConstants.getRoleAuthorityScore(leadScoreEntities.role);
          scoreBreakdown['role (authority-based)'] = roleAuthorityScore;
        }
        
        // Calculate standard scoring rules (excluding role)
        const standardRules = DomainConstants.getLeadScoringRules();
        Object.entries(leadScoreEntities).forEach(([key, value]) => {
          if (value && key !== 'role' && key in standardRules) {
            const points = standardRules[key as keyof typeof standardRules];
            scoreBreakdown[key] = points;
            totalFromStandardRules += points;
          }
        });
        
        const uncappedTotal = totalFromStandardRules + roleAuthorityScore;
        const isCapped = uncappedTotal > 100;
        
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        const logFilePath = path.join(logDir, sharedLogFile);
        fs.appendFileSync(logFilePath, `
🎯 =====================================
🎯 LEAD SCORE CALCULATION (DOMAIN-BASED)
🎯 =====================================
📋 Input Entities for Scoring:
${JSON.stringify(leadScoreEntities, null, 2)}

📊 Detailed Score Breakdown:
${Object.entries(scoreBreakdown).map(([entity, points]) => 
  `   • ${entity}: ${points} points`).join('\n')}

🧮 Calculation Summary:
   • Standard Rules Total: ${totalFromStandardRules} points
   • Role Authority Score: ${roleAuthorityScore} points
   • Uncapped Total: ${uncappedTotal} points
   • Final Score: ${calculatedLeadScore} points ${isCapped ? '(capped at 100)' : ''}
   
📏 Scoring Rules Applied:
   • Budget: ${standardRules.budget} points
   • Timeline: ${standardRules.timeline} points  
   • Company: ${standardRules.company} points
   • Industry: ${standardRules.industry} points
   • Team Size: ${standardRules.teamSize} points
   • Urgency: ${standardRules.urgency} points
   • Contact Method: ${standardRules.contactMethod} points
   • Role: Authority-based scoring (see ROLE_AUTHORITY_WEIGHTS)

🏆 Qualification Status: ${calculatedLeadScore >= 60 ? 'QUALIFIED' : 'NOT QUALIFIED'} (threshold: 60)
🔧 Source: DomainConstants.calculateLeadScore() + getRoleAuthorityScore()
🎯 =====================================

`);
      } catch (error) {
        console.warn('Failed to write lead score calculation to log file:', error);
      }
    }

    // FIXED: Enhanced context data with ALL extracted entities and proper lead scoring
    const enhancedContextData = {
      ...updatedSession.contextData,
      // Update core session fields from extracted entities
      visitorName: entities.visitorName || entities.name || updatedSession.contextData.visitorName,
      company: entities.company || updatedSession.contextData.company,
      email: entities.email || updatedSession.contextData.email,
      phone: entities.phone || updatedSession.contextData.phone,
      // FIXED: Include properly accumulated entities
      accumulatedEntities: accumulatedEntitiesPlain,
      // FIXED: Use calculated lead score from accumulated entities
      leadScore: calculatedLeadScore,
      sharedLogFile
    };

    // Use domain entity method to update context data
    const finalUpdatedSession = updatedSession.updateContextData(enhancedContextData);

    // Process AI conversation flow decisions after domain calculations are complete
    if (unifiedResult?.conversationFlow && sharedLogFile && process.env.CHATBOT_FILE_LOGGING !== 'false') {
      try {
        const fs = require('fs');
        const path = require('path');
        const logFilePath = path.join(process.cwd(), 'logs', sharedLogFile);
        
        const aiFlowDecision = unifiedResult.conversationFlow as any;
        
        // Use domain-calculated lead score and accumulated entities for readiness calculation
        aiFlowDecision.leadScore = calculatedLeadScore;
        aiFlowDecision.entities = leadScoreEntities;
        
        // Log AI flow decision processing
        fs.appendFileSync(logFilePath, `
🔄 =====================================
🔄 AI CONVERSATION FLOW DECISIONS
🔄 =====================================
📋 AI recommends lead capture: ${aiFlowDecision.shouldCaptureLeadNow}
📋 AI recommends qualification: ${aiFlowDecision.shouldAskQualificationQuestions}
📋 AI recommends escalation: ${aiFlowDecision.shouldEscalateToHuman}
📋 Conversation phase: ${aiFlowDecision.conversationPhase}
📋 Engagement level: ${aiFlowDecision.engagementLevel}
📋 Next best action: ${aiFlowDecision.nextBestAction}

🎯 READINESS CALCULATION (DOMAIN-BASED):
📋 Using lead score: ${calculatedLeadScore}
📋 Using entities: ${JSON.stringify(leadScoreEntities, null, 2)}
`);
        
        // Calculate and log derived readiness indicators
        const context = {
          leadScore: calculatedLeadScore,
          entities: leadScoreEntities,
          conversationPhase: aiFlowDecision.conversationPhase || 'discovery',
          engagementLevel: aiFlowDecision.engagementLevel || 'low'
        };
        
        // Import the service here to avoid circular dependencies
        const { ReadinessIndicatorDomainService } = require('../../../domain/services/conversation-management/ReadinessIndicatorDomainService');
        const readinessIndicators = ReadinessIndicatorDomainService.deriveReadinessIndicators(context);
        const readinessScore = ReadinessIndicatorDomainService.calculateReadinessScore(readinessIndicators);
        
        fs.appendFileSync(logFilePath, `
📊 READINESS INDICATORS:
${JSON.stringify(readinessIndicators, null, 2)}

📈 Readiness Score: ${readinessScore}
🔄 =====================================

`);
      } catch (error) {
        console.warn('Failed to process AI flow decisions:', error);
      }
    }

    return finalUpdatedSession;
  }

  /**
   * Convert API entities to ExtractedEntities format for EntityAccumulationService
   * 
   * AI INSTRUCTIONS:
   * - Transform API entity structure to domain service format
   * - Handle missing or malformed entity data gracefully
   * - Follow @golden-rule patterns for data transformation
   * - Only use properties that exist in ExtractedEntities interface
   */
  private convertToExtractedEntitiesFormat(entities: any): ExtractedEntities {
    const extractedEntities: ExtractedEntities = {};
    
    // Map API entities to ExtractedEntities format (only supported properties)
    if (entities.visitorName) extractedEntities.visitorName = entities.visitorName;
    if (entities.budget) extractedEntities.budget = entities.budget;
    if (entities.timeline) extractedEntities.timeline = entities.timeline;
    if (entities.urgency) extractedEntities.urgency = entities.urgency;
    if (entities.contactMethod) extractedEntities.contactMethod = entities.contactMethod;
    if (entities.industry) extractedEntities.industry = entities.industry;
    if (entities.company) extractedEntities.company = entities.company;
    if (entities.teamSize) extractedEntities.teamSize = entities.teamSize;
    if (entities.location) extractedEntities.location = entities.location;
    // FIXED: Add missing role entity mapping for lead scoring
    if (entities.role) extractedEntities.role = entities.role;
    
    // Note: Array entities like painPoints, integrationNeeds, evaluationCriteria, decisionMakers
    // are not part of the ExtractedEntities interface and will be handled separately
    // in the AccumulatedEntities structure
    
    return extractedEntities;
  }

  /**
   * Convert accumulated entities to format expected by DomainConstants.calculateLeadScore()
   * 
   * AI INSTRUCTIONS:
   * - Transform accumulated entities structure to lead scoring format
   * - Handle nested entity objects with confidence/extractedAt metadata
   * - Extract only the value from each entity for scoring
   */
  private convertAccumulatedEntitiesToLeadScoringFormat(accumulatedEntities: any): Partial<Record<string, any>> {
    const leadScoringEntities: Partial<Record<string, any>> = {};
    
    // Extract values from accumulated entities structure
    // AccumulatedEntities stores entities as: { entityType: { value, confidence, extractedAt, ... } }
    if (accumulatedEntities.budget?.value) {
      leadScoringEntities.budget = accumulatedEntities.budget.value;
    }
    if (accumulatedEntities.timeline?.value) {
      leadScoringEntities.timeline = accumulatedEntities.timeline.value;
    }
    if (accumulatedEntities.company?.value) {
      leadScoringEntities.company = accumulatedEntities.company.value;
    }
    if (accumulatedEntities.industry?.value) {
      leadScoringEntities.industry = accumulatedEntities.industry.value;
    }
    if (accumulatedEntities.teamSize?.value) {
      leadScoringEntities.teamSize = accumulatedEntities.teamSize.value;
    }
    if (accumulatedEntities.urgency?.value) {
      leadScoringEntities.urgency = accumulatedEntities.urgency.value;
    }
    if (accumulatedEntities.contactMethod?.value) {
      leadScoringEntities.contactMethod = accumulatedEntities.contactMethod.value;
    }
    if (accumulatedEntities.role?.value) {
      leadScoringEntities.role = accumulatedEntities.role.value;
    }
    // Note: visitorName doesn't contribute to lead scoring but is tracked for personalization
    
    return leadScoringEntities;
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