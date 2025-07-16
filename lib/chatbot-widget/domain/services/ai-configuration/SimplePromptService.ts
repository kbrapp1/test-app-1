import { 
  PromptGenerationInput, 
  SystemPromptResult, 
  PromptGenerationOptions,
  PromptComponents,
  PromptMetadata,
  PromptSection,
  ISimplePromptService,
  KnowledgeItem 
} from './types/SimplePromptTypes';
import { PersonaGenerationService } from './PersonaGenerationService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { BusinessGuidanceService } from './BusinessGuidanceService';
import { AdaptiveContextService } from './AdaptiveContextService';
import { ConversationAnalysis } from './ConversationAnalysisService';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Simple Prompt Generation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate system prompts without coordination overhead
 * - Direct string concatenation for maximum performance
 * - Maintain entity and vector injection functionality
 * - Use existing domain services for specialized logic
 * - Keep business logic pure with no external dependencies
 * - Follow @golden-rule patterns exactly - under 250 lines
 * - Environment-controlled logging (respects production logging env vars)
 * - Delegate complex operations to specialized domain services
 */
export class SimplePromptService implements ISimplePromptService {
  
  constructor(
    private readonly personaService: PersonaGenerationService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly businessGuidanceService: BusinessGuidanceService,
    private readonly adaptiveContextService: AdaptiveContextService
  ) {}

  // AI: Async version for compatibility with existing interfaces
  async generateSystemPrompt(
    input: PromptGenerationInput,
    options: PromptGenerationOptions = PromptGenerationOptions.default()
  ): Promise<SystemPromptResult> {
    return this.generateSystemPromptSync(input, options);
  }

  // AI: Synchronous version for maximum performance
  generateSystemPromptSync(
    input: PromptGenerationInput,
    options: PromptGenerationOptions = PromptGenerationOptions.default()
  ): SystemPromptResult {
    const startTime = Date.now();
    
    // AI: Validate input using domain rules
    this.validateInput(input);
    
    // AI: Log generation start if logger available
    input.logger?.logMessage('🚀 Starting simple prompt generation (direct concatenation)');
    input.logger?.logMessage(`Options: entities=${options.includeEntityContext}, vectors=${options.includeVectorSearch}, journey=${options.includeJourneyState}`);

    // AI: Generate each component using specialized domain services
    const components = this.buildPromptComponents(input, options);
    
    // AI: Assemble final prompt using direct string concatenation
    const content = this.assemblePromptContent(components);
    
    // AI: Calculate metadata for monitoring
    const metadata = this.calculateMetadata(content, components, startTime);
    
    // AI: Log completion with performance metrics
    input.logger?.logMessage(`✅ Simple prompt generated in ${metadata.processingTimeMs}ms`);
    input.logger?.logMessage(`Final length: ${metadata.totalLength} chars (~${metadata.estimatedTokens} tokens)`);

    return {
      content,
      generatedAt: new Date(),
      components,
      metadata
    };
  }

  // AI: Validate input using business rules
  private validateInput(input: PromptGenerationInput): void {
    if (!input.chatbotConfig) {
      throw new BusinessRuleViolationError(
        'ChatbotConfig is required for prompt generation',
        { operation: 'generateSystemPrompt' }
      );
    }
    
    if (!input.session) {
      throw new BusinessRuleViolationError(
        'ChatSession is required for prompt generation',
        { operation: 'generateSystemPrompt' }
      );
    }
    
    if (!input.messageHistory) {
      throw new BusinessRuleViolationError(
        'Message history is required for prompt generation',
        { operation: 'generateSystemPrompt' }
      );
    }
  }

  // AI: Build individual prompt components using domain services
  private buildPromptComponents(
    input: PromptGenerationInput,
    options: PromptGenerationOptions
  ): PromptComponents {
    // AI: Create default conversation analysis for domain services
    const defaultAnalysis: ConversationAnalysis = {
      messageCount: input.messageHistory.length,
      phase: input.messageHistory.length <= 1 ? 'greeting' : 'discovery',
      businessContext: false,
      productInterest: false,
      pricingFocus: false,
      comparisonMode: false,
      entityComplexity: 0,
      tokensNeeded: 400
    };

    // AI: Generate persona using existing domain service
    const personaVariables = this.personaService.generateContextAwarePersona(
      input.chatbotConfig,
      defaultAnalysis
    );
    const persona = this.buildPersonaSection(personaVariables);

    // AI: Generate knowledge base content
    const knowledgeBase = this.knowledgeBaseService.buildMinimalKnowledgeBase(
      input.chatbotConfig.knowledgeBase
    );

    // AI: Generate business guidance
    const businessGuidance = this.businessGuidanceService.generateBusinessGuidance(
      defaultAnalysis
    );

    // AI: Generate conversation context
    const conversationContext = this.buildConversationContext(input.messageHistory);

    // AI: Optional components based on enhanced context
    const entityContext = options.includeEntityContext 
      ? input.enhancedContext?.entityContextPrompt 
      : undefined;

    const relevantKnowledge = options.includeVectorSearch && input.enhancedContext?.relevantKnowledge
      ? this.buildRelevantKnowledgeSection(input.enhancedContext.relevantKnowledge, options)
      : undefined;

    const journeyContext = options.includeJourneyState && input.enhancedContext?.journeyState
      ? this.buildJourneyContextSection(input.enhancedContext.journeyState)
      : undefined;

    return {
      persona,
      knowledgeBase,
      entityContext,
      relevantKnowledge,
      businessGuidance,
      conversationContext,
      journeyContext
    };
  }

  // AI: Build persona section from template variables
  private buildPersonaSection(personaVariables: any[]): string {
    const roleTitle = personaVariables.find(v => v.name === 'roleTitle')?.value || 'Assistant';
    const roleDescription = personaVariables.find(v => v.name === 'roleDescription')?.value || 'helpful assistant';
    const tone = personaVariables.find(v => v.name === 'tone')?.value || 'Professional';
    const approach = personaVariables.find(v => v.name === 'approach')?.value || 'Helpful and informative';

    return `## Role & Persona
**Title**: ${roleTitle}
**Description**: ${roleDescription}
**Tone**: ${tone}
**Approach**: ${approach}

`;
  }

  // AI: Build conversation context from message history
  private buildConversationContext(messageHistory: any[]): string {
    if (!messageHistory || messageHistory.length === 0) {
      return `## Conversation Context
This is the start of a new conversation.

`;
    }

    const recentMessages = messageHistory.slice(-5); // AI: Last 5 messages for context
    const messageCount = messageHistory.length;

    return `## Conversation Context
**Messages in conversation**: ${messageCount}
**Recent context**: Last ${recentMessages.length} messages available for reference

`;
  }

  // AI: Build relevant knowledge section from vector search results
  private buildRelevantKnowledgeSection(
    knowledgeItems: KnowledgeItem[], 
    options: PromptGenerationOptions
  ): string | undefined {
    const filteredItems = knowledgeItems
      .filter(item => item.relevanceScore >= options.minRelevanceScore)
      .slice(0, options.maxKnowledgeItems);

    if (filteredItems.length === 0) {
      return undefined;
    }

    let section = `## Relevant Knowledge (Vector Search Results)\n`;
    
    filteredItems.forEach((item, index) => {
      section += `### ${index + 1}. ${item.title}\n`;
      section += `${item.content}\n\n`;
    });

    return section;
  }

  // AI: Build journey context section
  private buildJourneyContextSection(journeyState: unknown): string {
    const journey = journeyState as { stage: string; confidence: number; isSalesReady(): boolean };
    return `## User Journey Context
**Stage**: ${journey.stage}
**Confidence**: ${journey.confidence.toFixed(2)}
**Sales Ready**: ${journey.isSalesReady() ? 'Yes' : 'No'}

`;
  }

  // AI: Assemble final prompt using direct string concatenation for performance
  private assemblePromptContent(components: PromptComponents): string {
    let prompt = '';

    // AI: Core components (always included)
    prompt += components.persona;
    prompt += components.knowledgeBase;
    prompt += components.businessGuidance;

    // AI: Optional enhanced context components
    if (components.entityContext) {
      prompt += `## Entity Context\n${components.entityContext}\n\n`;
    }

    if (components.relevantKnowledge) {
      prompt += components.relevantKnowledge;
    }

    if (components.journeyContext) {
      prompt += components.journeyContext;
    }

    // AI: Conversation context (always last)
    prompt += components.conversationContext;

    return prompt.trim();
  }

  // AI: Calculate metadata for monitoring and debugging
  private calculateMetadata(
    content: string, 
    components: PromptComponents, 
    startTime: number
  ): PromptMetadata {
    return {
      totalLength: content.length,
      estimatedTokens: Math.ceil(content.length / 4), // AI: Rough token estimation
      knowledgeItemsCount: components.relevantKnowledge ? 
        (components.relevantKnowledge.match(/###/g) || []).length : 0,
      hasEntityContext: !!components.entityContext,
      hasJourneyContext: !!components.journeyContext,
      processingTimeMs: Date.now() - startTime
    };
  }
} 