/**
 * System Prompt Builder Service
 * 
 * Application service for building enhanced system prompts with context.
 * Single responsibility: Handle system prompt construction with intent and knowledge context.
 * LOGGING: Comprehensive knowledge base integration pipeline logging
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IAIConversationService } from '../../../domain/services/interfaces/IAIConversationService';

export interface EnhancedContext {
  intentResult?: {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    getCategory(): string;
    isSalesIntent(): boolean;
    isSupportIntent(): boolean;
  };
  journeyState?: {
    stage: string;
    confidence: number;
    isSalesReady(): boolean;
    getRecommendedActions(): string[];
  };
  relevantKnowledge?: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>;
  entityContextPrompt?: string;
  sharedLogFile?: string;
}

export class SystemPromptBuilderService {
  private logEntry: (message: string) => void = () => {};

  constructor(
    private readonly aiConversationService: IAIConversationService
  ) {}

  /**
   * Setup logging for knowledge base integration pipeline
   */
  private setupLogging(sharedLogFile?: string): void {
    const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
    
    if (!fileLoggingEnabled || !sharedLogFile) {
      this.logEntry = () => {}; // No-op function
      return;
    }
    
    // Setup active logging
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, sharedLogFile);
    
    this.logEntry = (logMessage: string) => {
      const logLine = `[${timestamp}] ${logMessage}\n`;
      try {
        fs.appendFileSync(logFile, logLine);
      } catch (error) {
        // Silently fail to avoid breaking the application
      }
    };
  }

  /**
   * Build enhanced system prompt with knowledge context (removed preliminary intent)
   */
  buildEnhancedSystemPrompt(
    config: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    enhancedContext: EnhancedContext
  ): string {
    // Setup logging if shared log file available
    this.setupLogging(enhancedContext.sharedLogFile);
    
    this.logEntry('\n📝 =====================================');
    this.logEntry('📝 SYSTEM PROMPT BUILDER - KNOWLEDGE INTEGRATION');
    this.logEntry('📝 =====================================');
    
    // Start with base system prompt
    const basePromptStart = Date.now();
    let systemPrompt = this.aiConversationService.buildSystemPrompt(config, session, messageHistory) || '';
    const basePromptDuration = Date.now() - basePromptStart;
    
    this.logEntry(`📋 Base system prompt generated in ${basePromptDuration}ms`);
    this.logEntry(`📋 Base prompt length: ${systemPrompt?.length || 0} characters`);

    // Removed preliminary intent context - let OpenAI handle intent classification
    // No longer adding: CURRENT USER INTENT, INTENT CATEGORY, etc.

    // Add journey state context if available (journey is based on conversation state, not preliminary intent)
    if (enhancedContext.journeyState) {
      this.logEntry('\n🗺️  JOURNEY STATE INTEGRATION:');
      const journey = enhancedContext.journeyState;
      systemPrompt += `\n\nUSER JOURNEY STAGE: ${journey.stage} (confidence: ${journey.confidence.toFixed(2)})`;
      
      this.logEntry(`📋 Journey stage: ${journey.stage}`);
      this.logEntry(`📋 Journey confidence: ${journey.confidence.toFixed(2)}`);
      
      if (journey.isSalesReady()) {
        systemPrompt += `\nNOTE: User is sales-ready. Focus on closing and next steps.`;
        this.logEntry('📋 User is sales-ready - enabling closing focus');
      }

      const recommendedActions = journey.getRecommendedActions();
      if (recommendedActions.length > 0) {
        systemPrompt += `\nRECOMMENDED ACTIONS: ${recommendedActions.join(', ')}`;
        this.logEntry(`📋 Recommended actions: ${recommendedActions.join(', ')}`);
      }
    } else {
      this.logEntry('\n🗺️  No journey state available');
    }

    // Add accumulated entity context if available
    if (enhancedContext.entityContextPrompt) {
      this.logEntry('\n🏷️  ENTITY CONTEXT INTEGRATION:');
      const entityPromptLength = enhancedContext.entityContextPrompt.length;
      systemPrompt += `\n\n${enhancedContext.entityContextPrompt}`;
      systemPrompt += `\nUse this accumulated entity information to provide contextual responses. `;
      systemPrompt += `Reference specific entities mentioned previously in the conversation.`;
      
      this.logEntry(`📋 Entity context injected: ${entityPromptLength} characters`);
      this.logEntry('📋 Entity-aware responses enabled');
    } else {
      this.logEntry('\n🏷️  No entity context available');
    }

    // Add relevant knowledge context if available
    if (enhancedContext.relevantKnowledge && enhancedContext.relevantKnowledge.length > 0) {
      this.logEntry('\n🧠 SEMANTIC KNOWLEDGE INTEGRATION:');
      this.logEntry(`📋 Retrieved knowledge items: ${enhancedContext.relevantKnowledge.length}`);
      
      systemPrompt += `\n\nRELEVANT KNOWLEDGE:`;
      
      let totalKnowledgeCharacters = 0;
      enhancedContext.relevantKnowledge.forEach((knowledge, index) => {
        const knowledgeContent = `\n${index + 1}. ${knowledge.title} (relevance: ${knowledge.relevanceScore.toFixed(2)})`;
        const truncatedContent = `\n   ${knowledge.content.substring(0, 200)}${knowledge.content.length > 200 ? '...' : ''}`;
        
        systemPrompt += knowledgeContent + truncatedContent;
        totalKnowledgeCharacters += knowledge.content.length;
        
        this.logEntry(`📋 ${index + 1}. "${knowledge.title}"`);
        this.logEntry(`    Relevance score: ${knowledge.relevanceScore.toFixed(3)}`);
        this.logEntry(`    Content length: ${knowledge.content.length} chars`);
        this.logEntry(`    Preview: ${knowledge.content.substring(0, 100)}...`);
      });
      
      systemPrompt += `\n\nUse this knowledge to provide accurate, helpful responses. Reference specific information when relevant.`;
      
      this.logEntry(`📊 KNOWLEDGE INTEGRATION SUMMARY:`);
      this.logEntry(`📋 Total knowledge items: ${enhancedContext.relevantKnowledge.length}`);
      this.logEntry(`📋 Total knowledge content: ${totalKnowledgeCharacters} characters`);
      this.logEntry(`📋 Average relevance score: ${(enhancedContext.relevantKnowledge.reduce((sum, item) => sum + item.relevanceScore, 0) / enhancedContext.relevantKnowledge.length).toFixed(3)}`);
      this.logEntry('✅ Semantic knowledge successfully integrated into system prompt');
    } else {
      this.logEntry('\n🧠 KNOWLEDGE INTEGRATION: No relevant knowledge found');
      this.logEntry('📋 Proceeding with base system prompt only');
    }

    const finalPromptLength = systemPrompt.length;
    this.logEntry(`\n📊 FINAL SYSTEM PROMPT STATS:`);
    this.logEntry(`📋 Total prompt length: ${finalPromptLength} characters`);
    this.logEntry(`📋 Estimated tokens: ~${Math.ceil(finalPromptLength / 4)}`);
    this.logEntry(`📋 Knowledge integration: ${enhancedContext.relevantKnowledge?.length || 0} items`);
    this.logEntry(`📋 Entity context: ${enhancedContext.entityContextPrompt ? 'YES' : 'NO'}`);
    this.logEntry(`📋 Journey context: ${enhancedContext.journeyState ? 'YES' : 'NO'}`);
    
    this.logEntry('✅ SYSTEM PROMPT BUILDING COMPLETED');
    this.logEntry('📝 =====================================\n');

    return systemPrompt;
  }
} 