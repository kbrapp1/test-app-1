/**
 * Accumulated Entities Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object for accumulated conversation entities
 * - Supports three accumulation strategies (additive, replaceable, confidence-based)
 * - Maintains entity metadata including confidence and source tracking
 * - Provides deduplication and normalization for entity values
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines with focused responsibility
 * - Pure domain logic with no external dependencies
 */

export interface EntityWithMetadata<T> {
  value: T;
  extractedAt: Date;
  confidence: number;
  sourceMessageId: string;
}

export interface AccumulatedEntitiesProps {
  // Additive array entities (accumulate over time)
  decisionMakers: EntityWithMetadata<string>[];
  painPoints: EntityWithMetadata<string>[];
  integrationNeeds: EntityWithMetadata<string>[];
  evaluationCriteria: EntityWithMetadata<string>[];
  
  // Latest value entities (replace with newest)
  budget: EntityWithMetadata<string> | null;
  timeline: EntityWithMetadata<string> | null;
  urgency: EntityWithMetadata<'low'|'medium'|'high'> | null;
  contactMethod: EntityWithMetadata<'email'|'phone'|'meeting'> | null;
  
  // Confidence-based entities (keep highest confidence)
  role: EntityWithMetadata<string> | null;
  industry: EntityWithMetadata<string> | null;
  company: EntityWithMetadata<string> | null;
  teamSize: EntityWithMetadata<string> | null;
  
  // Metadata
  lastUpdated: Date;
  totalExtractions: number;
}

export class AccumulatedEntities {
  private constructor(private readonly props: AccumulatedEntitiesProps) {
    this.validateInvariants();
  }

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

  /**
   * Create AccumulatedEntities from stored object (deserialization)
   * AI INSTRUCTIONS:
   * - Handle deserialization from SessionContext storage
   * - Validate structure and provide defaults for missing fields
   * - Convert string dates back to Date objects
   * - Follow @golden-rule error handling patterns
   */
  static fromObject(storedData: any): AccumulatedEntities {
    if (!storedData || typeof storedData !== 'object') {
      return AccumulatedEntities.create();
    }

    try {
      // Helper function to convert stored entity metadata back to proper format
      const parseEntityWithMetadata = (entity: any): EntityWithMetadata<any> | null => {
        if (!entity || typeof entity !== 'object') return null;
        
        return {
          value: entity.value,
          extractedAt: new Date(entity.extractedAt || entity.lastUpdated || new Date()),
          confidence: entity.confidence || 0.5,
          sourceMessageId: entity.sourceMessageId || 'unknown',
        };
      };

      // Helper function to parse array of entities
      const parseEntityArray = (array: any[]): EntityWithMetadata<string>[] => {
        if (!Array.isArray(array)) return [];
        return array.map(item => {
          if (typeof item === 'string') {
            // Handle legacy string arrays
            return {
              value: item,
              extractedAt: new Date(),
              confidence: 0.5,
              sourceMessageId: 'legacy'
            };
          }
          return parseEntityWithMetadata(item);
        }).filter(Boolean) as EntityWithMetadata<string>[];
      };

      const props: AccumulatedEntitiesProps = {
        // Parse array entities
        decisionMakers: parseEntityArray(storedData.decisionMakers),
        painPoints: parseEntityArray(storedData.painPoints),
        integrationNeeds: parseEntityArray(storedData.integrationNeeds),
        evaluationCriteria: parseEntityArray(storedData.evaluationCriteria),
        
        // Parse single-value entities
        budget: parseEntityWithMetadata(storedData.budget),
        timeline: parseEntityWithMetadata(storedData.timeline),
        urgency: parseEntityWithMetadata(storedData.urgency),
        contactMethod: parseEntityWithMetadata(storedData.contactMethod),
        role: parseEntityWithMetadata(storedData.role),
        industry: parseEntityWithMetadata(storedData.industry),
        company: parseEntityWithMetadata(storedData.company),
        teamSize: parseEntityWithMetadata(storedData.teamSize),
        
        // Parse metadata
        lastUpdated: new Date(storedData.lastUpdated || storedData.lastEntityUpdate || new Date()),
        totalExtractions: storedData.totalExtractions || storedData.entityMetadata?.totalEntitiesExtracted || 0
      };

      return new AccumulatedEntities(props);
      
    } catch (error) {
      // If deserialization fails, create fresh entities
      console.warn('Failed to deserialize accumulated entities:', error);
      return AccumulatedEntities.create();
    }
  }

  // Getters for immutable access
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

  /**
   * Strategy 1: Additive entities - accumulate unique values over time
   */
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
      sourceMessageId: messageId
    }));
    
    const mergedEntities = this.deduplicateArray([...existingEntities, ...newEntities]);
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: mergedEntities,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + newValues.length
    });
  }

  /**
   * Strategy 2: Replaceable entities - keep latest value
   */
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
      sourceMessageId: messageId
    };
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityWithMetadata,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /**
   * Strategy 3: Confidence-based entities - keep highest confidence value
   */
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
      sourceMessageId: messageId
    };
    
    // Keep existing if it has higher confidence and exceeds threshold
    const entityToKeep = existing && 
      existing.confidence > confidence && 
      existing.confidence > confidenceThreshold
      ? existing
      : newEntity;
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityToKeep,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /**
   * Remove specific values from additive arrays
   */
  withRemovedEntity(
    entityType: 'decisionMakers'|'painPoints'|'integrationNeeds'|'evaluationCriteria',
    valueToRemove: string,
    messageId: string
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

  /**
   * Correct/replace any entity type
   */
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
      sourceMessageId: messageId
    };
    
    return new AccumulatedEntities({
      ...this.props,
      [entityType]: entityWithMetadata,
      lastUpdated: new Date(),
      totalExtractions: this.props.totalExtractions + 1
    });
  }

  /**
   * Get all entities as a summary object
   */
  getAllEntitiesSummary(): Record<string, any> {
    return {
      decisionMakers: this.decisionMakers.map(e => e.value),
      painPoints: this.painPoints.map(e => e.value),
      integrationNeeds: this.integrationNeeds.map(e => e.value),
      evaluationCriteria: this.evaluationCriteria.map(e => e.value),
      budget: this.budget?.value || null,
      timeline: this.timeline?.value || null,
      urgency: this.urgency?.value || null,
      contactMethod: this.contactMethod?.value || null,
      role: this.role?.value || null,
      industry: this.industry?.value || null,
      company: this.company?.value || null,
      teamSize: this.teamSize?.value || null
    };
  }

  /**
   * Check if accumulated entities are empty
   */
  isEmpty(): boolean {
    return this.props.totalExtractions === 0;
  }

  /**
   * Get entity count by category
   */
  getEntityCountByCategory(): { additive: number; replaceable: number; confidenceBased: number } {
    return {
      additive: this.decisionMakers.length + this.painPoints.length + 
                this.integrationNeeds.length + this.evaluationCriteria.length,
      replaceable: [this.budget, this.timeline, this.urgency, this.contactMethod]
                  .filter(entity => entity !== null).length,
      confidenceBased: [this.role, this.industry, this.company, this.teamSize]
                      .filter(entity => entity !== null).length
    };
  }

  /**
   * Convert to plain object for serialization
   * AI INSTRUCTIONS:
   * - Serialize for storage in SessionContext
   * - Convert dates to ISO strings for JSON compatibility
   * - Maintain all metadata for proper round-trip deserialization
   * - Follow @golden-rule immutability patterns
   */
  toPlainObject(): any {
    const serializeEntity = (entity: EntityWithMetadata<any> | null) => {
      if (!entity) return null;
      return {
        value: entity.value,
        extractedAt: entity.extractedAt.toISOString(),
        confidence: entity.confidence,
        sourceMessageId: entity.sourceMessageId
      };
    };

    const serializeEntityArray = (entities: EntityWithMetadata<string>[]) => {
      return entities.map(serializeEntity);
    };

    return {
      decisionMakers: serializeEntityArray(this.props.decisionMakers),
      painPoints: serializeEntityArray(this.props.painPoints),
      integrationNeeds: serializeEntityArray(this.props.integrationNeeds),
      evaluationCriteria: serializeEntityArray(this.props.evaluationCriteria),
      budget: serializeEntity(this.props.budget),
      timeline: serializeEntity(this.props.timeline),
      urgency: serializeEntity(this.props.urgency),
      contactMethod: serializeEntity(this.props.contactMethod),
      role: serializeEntity(this.props.role),
      industry: serializeEntity(this.props.industry),
      company: serializeEntity(this.props.company),
      teamSize: serializeEntity(this.props.teamSize),
      lastUpdated: this.props.lastUpdated.toISOString(),
      totalExtractions: this.props.totalExtractions
    };
  }

  /**
   * Deduplicate array entities by normalized value
   */
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

  /**
   * Normalize entity values for comparison
   */
  private normalizeEntityValue(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Validate domain invariants
   */
  private validateInvariants(): void {
    if (this.props.totalExtractions < 0) {
      throw new Error('Total extractions cannot be negative');
    }

    // Validate confidence scores
    const allEntities = [
      ...this.props.decisionMakers,
      ...this.props.painPoints,
      ...this.props.integrationNeeds,
      ...this.props.evaluationCriteria,
      this.props.budget,
      this.props.timeline,
      this.props.urgency,
      this.props.contactMethod,
      this.props.role,
      this.props.industry,
      this.props.company,
      this.props.teamSize
    ].filter(entity => entity !== null);

    for (const entity of allEntities) {
      if (entity.confidence < 0 || entity.confidence > 1) {
        throw new Error(`Invalid confidence score: ${entity.confidence}. Must be between 0 and 1`);
      }
    }
  }
} 