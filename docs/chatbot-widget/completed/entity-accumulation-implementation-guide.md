# Entity Accumulation Enhancement - @golden-rule Implementation Guide

## Overview

**Problem**: Currently, extracted entities from OpenAI API calls are not accumulated across conversation turns. When a user mentions "Jane Doe-President" in one message and "John Smith-CEO" in another, only the most recent extraction is retained, losing valuable conversation context.

**Solution**: Implement entity accumulation in session context using DDD patterns, leveraging existing JSONB storage in `chat_sessions.context_data`.

## Domain Analysis

### Bounded Context
- **Domain**: chatbot-widget
- **Aggregate**: ChatSession (existing)
- **Value Objects**: AccumulatedEntities (new), EntityWithMetadata (new)
- **Domain Services**: EntityAccumulationService (new)

### Business Rules
1. **Additive Arrays**: `decisionMakers`, `painPoints`, `integrationNeeds`, `evaluationCriteria` accumulate over time
2. **Replaceable Singles**: `urgency`, `timeline`, `contactMethod`, `budget` use latest value
3. **Confidence-Based**: `role`, `industry`, `companySize` keep highest confidence value
4. **Deduplication**: Smart deduplication for array entities using normalization
5. **Metadata Tracking**: Track extraction timestamp, confidence, source message for each entity
6. **Entity Corrections**: Support removal and correction of previously extracted entities

## Architecture Implementation

### 1. Domain Layer Extensions

#### New Value Objects

```typescript
// lib/chatbot-widget/domain/value-objects/entity-management/AccumulatedEntities.ts
/**
 * Accumulated Entities Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing accumulated conversation entities
 * - Handle entity lifecycle management with metadata tracking
 * - Support different accumulation strategies per entity type
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 */

export interface EntityWithMetadata<T> {
  value: T;
  extractedAt: Date;
  confidence: number;
  sourceMessageId: string;
  extractionMethod: 'ai' | 'explicit' | 'inferred';
}

export interface AccumulatedEntitiesProps {
  // Additive array entities
  decisionMakers: EntityWithMetadata<string>[];
  painPoints: EntityWithMetadata<string>[];
  integrationNeeds: EntityWithMetadata<string>[];
  evaluationCriteria: EntityWithMetadata<string>[];
  
  // Latest value entities
  budget: EntityWithMetadata<string> | null;
  timeline: EntityWithMetadata<string> | null;
  urgency: EntityWithMetadata<'low'|'medium'|'high'> | null;
  contactMethod: EntityWithMetadata<'email'|'phone'|'meeting'> | null;
  
  // Confidence-based entities
  role: EntityWithMetadata<string> | null;
  industry: EntityWithMetadata<string> | null;
  company: EntityWithMetadata<string> | null;
  teamSize: EntityWithMetadata<string> | null;
  
  // Metadata
  lastUpdated: Date;
  totalExtractions: number;
}

export class AccumulatedEntities {
  private constructor(private readonly props: AccumulatedEntitiesProps) {}
  
  static create(props?: Partial<AccumulatedEntitiesProps>): AccumulatedEntities {
    return new AccumulatedEntities({
      decisionMakers: [],
      painPoints: [],
      integrationNeeds: [],
      evaluationCriteria: [],
      budget: null,
      timeline: null,
      urgency: null,
      contactMethod: null,
      role: null,
      industry: null,
      company: null,
      teamSize: null,
      lastUpdated: new Date(),
      totalExtractions: 0,
      ...props
    });
  }
  
  // Business methods for entity accumulation
  withAdditiveEntity(
    entityType: 'decisionMakers'|'painPoints'|'integrationNeeds'|'evaluationCriteria',
    newValues: string[],
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const existingEntities = this.props[entityType];
    const newEntities = newValues.map(value => ({
      value,
      extractedAt: new Date(),
      confidence,
      sourceMessageId: messageId,
      extractionMethod: 'ai' as const
    }));
    
    const mergedEntities = this.deduplicateArray([...existingEntities, ...newEntities]);
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: mergedEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + newValues.length
    });
  }
  
  withReplaceableEntity(
    entityType: 'budget'|'timeline'|'urgency'|'contactMethod',
    value: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const entityWithMetadata = {
      value,
      extractedAt: new Date(),
      confidence,
      sourceMessageId: messageId,
      extractionMethod: 'ai' as const
    };
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityWithMetadata,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }
  
  withConfidenceBasedEntity(
    entityType: 'role'|'industry'|'company'|'teamSize',
    value: string,
    messageId: string,
    confidence: number = 0.9,
    confidenceThreshold: number = 0.7
  ): AccumulatedEntities {
    const existing = this.props[entityType];
    const newEntity = {
      value,
      extractedAt: new Date(),
      confidence,
      sourceMessageId: messageId,
      extractionMethod: 'ai' as const
    };
    
    const entityToKeep = existing && existing.confidence > confidence && existing.confidence > confidenceThreshold
      ? existing
      : newEntity;
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityToKeep,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }
  
  withRemovedEntity(
    entityType: 'decisionMakers'|'painPoints'|'integrationNeeds'|'evaluationCriteria',
    valueToRemove: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const existingEntities = this.props[entityType];
    const normalizedRemoval = this.normalizeEntityValue(valueToRemove);
    
    const filteredEntities = existingEntities.filter(entity => {
      const normalizedExisting = this.normalizeEntityValue(entity.value);
      return normalizedExisting !== normalizedRemoval;
    });
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: filteredEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }
  
  withCorrectedEntity(
    entityType: 'budget'|'timeline'|'urgency'|'contactMethod'|'role'|'industry'|'company'|'teamSize',
    value: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const entityWithMetadata = {
      value,
      extractedAt: new Date(),
      confidence,
      sourceMessageId: messageId,
      extractionMethod: 'ai' as const
    };
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityWithMetadata,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }
  
  private deduplicateArray(entities: EntityWithMetadata<string>[]): EntityWithMetadata<string>[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const normalized = entity.value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
  
  // Getters and serialization methods
  get decisionMakers(): EntityWithMetadata<string>[] { return [...this.props.decisionMakers]; }
  get painPoints(): EntityWithMetadata<string>[] { return [...this.props.painPoints]; }
  get integrationNeeds(): EntityWithMetadata<string>[] { return [...this.props.integrationNeeds]; }
  get evaluationCriteria(): EntityWithMetadata<string>[] { return [...this.props.evaluationCriteria]; }
  get budget(): EntityWithMetadata<string> | null { return this.props.budget; }
  get timeline(): EntityWithMetadata<string> | null { return this.props.timeline; }
  get urgency(): EntityWithMetadata<'low'|'medium'|'high'> | null { return this.props.urgency; }
  get contactMethod(): EntityWithMetadata<'email'|'phone'|'meeting'> | null { return this.props.contactMethod; }
  get role(): EntityWithMetadata<string> | null { return this.props.role; }
  get industry(): EntityWithMetadata<string> | null { return this.props.industry; }
  get company(): EntityWithMetadata<string> | null { return this.props.company; }
  get teamSize(): EntityWithMetadata<string> | null { return this.props.teamSize; }
  
  toPlainObject(): AccumulatedEntitiesProps {
    return { ...this.props };
  }
  
  static fromPlainObject(props: AccumulatedEntitiesProps): AccumulatedEntities {
    return new AccumulatedEntities(props);
  }
}
```

#### Domain Service

```typescript
// lib/chatbot-widget/domain/services/entity-management/EntityAccumulationService.ts
/**
 * Entity Accumulation Service
 * 
 * AI INSTRUCTIONS:
 * - Domain service for entity accumulation business logic
 * - Handle entity merging strategies and conflict resolution
 * - Maintain single responsibility for entity lifecycle management
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 * - Use domain-specific errors for validation failures
 */

import { AccumulatedEntities } from '../../value-objects/entity-management/AccumulatedEntities';
import { ExtractedEntities } from '../../value-objects/message-processing/IntentResult';
import { DomainConstants } from '../../value-objects/ai-configuration/DomainConstants';

export interface EntityMergeContext {
  messageId: string;
  defaultConfidence: number;
  enableDeduplication: boolean;
  confidenceThreshold: number;
}

export interface EntityCorrections {
  removedDecisionMakers?: string[];
  removedPainPoints?: string[];
  removedIntegrationNeeds?: string[];
  removedEvaluationCriteria?: string[];
  correctedBudget?: string;
  correctedTimeline?: string;
  correctedUrgency?: 'low'|'medium'|'high';
  correctedContactMethod?: 'email'|'phone'|'meeting';
  correctedRole?: string;
  correctedIndustry?: string;
  correctedCompany?: string;
  correctedTeamSize?: string;
}

export class EntityAccumulationService {
  
  /**
   * Merge fresh extracted entities with accumulated entities (including corrections)
   */
  static mergeEntitiesWithCorrections(
    existingEntities: AccumulatedEntities | null,
    freshEntities: ExtractedEntities & { corrections?: EntityCorrections },
    context: EntityMergeContext
  ): AccumulatedEntities {
    const accumulated = existingEntities || AccumulatedEntities.create();
    let result = accumulated;
    
    // Process removals first
    if (freshEntities.corrections) {
      result = this.processEntityRemovals(result, freshEntities.corrections, context);
    }
    
    // Process corrections
    if (freshEntities.corrections) {
      result = this.processEntityCorrections(result, freshEntities.corrections, context);
    }
    
    // Then process normal additions/updates
    result = this.processStandardEntities(result, freshEntities, context);
    
    return result;
  }
  
  /**
   * Legacy method for backward compatibility
   */
  static mergeEntities(
    existingEntities: AccumulatedEntities | null,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    return this.mergeEntitiesWithCorrections(existingEntities, freshEntities, context);
  }
  
  /**
   * Process entity removals
   */
  private static processEntityRemovals(
    accumulated: AccumulatedEntities,
    corrections: EntityCorrections,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    if (corrections.removedDecisionMakers?.length) {
      for (const removed of corrections.removedDecisionMakers) {
        result = result.withRemovedEntity('decisionMakers', removed, context.messageId, context.defaultConfidence);
      }
    }
    
    if (corrections.removedPainPoints?.length) {
      for (const removed of corrections.removedPainPoints) {
        result = result.withRemovedEntity('painPoints', removed, context.messageId, context.defaultConfidence);
      }
    }
    
    if (corrections.removedIntegrationNeeds?.length) {
      for (const removed of corrections.removedIntegrationNeeds) {
        result = result.withRemovedEntity('integrationNeeds', removed, context.messageId, context.defaultConfidence);
      }
    }
    
    if (corrections.removedEvaluationCriteria?.length) {
      for (const removed of corrections.removedEvaluationCriteria) {
        result = result.withRemovedEntity('evaluationCriteria', removed, context.messageId, context.defaultConfidence);
      }
    }
    
    return result;
  }
  
  /**
   * Process entity corrections
   */
  private static processEntityCorrections(
    accumulated: AccumulatedEntities,
    corrections: EntityCorrections,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    if (corrections.correctedBudget) {
      result = result.withCorrectedEntity('budget', corrections.correctedBudget, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedTimeline) {
      result = result.withCorrectedEntity('timeline', corrections.correctedTimeline, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedUrgency) {
      result = result.withCorrectedEntity('urgency', corrections.correctedUrgency, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedContactMethod) {
      result = result.withCorrectedEntity('contactMethod', corrections.correctedContactMethod, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedRole) {
      result = result.withCorrectedEntity('role', corrections.correctedRole, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedIndustry) {
      result = result.withCorrectedEntity('industry', corrections.correctedIndustry, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedCompany) {
      result = result.withCorrectedEntity('company', corrections.correctedCompany, context.messageId, context.defaultConfidence);
    }
    if (corrections.correctedTeamSize) {
      result = result.withCorrectedEntity('teamSize', corrections.correctedTeamSize, context.messageId, context.defaultConfidence);
    }
    
    return result;
  }
  
  /**
   * Process standard entity additions/updates
   */
  private static processStandardEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    // Process additive array entities
    if (freshEntities.decisionMakers?.length) {
      result = result.withAdditiveEntity('decisionMakers', freshEntities.decisionMakers, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.painPoints?.length) {
      result = result.withAdditiveEntity('painPoints', freshEntities.painPoints, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.integrationNeeds?.length) {
      result = result.withAdditiveEntity('integrationNeeds', freshEntities.integrationNeeds, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.evaluationCriteria?.length) {
      result = result.withAdditiveEntity('evaluationCriteria', freshEntities.evaluationCriteria, context.messageId, context.defaultConfidence);
    }
    
    // Process replaceable entities
    if (freshEntities.budget) {
      result = result.withReplaceableEntity('budget', freshEntities.budget, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.timeline) {
      result = result.withReplaceableEntity('timeline', freshEntities.timeline, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.urgency) {
      result = result.withReplaceableEntity('urgency', freshEntities.urgency, context.messageId, context.defaultConfidence);
    }
    if (freshEntities.contactMethod) {
      result = result.withReplaceableEntity('contactMethod', freshEntities.contactMethod, context.messageId, context.defaultConfidence);
    }
    
    // Process confidence-based entities
    if (freshEntities.role) {
      result = result.withConfidenceBasedEntity('role', freshEntities.role, context.messageId, context.defaultConfidence, context.confidenceThreshold);
    }
    if (freshEntities.industry) {
      result = result.withConfidenceBasedEntity('industry', freshEntities.industry, context.messageId, context.defaultConfidence, context.confidenceThreshold);
    }
    if (freshEntities.company) {
      result = result.withConfidenceBasedEntity('company', freshEntities.company, context.messageId, context.defaultConfidence, context.confidenceThreshold);
    }
    if (freshEntities.teamSize) {
      result = result.withConfidenceBasedEntity('teamSize', freshEntities.teamSize, context.messageId, context.defaultConfidence, context.confidenceThreshold);
    }
    
    return result;
  }
  
  /**
   * Build entity context for AI prompts
   */
  static buildEntityContextPrompt(entities: AccumulatedEntities): string {
    const contextParts: string[] = [];
    
    if (entities.decisionMakers.length > 0) {
      const makers = entities.decisionMakers.map(dm => dm.value).join(', ');
      contextParts.push(`Decision makers identified: ${makers}`);
    }
    
    if (entities.painPoints.length > 0) {
      const points = entities.painPoints.map(pp => pp.value).join(', ');
      contextParts.push(`Pain points mentioned: ${points}`);
    }
    
    if (entities.integrationNeeds.length > 0) {
      const needs = entities.integrationNeeds.map(in => in.value).join(', ');
      contextParts.push(`Integration needs: ${needs}`);
    }
    
    if (entities.budget) {
      const age = this.getEntityAge(entities.budget.extractedAt);
      contextParts.push(`Budget mentioned: ${entities.budget.value} (${age})`);
    }
    
    if (entities.timeline) {
      const age = this.getEntityAge(entities.timeline.extractedAt);
      contextParts.push(`Timeline mentioned: ${entities.timeline.value} (${age})`);
    }
    
    if (entities.role) {
      contextParts.push(`User role: ${entities.role.value} (confidence: ${entities.role.confidence.toFixed(2)})`);
    }
    
    if (entities.company) {
      contextParts.push(`Company: ${entities.company.value}`);
    }
    
    if (entities.teamSize) {
      contextParts.push(`Team size: ${entities.teamSize.value}`);
    }
    
    return contextParts.length > 0 
      ? `ACCUMULATED CONVERSATION CONTEXT:\n${contextParts.join('\n')}\n\n`
      : '';
  }
  
  private static getEntityAge(extractedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - extractedAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'just now';
    }
  }
}
```

### 2. Infrastructure Layer Updates

#### OpenAI Function Schema Enhancement

```typescript
// lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIFunctionSchemaBuilder.ts
// UPDATE: Extend existing buildEntityExtractionSchema method

export class OpenAIFunctionSchemaBuilder {
  
  static buildEntityExtractionWithCorrectionsSchema(): any {
    return {
      name: "extract_entities_with_corrections",
      description: "Extract entities from user message, including corrections and removals",
      parameters: {
        type: "object",
        properties: {
          // ... existing entity extraction properties ...
          
          // NEW: Corrections detection
          corrections: {
            type: "object",
            description: "Entity corrections, removals, and clarifications mentioned by user",
            properties: {
              removedDecisionMakers: {
                type: "array",
                items: { type: "string" },
                description: "People explicitly stated as NOT being decision makers or no longer involved"
              },
              removedPainPoints: {
                type: "array",
                items: { type: "string" },
                description: "Pain points explicitly stated as resolved, not applicable, or incorrect"
              },
              removedIntegrationNeeds: {
                type: "array",
                items: { type: "string" },
                description: "Integration needs explicitly stated as not needed or resolved"
              },
              removedEvaluationCriteria: {
                type: "array",
                items: { type: "string" },
                description: "Evaluation criteria explicitly stated as not important or incorrect"
              },
              correctedBudget: {
                type: "string",
                description: "Explicit budget correction (e.g., 'Actually our budget is X, not Y')"
              },
              correctedTimeline: {
                type: "string", 
                description: "Explicit timeline correction (e.g., 'I meant 6 months, not 3 months')"
              },
              correctedUrgency: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Explicit urgency correction"
              },
              correctedContactMethod: {
                type: "string",
                enum: ["email", "phone", "meeting"],
                description: "Explicit contact method correction"
              },
              correctedRole: {
                type: "string",
                description: "Explicit role correction (e.g., 'I'm actually a Director, not Manager')"
              },
              correctedIndustry: {
                type: "string",
                description: "Explicit industry correction"
              },
              correctedCompany: {
                type: "string",
                description: "Explicit company name correction"
              },
              correctedTeamSize: {
                type: "string",
                description: "Explicit team size correction"
              }
            }
          }
        },
        required: [] // corrections are optional
      }
    };
  }
}
```

#### System Prompt Enhancement

```typescript
// lib/chatbot-widget/infrastructure/providers/openai/services/OpenAIPromptBuilder.ts
// UPDATE: Add correction detection to system prompts

export class OpenAIPromptBuilder {
  
  static buildEntityExtractionPrompt(): string {
    return `
ENTITY EXTRACTION WITH CORRECTION DETECTION:

Extract entities from the user's message AND detect any corrections or removals.

REMOVAL PATTERNS TO DETECT:
- "X is NOT a decision maker" → removedDecisionMakers: ["X"]
- "Jane is no longer involved in decisions" → removedDecisionMakers: ["Jane"]
- "We don't have that integration need anymore" → removedIntegrationNeeds: [specific need]
- "That pain point doesn't apply to us" → removedPainPoints: [specific point]
- "We solved that problem already" → removedPainPoints: [specific point]

CORRECTION PATTERNS TO DETECT:
- "Actually our budget is $100K, not $50K" → correctedBudget: "$100K"
- "I misspoke, our timeline is 6 months" → correctedTimeline: "6 months"
- "Sorry, I meant John Smith, not John Jones" → handle as removal + addition
- "I'm actually a Director, not a Manager" → correctedRole: "Director"

EXAMPLES:

User: "Jane Doe is not a decision maker"
Function Call: {
  "corrections": {
    "removedDecisionMakers": ["Jane Doe"]
  }
}

User: "Actually our budget is $200K, not the $100K I mentioned before"
Function Call: {
  "corrections": {
    "correctedBudget": "$200K"
  }
}

User: "We don't need CRM integration anymore, but we do need email automation"
Function Call: {
  "integrationNeeds": ["email automation"],
  "corrections": {
    "removedIntegrationNeeds": ["CRM integration"]
  }
}

IMPORTANT: Always look for negations, corrections, and clarifications. Process corrections BEFORE additions.
`;
  }
}
```

#### Enhanced Response Processing

```typescript
// lib/chatbot-widget/application/services/ai-processing/EntityExtractionService.ts
// NEW: Service to handle API response with corrections

/**
 * Entity Extraction Service with Correction Support
 * 
 * AI INSTRUCTIONS:
 * - Handle OpenAI API responses that include corrections
 * - Process corrections before standard entity extraction
 * - Maintain proper error handling for malformed correction data
 * - Follow @golden-rule patterns exactly
 * - Keep under 200 lines with focused responsibility
 */

export interface EntityExtractionResult {
  entities: ExtractedEntities;
  corrections?: EntityCorrections;
  confidence: number;
  processingMetadata: {
    hadCorrections: boolean;
    correctionTypes: string[];
    extractionTimestamp: Date;
  };
}

export class EntityExtractionService {
  
  static async extractEntitiesWithCorrections(
    message: string,
    conversationContext: string,
    config: ChatbotConfig
  ): Promise<EntityExtractionResult> {
    try {
      const openaiService = ChatbotCompositionRoot.getOpenAIService();
      
      const response = await openaiService.callFunction({
        messages: [
          {
            role: 'system',
            content: OpenAIPromptBuilder.buildEntityExtractionPrompt()
          },
          {
            role: 'user', 
            content: `Context: ${conversationContext}\n\nUser Message: ${message}`
          }
        ],
        functions: [OpenAIFunctionSchemaBuilder.buildEntityExtractionWithCorrectionsSchema()],
        function_call: { name: "extract_entities_with_corrections" },
        model: config.aiModel || DomainConstants.DEFAULT_MODELS.entityExtraction,
        temperature: 0.3,
        max_tokens: 800
      });
      
      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall?.arguments) {
        throw new BusinessRuleViolationError(
          'No function call response received from OpenAI',
          { message, response: response.choices[0] }
        );
      }
      
      const parsedData = JSON.parse(functionCall.arguments);
      
      return {
        entities: this.extractStandardEntities(parsedData),
        corrections: parsedData.corrections || undefined,
        confidence: this.calculateExtractionConfidence(parsedData),
        processingMetadata: {
          hadCorrections: !!parsedData.corrections,
          correctionTypes: this.identifyCorrectionTypes(parsedData.corrections),
          extractionTimestamp: new Date()
        }
      };
      
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        'Entity extraction with corrections failed',
        { message, error: error.message }
      );
    }
  }
  
  private static extractStandardEntities(parsedData: any): ExtractedEntities {
    return {
      decisionMakers: parsedData.decisionMakers || [],
      painPoints: parsedData.painPoints || [],
      integrationNeeds: parsedData.integrationNeeds || [],
      evaluationCriteria: parsedData.evaluationCriteria || [],
      budget: parsedData.budget || null,
      timeline: parsedData.timeline || null,
      urgency: parsedData.urgency || null,
      contactMethod: parsedData.contactMethod || null,
      role: parsedData.role || null,
      industry: parsedData.industry || null,
      company: parsedData.company || null,
      teamSize: parsedData.teamSize || null
    };
  }
  
  private static calculateExtractionConfidence(parsedData: any): number {
    // Calculate confidence based on number of extracted entities and correction clarity
    const entityCount = Object.values(parsedData).filter(v => v !== null && v !== undefined).length;
    const correctionCount = parsedData.corrections ? 
      Object.values(parsedData.corrections).filter(v => v !== null && v !== undefined).length : 0;
    
    const baseConfidence = Math.min(0.9, 0.7 + (entityCount * 0.05));
    const correctionBonus = correctionCount > 0 ? 0.1 : 0; // Higher confidence when user makes corrections
    
    return Math.min(0.95, baseConfidence + correctionBonus);
  }
  
  private static identifyCorrectionTypes(corrections?: EntityCorrections): string[] {
    if (!corrections) return [];
    
    const types: string[] = [];
    
    Object.entries(corrections).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key.startsWith('removed')) {
          types.push('removal');
        } else if (key.startsWith('corrected')) {
          types.push('correction');
        }
      }
    });
    
    return Array.from(new Set(types));
  }
}
```

#### SessionContext Extension

```typescript
// lib/chatbot-widget/domain/value-objects/session-management/ChatSessionTypes.ts
// UPDATE: Extend existing SessionContext interface

export interface SessionContext {
  // ... existing fields
  visitorName?: string;
  email?: string;
  phone?: string;
  company?: string;
  previousVisits: number;
  pageViews: PageView[];
  conversationSummary: string;
  topics: string[];
  interests: string[];
  engagementScore: number;
  journeyState?: {
    stage: string;
    confidence: number;
    metadata: any;
  };
  
  // ADD: Entity accumulation
  accumulatedEntities?: AccumulatedEntitiesProps;
}
```

#### Session Context Service Update

```typescript
// lib/chatbot-widget/domain/services/session-management/SessionContextService.ts
// ADD: New methods for entity management

import { AccumulatedEntities, AccumulatedEntitiesProps } from '../../value-objects/entity-management/AccumulatedEntities';

/**
 * ADD to existing SessionContextService class
 */
export class SessionContextService {
  // ... existing methods
  
  /**
   * Update accumulated entities in session context
   */
  static updateAccumulatedEntities(
    context: SessionContext,
    accumulatedEntities: AccumulatedEntities
  ): SessionContext {
    return {
      ...context,
      accumulatedEntities: accumulatedEntities.toPlainObject()
    };
  }
  
  /**
   * Get accumulated entities from session context
   */
  static getAccumulatedEntities(context: SessionContext): AccumulatedEntities {
    return context.accumulatedEntities 
      ? AccumulatedEntities.fromPlainObject(context.accumulatedEntities)
      : AccumulatedEntities.create();
  }
  
  /**
   * Initialize empty accumulated entities
   */
  static initializeAccumulatedEntities(context: SessionContext): SessionContext {
    if (context.accumulatedEntities) {
      return context; // Already initialized
    }
    
    return {
      ...context,
      accumulatedEntities: AccumulatedEntities.create().toPlainObject()
    };
  }
}
```

### 3. Application Layer Integration

#### Updated Use Case Integration

```typescript
// lib/chatbot-widget/application/use-cases/ProcessMessageUseCase.ts  
// UPDATE: Integrate entity corrections processing

export class ProcessMessageUseCase {
  
  async execute(input: ProcessMessageInput): Promise<ProcessMessageResult> {
    try {
      // ... existing message processing ...
      
      // NEW: Enhanced entity extraction with corrections
      const extractionResult = await EntityExtractionService.extractEntitiesWithCorrections(
        input.message,
        currentSession.getConversationContext(),
        config
      );
      
      if (extractionResult.corrections || Object.keys(extractionResult.entities).some(key => 
        extractionResult.entities[key] !== null && extractionResult.entities[key] !== undefined
      )) {
        // Process corrections FIRST, then accumulate new entities
        let updatedContext = currentSession.getContextData();
        
        if (extractionResult.corrections) {
          updatedContext = EntityAccumulationService.processCorrections(
            updatedContext, 
            extractionResult.corrections
          );
        }
        
        // Then accumulate new entities
        updatedContext = EntityAccumulationService.accumulateEntities(
          updatedContext,
          extractionResult.entities
        );
        
        // Update session with corrected and accumulated entities
        currentSession = currentSession.withUpdatedContext(updatedContext);
        await this.sessionRepository.save(currentSession);
        
        // Update lead score based on new accumulated data
        const leadData = LeadDataExtractorService.extractFromContext(updatedContext);
        const leadScore = LeadScoreCalculationService.calculate(leadData, config);
        
        currentSession = currentSession.withUpdatedLeadScore(leadScore);
        await this.sessionRepository.save(currentSession);
      }
      
      // ... rest of existing processing ...
      
      return {
        response: responseText,
        sessionId: currentSession.id,
        extractionMetadata: {
          ...extractionResult.processingMetadata,
          finalEntityCount: Object.keys(currentSession.getContextData().accumulatedEntities || {}).length
        }
      };
      
    } catch (error) {
      // ... existing error handling ...
    }
  }
}
```

#### Enhanced Debug Information Service

```typescript
// lib/chatbot-widget/application/services/debug/DebugInfoService.ts
// UPDATE: Include correction history in debug information

export class DebugInfoService {
  
  static buildDebugInfo(session: ChatSession, config: ChatbotConfig): DebugInfo {
    const contextData = session.getContextData();
    
    return {
      // ... existing debug info ...
      
      // NEW: Correction tracking
      entityCorrections: {
        totalCorrections: contextData.correctionHistory?.length || 0,
        recentCorrections: contextData.correctionHistory?.slice(-5) || [],
        correctionTypes: this.getCorrectionTypes(contextData.correctionHistory || []),
        lastCorrectionTimestamp: contextData.correctionHistory?.[0]?.timestamp
      },
      
      // ENHANCED: Entity accumulation with correction context
      entityAccumulation: {
        totalEntities: Object.keys(contextData.accumulatedEntities || {}).length,
        entitiesByCategory: this.categorizeAccumulatedEntities(contextData.accumulatedEntities),
        accumlationStrategy: this.getAccumulationStrategies(),
        lastUpdateTimestamp: contextData.lastEntityUpdate,
        correctionImpactedEntities: this.getEntitiesAffectedByCorrections(
          contextData.accumulatedEntities, 
          contextData.correctionHistory || []
        )
      }
    };
  }
  
  private static getCorrectionTypes(corrections: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    corrections.forEach(correction => {
      correction.correctionTypes?.forEach((type: string) => {
        types[type] = (types[type] || 0) + 1;
      });
    });
    
    return types;
  }
  
  private static getEntitiesAffectedByCorrections(
    entities: any, 
    corrections: any[]
  ): string[] {
    const affectedEntities: Set<string> = new Set();
    
    corrections.forEach(correction => {
      Object.keys(correction.corrections || {}).forEach(key => {
        if (key.includes('removed') || key.includes('corrected')) {
          const entityType = key.replace('removed', '').replace('corrected', '');
          affectedEntities.add(entityType);
        }
      });
    });
    
    return Array.from(affectedEntities);
  }
}
```

#### Enhanced Context Analysis

```typescript
// lib/chatbot-widget/domain/services/conversation/ConversationEnhancedAnalysisService.ts
// UPDATE: Add entity accumulation to existing service

/**
 * ADD to existing ConversationEnhancedAnalysisService class
 */
export class ConversationEnhancedAnalysisService {
  // ... existing methods
  
  /**
   * Enhanced analysis with entity accumulation
   */
  async enhanceAnalysisWithEntityAccumulation(
    baseAnalysis: ContextAnalysis,
    messages: ChatMessage[],
    chatbotConfig?: ChatbotConfig,
    session?: ChatSession
  ): Promise<ContextAnalysis> {
    const enhancedAnalysis = await this.enhanceAnalysis(
      baseAnalysis, 
      messages, 
      chatbotConfig, 
      session
    );
    
    // Add entity accumulation if we have fresh entities
    if (enhancedAnalysis.intentResult?.entities && session) {
      const accumulatedEntities = this.accumulateEntities(
        session,
        enhancedAnalysis.intentResult.entities,
        messages[messages.length - 1]?.id || 'unknown'
      );
      
      return {
        ...enhancedAnalysis,
        accumulatedEntities: accumulatedEntities.toPlainObject()
      };
    }
    
    return enhancedAnalysis;
  }
  
  /**
   * Accumulate entities from fresh extraction
   */
  private accumulateEntities(
    session: ChatSession,
    freshEntities: ExtractedEntities,
    messageId: string
  ): AccumulatedEntities {
    const existingEntities = SessionContextService.getAccumulatedEntities(session.contextData);
    
    const mergeContext: EntityMergeContext = {
      messageId,
      defaultConfidence: 0.9,
      enableDeduplication: true,
      confidenceThreshold: DomainConstants.DEFAULT_THRESHOLDS.personaInference
    };
    
    return EntityAccumulationService.mergeEntitiesWithCorrections(
      existingEntities,
      freshEntities,
      mergeContext
    );
  }
}
```

#### System Prompt Enhancement

```typescript
// lib/chatbot-widget/application/services/conversation-management/SystemPromptBuilderService.ts
// UPDATE: Include accumulated entities in system prompts

/**
 * UPDATE existing buildEnhancedSystemPrompt method
 */
export class SystemPromptBuilderService {
  buildEnhancedSystemPrompt(
    config: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    enhancedContext: EnhancedContext
  ): string {
    // Start with base system prompt
    let systemPrompt = this.aiConversationService.buildSystemPrompt(config, session, messageHistory);
    
    // Add accumulated entities context
    const accumulatedEntities = SessionContextService.getAccumulatedEntities(session.contextData);
    const entityContext = EntityAccumulationService.buildEntityContextPrompt(accumulatedEntities);
    
    if (entityContext) {
      systemPrompt += `\n\n${entityContext}`;
      systemPrompt += `IMPORTANT: When extracting entities, consider this accumulated context.\n`;
      systemPrompt += `- For array entities (decisionMakers, painPoints), add to existing list rather than replace\n`;
      systemPrompt += `- For single entities (budget, timeline), latest information typically overrides previous\n`;
      systemPrompt += `- Note any conflicts or updates to previously mentioned information\n\n`;
    }
    
    // Add existing intent context logic...
    if (enhancedContext.intentResult) {
      // ... existing implementation
    }
    
    return systemPrompt;
  }
}
```

## Implementation Plan

### Phase 1: Domain Foundation (1-2 days)
1. Create `AccumulatedEntities` value object with correction methods
2. Create `EntityAccumulationService` domain service with correction support
3. Extend `SessionContext` interface
4. Add entity management methods to `SessionContextService`
5. Write comprehensive unit tests for domain logic including corrections

### Phase 2: Application Integration (1-2 days)
1. Update `ConversationEnhancedAnalysisService` with entity accumulation
2. Enhance `ConversationSessionUpdateService` to handle accumulated entities
3. Modify `SystemPromptBuilderService` to include entity context
4. Update conversation orchestration to use new accumulation flow
5. Write integration tests for application services

### Phase 2.5: Entity Corrections Support (0.5 days)
1. **Extend OpenAI function schema** to detect entity corrections and removals
2. **Update system prompts** to detect correction patterns in user messages  
3. **Enhance response processing** to handle corrections field from API
4. **Update entity processing** to handle corrections before additions
5. **Add test cases** for correction scenarios ("Jane is not a decision maker")
6. **Update debug UI** to show correction history

### Phase 3: Presentation Enhancements (1 day)
1. Create `AccumulatedEntitiesDisplay` debug component with correction history
2. Integrate accumulated entities into existing debug panels
3. Update debug data enrichment services
4. Test UI components with accumulated entity data and corrections

### Phase 4: Testing & Validation (1 day)
1. End-to-end testing of entity accumulation flow including corrections
2. Validate JSONB storage and retrieval with correction metadata
3. Performance testing with large entity sets and correction history
4. User acceptance testing with conversation scenarios including corrections

## Testing Strategy

### Unit Tests
```typescript
// lib/chatbot-widget/domain/value-objects/entity-management/__tests__/AccumulatedEntities.test.ts
describe('AccumulatedEntities', () => {
  describe('withAdditiveEntity', () => {
    it('should accumulate decision makers without duplication', () => {
      const entities = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Smith-CEO'], 'msg1', 0.9)
        .withAdditiveEntity('decisionMakers', ['Jane Doe-President'], 'msg2', 0.9);
      
      expect(entities.decisionMakers).toHaveLength(2);
      expect(entities.decisionMakers.map(dm => dm.value)).toEqual([
        'John Smith-CEO', 
        'Jane Doe-President'
      ]);
    });
    
    it('should deduplicate similar names', () => {
      const entities = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Smith'], 'msg1', 0.9)
        .withAdditiveEntity('decisionMakers', ['john smith'], 'msg2', 0.9);
      
      expect(entities.decisionMakers).toHaveLength(1);
    });
  });
  
  describe('withRemovedEntity', () => {
    it('should remove specified decision maker', () => {
      const entities = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Smith-CEO', 'Jane Doe-President'], 'msg1', 0.9)
        .withRemovedEntity('decisionMakers', 'Jane Doe-President', 'msg2', 0.9);
      
      expect(entities.decisionMakers).toHaveLength(1);
      expect(entities.decisionMakers[0].value).toBe('John Smith-CEO');
    });
    
    it('should handle case-insensitive removal', () => {
      const entities = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Smith'], 'msg1', 0.9)
        .withRemovedEntity('decisionMakers', 'john smith', 'msg2', 0.9);
      
      expect(entities.decisionMakers).toHaveLength(0);
    });
  });
  
  describe('withReplaceableEntity', () => {
    it('should replace budget with latest value', () => {
      const entities = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '$50K', 'msg1', 0.9)
        .withReplaceableEntity('budget', '$75K', 'msg2', 0.9);
      
      expect(entities.budget?.value).toBe('$75K');
    });
  });
  
  describe('withCorrectedEntity', () => {
    it('should correct budget regardless of previous confidence', () => {
      const entities = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '$50K', 'msg1', 0.95)
        .withCorrectedEntity('budget', '$75K', 'msg2', 0.8);
      
      expect(entities.budget?.value).toBe('$75K');
      expect(entities.budget?.confidence).toBe(0.8);
    });
  });
  
  describe('withConfidenceBasedEntity', () => {
    it('should keep higher confidence role', () => {
      const entities = AccumulatedEntities.create()
        .withConfidenceBasedEntity('role', 'Manager', 'msg1', 0.95)
        .withConfidenceBasedEntity('role', 'Director', 'msg2', 0.7);
      
      expect(entities.role?.value).toBe('Manager');
      expect(entities.role?.confidence).toBe(0.95);
    });
  });
});

// lib/chatbot-widget/domain/services/entity-management/__tests__/EntityAccumulationService.test.ts
describe('EntityAccumulationService', () => {
  describe('mergeEntitiesWithCorrections', () => {
    it('should process removals before additions', () => {
      const existing = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Smith', 'Jane Doe'], 'msg1', 0.9);
      
      const freshEntities = {
        decisionMakers: ['Bob Wilson'],
        corrections: {
          removedDecisionMakers: ['Jane Doe']
        }
      };
      
      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        existing,
        freshEntities,
        { messageId: 'msg2', defaultConfidence: 0.9, enableDeduplication: true, confidenceThreshold: 0.7 }
      );
      
      expect(result.decisionMakers).toHaveLength(2);
      expect(result.decisionMakers.map(dm => dm.value)).toEqual(['John Smith', 'Bob Wilson']);
    });
    
    it('should handle corrections for single-value entities', () => {
      const existing = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '$50K', 'msg1', 0.9);
      
      const freshEntities = {
        corrections: {
          correctedBudget: '$100K'
        }
      };
      
      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        existing,
        freshEntities,
        { messageId: 'msg2', defaultConfidence: 0.9, enableDeduplication: true, confidenceThreshold: 0.7 }
      );
      
      expect(result.budget?.value).toBe('$100K');
    });
  });
});
```

## Benefits

### Business Value
- **Complete Lead Context**: Full conversation context preserved for better lead scoring
- **Reduced Friction**: No repeated questions about previously mentioned information
- **Better Analytics**: Rich entity data for reporting and insights
- **Improved AI Responses**: Context-aware responses based on accumulated knowledge

### Technical Benefits
- **Leverages Existing Infrastructure**: Uses current JSONB storage without schema changes
- **DDD Compliance**: Follows @golden-rule patterns with proper layer separation
- **Type Safety**: Full TypeScript support with domain-specific types
- **Scalable Design**: Efficient entity storage and retrieval with metadata tracking

## Migration Notes

### Database Considerations
- **No Schema Changes Required**: Uses existing `context_data` JSONB column
- **Backward Compatibility**: Existing sessions without `accumulatedEntities` work normally
- **Performance**: JSONB operations are efficient for entity data size
- **Indexing**: Consider adding GIN index on `context_data` if needed for entity queries

### Rollout Strategy
1. **A/B Testing**: Compare conversations with/without entity accumulation
2. **Monitoring**: Track entity accumulation performance and storage impact
3. **Gradual Enablement**: Enable for subset of chatbot configs initially

This implementation provides a robust, DDD-compliant solution for entity accumulation that leverages existing infrastructure while providing significant business value through improved conversation context management. 