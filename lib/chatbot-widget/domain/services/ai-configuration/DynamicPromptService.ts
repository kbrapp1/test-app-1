import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationAnalysisService } from './ConversationAnalysisService';
import { PersonaGenerationService } from './PersonaGenerationService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { BusinessGuidanceService } from './BusinessGuidanceService';
import { AdaptiveContextService } from './AdaptiveContextService';
import { PromptCoordinationService, CoordinatedPromptResult } from './PromptCoordinationService';
import { IdentityResolutionService, ResolvedPersona } from './IdentityResolutionService';
import { ContentDeduplicationService, DeduplicationResult } from './ContentDeduplicationService';
import { PromptSection } from '../../value-objects/ai-configuration/PromptSection';
import { ServiceIdentifier } from '../../value-objects/ai-configuration/ServiceIdentifier';
import { PromptPriority } from '../../value-objects/ai-configuration/PromptPriority';
import { ContentType } from '../../value-objects/content/ContentType';
import { PromptTemplateEngine, TemplateVariable, TemplateContext } from '../../../infrastructure/providers/templating/PromptTemplateEngine';

/**
 * AI INSTRUCTIONS:
 * - Orchestrate domain services and template engine for prompt generation
 * - Maintain single responsibility for prompt coordination
 * - Use template engine instead of hardcoded string concatenation
 * - Follow golden-rule patterns - no methods over 250 lines
 * - Maintain 500-800 token target through RAG optimization
 * - Preserve business context during casual conversation
 */
export class DynamicPromptService {
  
  constructor(
    private conversationAnalysisService: ConversationAnalysisService,
    private personaGenerationService: PersonaGenerationService,
    private knowledgeBaseService: KnowledgeBaseService,
    private businessGuidanceService: BusinessGuidanceService,
    private adaptiveContextService: AdaptiveContextService,
    private templateEngine: PromptTemplateEngine,
    private promptCoordinationService: PromptCoordinationService,
    private identityResolutionService: IdentityResolutionService,
    private contentDeduplicationService: ContentDeduplicationService
  ) {}


  // Generate system prompt with semantic intent classification using templates
  generateSystemPrompt(
    chatbotConfig: ChatbotConfig, 
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string,
    intentData?: any,
    logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }
  ): string {
    // Analyze conversation using extracted entities and intent
    const analysis = this.conversationAnalysisService.analyzeConversationContext(
      session, 
      conversationHistory, 
      entityData,
      intentData,
      leadScore
    );

    // Generate prompt sections from all services
    const promptSections = this.generatePromptSections(
      chatbotConfig,
      session,
      analysis,
      entityData,
      leadScore
    );

    // IMPORTANT: Skip coordination here - it will happen later in SystemPromptBuilderService
    // after semantic knowledge is integrated. This ensures all content is deduplicated together.
    
    // Convert sections to template variables (without coordination)
    const templateVariables = this.convertSectionsToTemplateVariables(promptSections);

    // Use template engine to generate complete system prompt
    const systemPromptTemplate = this.getSystemPromptTemplate();
    const templateContext = this.buildTemplateContext(templateVariables);
    
    const processedTemplate = this.templateEngine.processTemplate(
      'system-prompt',
      systemPromptTemplate,
      templateContext
    );
    
    return processedTemplate.content;
  }

  // Generate prompt sections from all services (new coordination approach)
  private generatePromptSections(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: any,
    entityData?: any,
    leadScore?: number
  ): PromptSection[] {
    const sections: PromptSection[] = [];

    // Generate persona section
    const personaVariables = this.personaGenerationService.generateContextAwarePersona(chatbotConfig, analysis);
    const businessPersonaTemplate = this.getBusinessPersonaTemplate();
    const personaContext = this.buildTemplateContext(personaVariables);
    const processedPersonaTemplate = this.templateEngine.processTemplate(
      'business-persona',
      businessPersonaTemplate,
      personaContext
    );

    sections.push(PromptSection.create(
      'persona',
      ServiceIdentifier.forPersonaGeneration(),
      'persona',
      'Role & Identity',
      processedPersonaTemplate.content,
      ContentType.CUSTOM,
      PromptPriority.critical(),
      true
    ));

    // Generate knowledge base section
    const knowledgeBaseContent = this.knowledgeBaseService.buildMinimalKnowledgeBase(chatbotConfig.knowledgeBase);
    if (knowledgeBaseContent) {
      sections.push(PromptSection.create(
        'knowledge-base',
        ServiceIdentifier.forKnowledgeBase(),
        'knowledge',
        'Knowledge Base Context',
        knowledgeBaseContent,
        ContentType.COMPANY_INFO,
        PromptPriority.high(),
        false
      ));
    }

    // Generate business guidance section
    const businessGuidance = this.businessGuidanceService.generateBusinessGuidance(analysis, leadScore);
    if (businessGuidance) {
      sections.push(PromptSection.create(
        'business-guidance',
        ServiceIdentifier.forDynamicPrompt(),
        'guidance',
        'Business Guidance',
        businessGuidance,
        ContentType.CUSTOM,
        PromptPriority.medium(),
        false
      ));
    }

    // Generate adaptive context section
    const adaptiveContext = this.adaptiveContextService.generateAdaptiveContext(session, analysis, chatbotConfig);
    if (adaptiveContext) {
      sections.push(PromptSection.create(
        'adaptive-context',
        ServiceIdentifier.forDynamicPrompt(),
        'context',
        'Adaptive Context',
        adaptiveContext,
        ContentType.CUSTOM,
        PromptPriority.medium(),
        false
      ));
    }

    // Add entity context if available
    if (entityData) {
      sections.push(PromptSection.create(
        'entity-context',
        ServiceIdentifier.forDynamicPrompt(),
        'entities',
        'Entity Context',
        JSON.stringify(entityData, null, 2),
        ContentType.CUSTOM,
        PromptPriority.low(),
        false
      ));
    }

    return sections;
  }

  // Coordinate prompt sections using coordination services
  private coordinatePromptSections(sections: PromptSection[], logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }): CoordinatedPromptResult {
    // Group sections by service for coordination
    const sectionsByService = new Map<ServiceIdentifier, PromptSection[]>();
    
    for (const section of sections) {
      const existing = sectionsByService.get(section.serviceId) || [];
      existing.push(section);
      sectionsByService.set(section.serviceId, existing);
    }

    // Apply prompt coordination with deduplication
    return this.promptCoordinationService.coordinatePromptSections(sectionsByService, {
      enableDeduplication: true,
      conflictResolutionStrategy: 'highest_priority' as any,
      maxSectionsPerService: 5,
      preserveOriginalOrder: false
    }, logger);
  }

  // Coordinate final system prompt content (called after knowledge integration)
  coordinateFinalSystemPrompt(
    baseSystemPrompt: string,
    knowledgeItems: Array<{ id: string; title: string; content: string; relevanceScore: number }>,
    logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }
  ): string {
    // Create prompt sections from base prompt and knowledge items
    const sections: PromptSection[] = [];
    
    // Add base system prompt as a section
    sections.push(PromptSection.create(
      'base-system-prompt',
      ServiceIdentifier.forDynamicPrompt(),
      'base',
      'Base System Prompt',
      baseSystemPrompt,
      ContentType.CUSTOM,
      PromptPriority.critical(),
      true
    ));

    // Add knowledge items as sections
    knowledgeItems.forEach((knowledge, index) => {
      sections.push(PromptSection.create(
        `knowledge-${index}`,
        ServiceIdentifier.forKnowledgeBase(),
        'knowledge',
        knowledge.title,
        knowledge.content,
        ContentType.COMPANY_INFO,
        PromptPriority.fromNumeric(Math.round(knowledge.relevanceScore * 1000)),
        false
      ));
    });

    // Now coordinate everything together
    const coordinatedResult = this.coordinatePromptSections(sections, logger);
    
    // Reconstruct the final system prompt from coordinated sections
    let finalPrompt = '';
    const knowledgeSections: PromptSection[] = [];
    
    for (const section of coordinatedResult.sections) {
      if (section.sectionType === 'base') {
        finalPrompt = section.content; // Base prompt first
      } else if (section.sectionType === 'knowledge') {
        knowledgeSections.push(section);
      }
    }
    
    // Add all knowledge sections under a single header
    if (knowledgeSections.length > 0) {
      finalPrompt += '\n\nRELEVANT KNOWLEDGE:';
      for (const section of knowledgeSections) {
        // Only add content since it already includes the title as a header
        finalPrompt += `\n${section.content}\n`;
      }
    }

    return finalPrompt;
  }

  // Convert coordinated sections back to template variables
  private convertSectionsToTemplateVariables(sections: readonly PromptSection[]): TemplateVariable[] {
    const variables: TemplateVariable[] = [];

    for (const section of sections) {
      // Map section types to template variable names
      const variableName = this.mapSectionTypeToVariableName(section.sectionType);
      
      variables.push({
        name: variableName,
        value: section.content,
        isRequired: section.isRequired
      });
    }

    return variables;
  }

  // Map section types to template variable names for backward compatibility
  private mapSectionTypeToVariableName(sectionType: string): string {
    switch (sectionType) {
      case 'persona': return 'personaContent';
      case 'knowledge': return 'knowledgeBaseContent';
      case 'guidance': return 'businessGuidance';
      case 'context': return 'adaptiveContext';
      case 'entities': return 'entityContext';
      default: return sectionType + 'Content';
    }
  }

  // Build all template variables for system prompt generation (legacy method)
  private buildTemplateVariables(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: any,
    entityData?: any,
    leadScore?: number
  ): TemplateVariable[] {
    const variables: TemplateVariable[] = [];

    // Get persona variables from PersonaGenerationService
    const personaVariables = this.personaGenerationService.generateContextAwarePersona(chatbotConfig, analysis);
    
    // Generate persona content using business persona template
    const businessPersonaTemplate = this.getBusinessPersonaTemplate();
    const personaContext = this.buildTemplateContext(personaVariables);
    
    const processedPersonaTemplate = this.templateEngine.processTemplate(
      'business-persona',
      businessPersonaTemplate,
      personaContext
    );

    // Add persona content as main variable
    variables.push({
      name: 'personaContent',
      value: processedPersonaTemplate.content,
      isRequired: true
    });

    // Add knowledge base content
    const knowledgeBaseContent = this.knowledgeBaseService.buildMinimalKnowledgeBase(chatbotConfig.knowledgeBase);
    if (knowledgeBaseContent) {
      variables.push({
        name: 'knowledgeBaseContent',
        value: knowledgeBaseContent,
        isRequired: false
      });
    }

    // Add business guidance
    const businessGuidance = this.businessGuidanceService.generateBusinessGuidance(analysis, leadScore);
    if (businessGuidance) {
      variables.push({
        name: 'businessGuidance',
        value: businessGuidance,
        isRequired: false
      });
    }

    // Add adaptive context
    const adaptiveContext = this.adaptiveContextService.generateAdaptiveContext(session, analysis, chatbotConfig);
    if (adaptiveContext) {
      variables.push({
        name: 'adaptiveContext',
        value: adaptiveContext,
        isRequired: false
      });
    }

    // Add entity context if available
    if (entityData) {
      variables.push({
        name: 'entityContext',
        value: JSON.stringify(entityData, null, 2),
        isRequired: false
      });
    }

    return variables;
  }

  // Get system prompt template content
  private getSystemPromptTemplate(): string {
    // Load template from attached file
    return `{{personaContent}}

{{#if knowledgeBaseContent}}
## Knowledge Base Context
{{knowledgeBaseContent}}
{{/if}}

{{#if businessGuidance}}
## Business Guidance
{{businessGuidance}}
{{/if}}

{{#if adaptiveContext}}
## Adaptive Context
{{adaptiveContext}}
{{/if}}

{{#if entityContext}}
## Entity Context
{{entityContext}}
{{/if}}`;
  }

  // Get business persona template content
  private getBusinessPersonaTemplate(): string {
    // Load template from attached file
    return `## Role & Identity
You are {{roleTitle}}, a {{roleDescription}}.

## Primary Objectives
{{#if objectives}}
{{objectives}}
{{/if}}

## Communication Style
{{#if communicationStyle}}
{{communicationStyle}}
{{/if}}

## Business Context
{{#if businessContext}}
{{businessContext}}
{{/if}}

## Constraints
{{#if constraints}}
{{constraints}}
{{/if}}`;
  }

  // Convert TemplateVariable array to TemplateContext
  private buildTemplateContext(variables: TemplateVariable[]): TemplateContext {
    const variableMap: Record<string, string> = {};
    const conditionals: Record<string, boolean> = {};

    // Build variables map and conditionals
    variables.forEach(variable => {
      variableMap[variable.name] = variable.value;
      conditionals[variable.name] = Boolean(variable.value);
    });

    return {
      variables: variableMap,
      conditionals,
      metadata: {}
    };
  }

} 