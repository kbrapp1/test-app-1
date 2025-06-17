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
  
  // Getters
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
  get lastUpdated(): Date { return this.props.lastUpdated; }
  get totalExtractions(): number { return this.props.totalExtractions; }
  
  // Business methods
  withAdditiveEntity<K extends keyof Pick<AccumulatedEntitiesProps, 'decisionMakers'|'painPoints'|'integrationNeeds'|'evaluationCriteria'>>(
    entityType: K,
    newValues: string[],
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const existingEntities = this.props[entityType] as EntityWithMetadata<string>[];
    const newEntities = newValues.map(value => this.createEntityWithMetadata(value, messageId, confidence));
    const mergedEntities = this.deduplicateArray([...existingEntities, ...newEntities]);
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: mergedEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + newValues.length
    });
  }
  
  withReplaceableEntity<K extends keyof Pick<AccumulatedEntitiesProps, 'budget'|'timeline'|'urgency'|'contactMethod'>>(
    entityType: K,
    value: string,
    messageId: string,
    confidence: number = 0.9
  ): AccumulatedEntities {
    const entityWithMetadata = this.createEntityWithMetadata(value, messageId, confidence);
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityWithMetadata,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }
  
  withConfidenceBasedEntity<K extends keyof Pick<AccumulatedEntitiesProps, 'role'|'industry'|'company'|'teamSize'>>(
    entityType: K,
    value: string,
    messageId: string,
    confidence: number = 0.9,
    confidenceThreshold: number = 0.7
  ): AccumulatedEntities {
    const existing = this.props[entityType] as EntityWithMetadata<string> | null;
    const newEntity = this.createEntityWithMetadata(value, messageId, confidence);
    
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
  
  // Private helpers
  private createEntityWithMetadata<T>(
    value: T, 
    messageId: string, 
    confidence: number
  ): EntityWithMetadata<T> {
    return {
      value,
      extractedAt: new Date(),
      confidence,
      sourceMessageId: messageId,
      extractionMethod: 'ai'
    };
  }
  
  private deduplicateArray(entities: EntityWithMetadata<string>[]): EntityWithMetadata<string>[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const normalized = this.normalizeEntityValue(entity.value);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
  
  private normalizeEntityValue(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }
  
  // Serialization
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
import { BusinessRuleViolationError } from '../../errors/BusinessRuleViolationError';
import { DomainConstants } from '../../value-objects/ai-configuration/DomainConstants';

export interface EntityMergeContext {
  messageId: string;
  defaultConfidence: number;
  enableDeduplication: boolean;
  confidenceThreshold: number;
}

export class EntityAccumulationService {
  
  /**
   * Merge fresh extracted entities with accumulated entities
   */
  static mergeEntities(
    existingEntities: AccumulatedEntities | null,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    const accumulated = existingEntities || AccumulatedEntities.create();
    let result = accumulated;
    
    // Process additive array entities
    result = this.processAdditiveEntities(result, freshEntities, context);
    
    // Process replaceable entities
    result = this.processReplaceableEntities(result, freshEntities, context);
    
    // Process confidence-based entities
    result = this.processConfidenceBasedEntities(result, freshEntities, context);
    
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
  
  // Private implementation methods
  private static processAdditiveEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    if (freshEntities.decisionMakers?.length) {
      result = result.withAdditiveEntity(
        'decisionMakers',
        freshEntities.decisionMakers,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.painPoints?.length) {
      result = result.withAdditiveEntity(
        'painPoints',
        freshEntities.painPoints,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.integrationNeeds?.length) {
      result = result.withAdditiveEntity(
        'integrationNeeds',
        freshEntities.integrationNeeds,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.evaluationCriteria?.length) {
      result = result.withAdditiveEntity(
        'evaluationCriteria',
        freshEntities.evaluationCriteria,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    return result;
  }
  
  private static processReplaceableEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    if (freshEntities.budget) {
      result = result.withReplaceableEntity(
        'budget',
        freshEntities.budget,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.timeline) {
      result = result.withReplaceableEntity(
        'timeline',
        freshEntities.timeline,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.urgency) {
      result = result.withReplaceableEntity(
        'urgency',
        freshEntities.urgency,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    if (freshEntities.contactMethod) {
      result = result.withReplaceableEntity(
        'contactMethod',
        freshEntities.contactMethod,
        context.messageId,
        context.defaultConfidence
      );
    }
    
    return result;
  }
  
  private static processConfidenceBasedEntities(
    accumulated: AccumulatedEntities,
    freshEntities: ExtractedEntities,
    context: EntityMergeContext
  ): AccumulatedEntities {
    let result = accumulated;
    
    if (freshEntities.role) {
      result = result.withConfidenceBasedEntity(
        'role',
        freshEntities.role,
        context.messageId,
        context.defaultConfidence,
        context.confidenceThreshold
      );
    }
    
    if (freshEntities.industry) {
      result = result.withConfidenceBasedEntity(
        'industry',
        freshEntities.industry,
        context.messageId,
        context.defaultConfidence,
        context.confidenceThreshold
      );
    }
    
    if (freshEntities.company) {
      result = result.withConfidenceBasedEntity(
        'company',
        freshEntities.company,
        context.messageId,
        context.defaultConfidence,
        context.confidenceThreshold
      );
    }
    
    if (freshEntities.teamSize) {
      result = result.withConfidenceBasedEntity(
        'teamSize',
        freshEntities.teamSize,
        context.messageId,
        context.defaultConfidence,
        context.confidenceThreshold
      );
    }
    
    return result;
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
    
    return EntityAccumulationService.mergeEntities(
      existingEntities,
      freshEntities,
      mergeContext
    );
  }
}
```

#### Session Update Enhancement

```typescript
// lib/chatbot-widget/domain/services/conversation/ConversationSessionUpdateService.ts
// UPDATE: Add entity accumulation to session updates

/**
 * ADD to existing ConversationSessionUpdateService class
 */
export class ConversationSessionUpdateService {
  // ... existing methods
  
  /**
   * Update session with accumulated entities
   */
  updateSessionWithAccumulatedEntities(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    enhancedAnalysis: ContextAnalysis & { accumulatedEntities?: AccumulatedEntitiesProps }
  ): ChatSession {
    let updatedSession = this.updateSessionWithEnhancedAnalysis(
      session,
      message,
      allMessages,
      enhancedAnalysis
    );
    
    // Update accumulated entities if available
    if (enhancedAnalysis.accumulatedEntities) {
      const accumulatedEntities = AccumulatedEntities.fromPlainObject(
        enhancedAnalysis.accumulatedEntities
      );
      
      const updatedContext = SessionContextService.updateAccumulatedEntities(
        updatedSession.contextData,
        accumulatedEntities
      );
      
      updatedSession = ChatSession.fromPersistence({
        ...updatedSession.toPlainObject(),
        contextData: updatedContext,
        lastActivityAt: new Date()
      });
    }
    
    return updatedSession;
  }
}
```

### 4. Application Service Updates

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

### 5. Presentation Layer Updates

#### Debug Information Enhancement

```typescript
// lib/chatbot-widget/presentation/components/admin/debug-sections/entity-analysis/AccumulatedEntitiesDisplay.tsx
/**
 * New component for displaying accumulated entities in debug mode
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display accumulated entities with metadata
 * - Show entity history and accumulation timeline
 * - Theme-aware styling with minimal color usage
 * - Follow @golden-rule component patterns
 * - Keep under 200 lines
 */

interface AccumulatedEntitiesDisplayProps {
  entities: AccumulatedEntitiesProps;
  className?: string;
}

export function AccumulatedEntitiesDisplay({ entities, className }: AccumulatedEntitiesDisplayProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Accumulated Entities</h3>
        
        {/* Additive Arrays */}
        <AccumulatedArraySection 
          title="Decision Makers" 
          entities={entities.decisionMakers} 
        />
        <AccumulatedArraySection 
          title="Pain Points" 
          entities={entities.painPoints} 
        />
        <AccumulatedArraySection 
          title="Integration Needs" 
          entities={entities.integrationNeeds} 
        />
        <AccumulatedArraySection 
          title="Evaluation Criteria" 
          entities={entities.evaluationCriteria} 
        />
        
        {/* Single Value Entities */}
        <AccumulatedSingleSection 
          title="Latest Values" 
          entities={{
            Budget: entities.budget,
            Timeline: entities.timeline,
            Urgency: entities.urgency,
            'Contact Method': entities.contactMethod
          }} 
        />
        
        {/* Confidence-Based Entities */}
        <AccumulatedSingleSection 
          title="Confidence-Based" 
          entities={{
            Role: entities.role,
            Industry: entities.industry,
            Company: entities.company,
            'Team Size': entities.teamSize
          }} 
        />
        
        {/* Metadata */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div>Last Updated: {new Date(entities.lastUpdated).toLocaleString()}</div>
          <div>Total Extractions: {entities.totalExtractions}</div>
        </div>
      </div>
    </div>
  );
}

function AccumulatedArraySection({ 
  title, 
  entities 
}: { 
  title: string; 
  entities: EntityWithMetadata<string>[] 
}) {
  if (entities.length === 0) return null;
  
  return (
    <div className="mb-3">
      <h4 className="text-xs font-medium text-muted-foreground mb-1">{title}</h4>
      <div className="space-y-1">
        {entities.map((entity, index) => (
          <EntityItem key={index} entity={entity} />
        ))}
      </div>
    </div>
  );
}

function AccumulatedSingleSection({ 
  title, 
  entities 
}: { 
  title: string; 
  entities: Record<string, EntityWithMetadata<string> | null> 
}) {
  const nonNullEntities = Object.entries(entities).filter(([_, entity]) => entity !== null);
  
  if (nonNullEntities.length === 0) return null;
  
  return (
    <div className="mb-3">
      <h4 className="text-xs font-medium text-muted-foreground mb-1">{title}</h4>
      <div className="space-y-1">
        {nonNullEntities.map(([label, entity]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{label}:</span>
            <EntityItem entity={entity!} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EntityItem({ entity }: { entity: EntityWithMetadata<string> }) {
  const age = getEntityAge(new Date(entity.extractedAt));
  
  return (
    <div className="text-xs">
      <span className="font-mono">{entity.value}</span>
      <span className="text-muted-foreground ml-2">
        (conf: {entity.confidence.toFixed(2)}, {age})
      </span>
    </div>
  );
}

function getEntityAge(extractedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - extractedAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
```

## Implementation Plan

### Phase 1: Domain Foundation (1-2 days)
1. Create `AccumulatedEntities` value object
2. Create `EntityAccumulationService` domain service  
3. Extend `SessionContext` interface
4. Add entity management methods to `SessionContextService`
5. Write comprehensive unit tests for domain logic

### Phase 2: Application Integration (1-2 days)
1. Update `ConversationEnhancedAnalysisService` with entity accumulation
2. Enhance `ConversationSessionUpdateService` to handle accumulated entities
3. Modify `SystemPromptBuilderService` to include entity context
4. Update conversation orchestration to use new accumulation flow
5. Write integration tests for application services

### Phase 3: Presentation Enhancements (1 day)
1. Create `AccumulatedEntitiesDisplay` debug component
2. Integrate accumulated entities into existing debug panels
3. Update debug data enrichment services
4. Test UI components with accumulated entity data

### Phase 4: Testing & Validation (1 day)
1. End-to-end testing of entity accumulation flow
2. Validate JSONB storage and retrieval
3. Performance testing with large entity sets
4. User acceptance testing with conversation scenarios

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
  
  describe('withReplaceableEntity', () => {
    it('should replace budget with latest value', () => {
      const entities = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '$50K', 'msg1', 0.9)
        .withReplaceableEntity('budget', '$75K', 'msg2', 0.9);
      
      expect(entities.budget?.value).toBe('$75K');
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
```

### Integration Tests
```typescript
// lib/chatbot-widget/application/services/__tests__/EntityAccumulationIntegration.test.ts
describe('Entity Accumulation Integration', () => {
  it('should accumulate entities across conversation turns', async () => {
    // Given: A chat session with initial state
    const session = ChatSession.create('config1', 'visitor1');
    
    // When: Processing first message with entities
    const message1 = ChatMessage.createUserMessage(session.id, 'Our CEO John Smith is interested');
    const analysis1 = await analysisService.enhanceAnalysisWithEntityAccumulation(
      baseAnalysis,
      [message1],
      config,
      session
    );
    
    // Then: Entities should be accumulated
    expect(analysis1.accumulatedEntities?.decisionMakers).toHaveLength(1);
    
    // When: Processing second message with additional entities
    const message2 = ChatMessage.createUserMessage(session.id, 'Jane Doe, our President, also needs to approve');
    const analysis2 = await analysisService.enhanceAnalysisWithEntityAccumulation(
      baseAnalysis,
      [message1, message2],
      config,
      session
    );
    
    // Then: Both entities should be accumulated
    expect(analysis2.accumulatedEntities?.decisionMakers).toHaveLength(2);
    expect(analysis2.accumulatedEntities?.decisionMakers.map(dm => dm.value)).toEqual([
      'John Smith',
      'Jane Doe'
    ]);
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
1. **Feature Flag**: Deploy behind feature flag for gradual rollout
2. **A/B Testing**: Compare conversations with/without entity accumulation
3. **Monitoring**: Track entity accumulation performance and storage impact
4. **Gradual Enablement**: Enable for subset of chatbot configs initially

This implementation provides a robust, DDD-compliant solution for entity accumulation that leverages existing infrastructure while providing significant business value through improved conversation context management. 