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
 * Dynamic Prompt Application Service - 2025 RAG-Optimized with Template Engine
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate domain services and template engine for prompt generation
 * - Maintain single responsibility for prompt coordination
 * - No business logic - delegate to domain services and templates
 * - Follow @golden-rule patterns exactly
 * - Use template engine instead of hardcoded string concatenation
 * - Maintains business context even during casual conversation
 * - Implements conversation-aware context prediction
 * - Maintains 500-800 token target through RAG optimization (60% reduction)
 * - Vector search handles FAQs, product catalogs, and detailed content
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


  // Generate system prompt with 2025 semantic intent classification using templates
  generateSystemPrompt(
    chatbotConfig: ChatbotConfig, 
    session: ChatSession,
    conversationHistory?: ChatMessage[],
    entityData?: any,
    leadScore?: number,
    qualificationStatus?: string,
    intentData?: any
  ): string {
    // AI: Analyze conversation using extracted entities and intent (no re-processing)
    const analysis = this.conversationAnalysisService.analyzeConversationContext(
      session, 
      conversationHistory, 
      entityData,
      intentData,
      leadScore
    );

    // AI: Generate prompt sections from all services
    const promptSections = this.generatePromptSections(
      chatbotConfig,
      session,
      analysis,
      entityData,
      leadScore
    );

    // AI: Use coordination services to optimize and deduplicate
    const coordinatedResult = this.coordinatePromptSections(promptSections);

    // AI: Convert coordinated sections back to template variables
    const templateVariables = this.convertSectionsToTemplateVariables(coordinatedResult.sections);

    // AI: Use template engine to generate complete system prompt
    const systemPromptTemplate = this.getSystemPromptTemplate();
    const templateContext = this.buildTemplateContext(templateVariables);
    
    const processedTemplate = this.templateEngine.processTemplate(
      'system-prompt',
      systemPromptTemplate,
      templateContext
    );
    
    return processedTemplate.content;
  }

  // AI: Generate prompt sections from all services (new coordination approach)
  private generatePromptSections(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: any,
    entityData?: any,
    leadScore?: number
  ): PromptSection[] {
    const sections: PromptSection[] = [];

    // AI: Generate persona section
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

    // AI: Generate knowledge base section
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

    // AI: Generate business guidance section
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

    // AI: Generate adaptive context section
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

    // AI: Add entity context if available
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

  // AI: Coordinate prompt sections using coordination services
  private coordinatePromptSections(sections: PromptSection[]): CoordinatedPromptResult {
    // AI: Group sections by service for coordination
    const sectionsByService = new Map<ServiceIdentifier, PromptSection[]>();
    
    for (const section of sections) {
      const existing = sectionsByService.get(section.serviceId) || [];
      existing.push(section);
      sectionsByService.set(section.serviceId, existing);
    }

    // AI: Apply prompt coordination with deduplication
    return this.promptCoordinationService.coordinatePromptSections(sectionsByService, {
      enableDeduplication: true,
      conflictResolutionStrategy: 'highest_priority' as any,
      maxSectionsPerService: 5,
      preserveOriginalOrder: false
    });
  }

  // AI: Convert coordinated sections back to template variables
  private convertSectionsToTemplateVariables(sections: readonly PromptSection[]): TemplateVariable[] {
    const variables: TemplateVariable[] = [];

    for (const section of sections) {
      // AI: Map section types to template variable names
      const variableName = this.mapSectionTypeToVariableName(section.sectionType);
      
      variables.push({
        name: variableName,
        value: section.content,
        isRequired: section.isRequired
      });
    }

    return variables;
  }

  // AI: Map section types to template variable names for backward compatibility
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

  // AI: Build all template variables for system prompt generation (legacy method - kept for compatibility)
  private buildTemplateVariables(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    analysis: any,
    entityData?: any,
    leadScore?: number
  ): TemplateVariable[] {
    const variables: TemplateVariable[] = [];

    // AI: Get persona variables from PersonaGenerationService
    const personaVariables = this.personaGenerationService.generateContextAwarePersona(chatbotConfig, analysis);
    
    // AI: Generate persona content using business persona template
    const businessPersonaTemplate = this.getBusinessPersonaTemplate();
    const personaContext = this.buildTemplateContext(personaVariables);
    
    const processedPersonaTemplate = this.templateEngine.processTemplate(
      'business-persona',
      businessPersonaTemplate,
      personaContext
    );

    // AI: Add persona content as main variable
    variables.push({
      name: 'personaContent',
      value: processedPersonaTemplate.content,
      isRequired: true
    });

    // AI: Add knowledge base content
    const knowledgeBaseContent = this.knowledgeBaseService.buildMinimalKnowledgeBase(chatbotConfig.knowledgeBase);
    if (knowledgeBaseContent) {
      variables.push({
        name: 'knowledgeBaseContent',
        value: knowledgeBaseContent,
        isRequired: false
      });
    }

    // AI: Add business guidance
    const businessGuidance = this.businessGuidanceService.generateBusinessGuidance(analysis, leadScore);
    if (businessGuidance) {
      variables.push({
        name: 'businessGuidance',
        value: businessGuidance,
        isRequired: false
      });
    }

    // AI: Add adaptive context
    const adaptiveContext = this.adaptiveContextService.generateAdaptiveContext(session, analysis, chatbotConfig);
    if (adaptiveContext) {
      variables.push({
        name: 'adaptiveContext',
        value: adaptiveContext,
        isRequired: false
      });
    }

    // AI: Add entity context if available
    if (entityData) {
      variables.push({
        name: 'entityContext',
        value: JSON.stringify(entityData, null, 2),
        isRequired: false
      });
    }

    return variables;
  }

  // AI: Get system prompt template content
  private getSystemPromptTemplate(): string {
    // AI: Load template from attached file
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

  // AI: Get business persona template content
  private getBusinessPersonaTemplate(): string {
    // AI: Load template from attached file
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

  // AI: Convert TemplateVariable array to TemplateContext
  private buildTemplateContext(variables: TemplateVariable[]): TemplateContext {
    const variableMap: Record<string, string> = {};
    const conditionals: Record<string, boolean> = {};

    // AI: Build variables map and conditionals
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