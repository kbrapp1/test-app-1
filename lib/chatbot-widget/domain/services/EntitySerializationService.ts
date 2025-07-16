/**
 * Entity Serialization Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle entity serialization and deserialization
 * - Domain service focused on data transformation and persistence
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Handle complex deserialization with error recovery
 * - Support legacy data format migration
 * - Provide type-safe serialization/deserialization
 */

import {
  EntityWithMetadata,
  AccumulatedEntitiesProps,
  SerializedEntityWithMetadata,
  SerializedAccumulatedEntities,
  EntityValidationResult
} from '../types/AccumulatedEntityTypes';

// Specialized Service for Entity Serialization Operations
export class EntitySerializationService {

  // Serialize AccumulatedEntities to plain object for storage
  static serializeAccumulatedEntities(props: AccumulatedEntitiesProps): SerializedAccumulatedEntities {
    return {
      goals: this.serializeEntityArray(props.goals),
      decisionMakers: this.serializeEntityArray(props.decisionMakers),
      painPoints: this.serializeEntityArray(props.painPoints),
      integrationNeeds: this.serializeEntityArray(props.integrationNeeds),
      evaluationCriteria: this.serializeEntityArray(props.evaluationCriteria),
      budget: this.serializeEntity(props.budget),
      timeline: this.serializeEntity(props.timeline),
      urgency: this.serializeEntity(props.urgency),
      contactMethod: this.serializeEntity(props.contactMethod),
      visitorName: this.serializeEntity(props.visitorName),
      role: this.serializeEntity(props.role),
      industry: this.serializeEntity(props.industry),
      company: this.serializeEntity(props.company),
      teamSize: this.serializeEntity(props.teamSize),
      lastUpdated: props.lastUpdated.toISOString(),
      totalExtractions: props.totalExtractions
    };
  }

  // Deserialize stored data back to AccumulatedEntitiesProps
  static deserializeAccumulatedEntities(storedData: unknown): AccumulatedEntitiesProps {
    if (!storedData || typeof storedData !== 'object') {
      return this.createDefaultProps();
    }

    try {
      const data = storedData as Record<string, unknown>;
      const props: AccumulatedEntitiesProps = {
        // Parse array entities
        goals: this.deserializeEntityArray(data.goals),
        decisionMakers: this.deserializeEntityArray(data.decisionMakers),
        painPoints: this.deserializeEntityArray(data.painPoints),
        integrationNeeds: this.deserializeEntityArray(data.integrationNeeds),
        evaluationCriteria: this.deserializeEntityArray(data.evaluationCriteria),
        
        // Parse single-value entities
        budget: this.deserializeStringEntity(data.budget),
        timeline: this.deserializeStringEntity(data.timeline),
        urgency: this.deserializeUrgencyEntity(data.urgency),
        contactMethod: this.deserializeContactMethodEntity(data.contactMethod),
        visitorName: this.deserializeStringEntity(data.visitorName),
        role: this.deserializeStringEntity(data.role),
        industry: this.deserializeStringEntity(data.industry),
        company: this.deserializeStringEntity(data.company),
        teamSize: this.deserializeStringEntity(data.teamSize),
        
        // Parse metadata
        lastUpdated: this.parseDate(data.lastUpdated || data.lastEntityUpdate),
        totalExtractions: (data.totalExtractions as number) || (data.entityMetadata as Record<string, unknown>)?.totalEntitiesExtracted as number || 0
      };

      return props;
      
    } catch (error) {
      // Deserialization failed - return default props without logging
      return this.createDefaultProps();
    }
  }

  // Serialize single entity with metadata
  static serializeEntity(entity: EntityWithMetadata<unknown> | null): SerializedEntityWithMetadata | null {
    if (!entity) return null;
    
    return {
      value: entity.value,
      extractedAt: entity.extractedAt.toISOString(),
      confidence: entity.confidence,
      sourceMessageId: entity.sourceMessageId
    };
  }

  // Serialize array of entities with metadata
  static serializeEntityArray(entities: EntityWithMetadata<string>[]): SerializedEntityWithMetadata[] {
    return entities.map(entity => this.serializeEntity(entity)).filter(Boolean) as SerializedEntityWithMetadata[];
  }

  // Deserialize single entity with metadata (generic version)
  static deserializeEntity(entity: unknown): EntityWithMetadata<unknown> | null {
    if (!entity || typeof entity !== 'object') return null;
    
    try {
      const data = entity as Record<string, unknown>;
      return {
        value: data.value,
        extractedAt: this.parseDate(data.extractedAt || data.lastUpdated),
        confidence: (data.confidence as number) || 0.5,
        sourceMessageId: (data.sourceMessageId as string) || 'unknown',
      };
    } catch (error) {
      return null;
    }
  }

  // Deserialize string entity with metadata
  static deserializeStringEntity(entity: unknown): EntityWithMetadata<string> | null {
    const result = this.deserializeEntity(entity);
    if (!result) return null;
    
    return {
      ...result,
      value: String(result.value || '')
    };
  }

  // Deserialize urgency entity with metadata
  static deserializeUrgencyEntity(entity: unknown): EntityWithMetadata<'high' | 'low' | 'medium'> | null {
    const result = this.deserializeEntity(entity);
    if (!result) return null;
    
    const urgencyValue = String(result.value || '').toLowerCase();
    if (!['high', 'low', 'medium'].includes(urgencyValue)) {
      return null;
    }
    
    return {
      ...result,
      value: urgencyValue as 'high' | 'low' | 'medium'
    };
  }

  // Deserialize contact method entity with metadata
  static deserializeContactMethodEntity(entity: unknown): EntityWithMetadata<'email' | 'phone' | 'meeting'> | null {
    const result = this.deserializeEntity(entity);
    if (!result) return null;
    
    const contactValue = String(result.value || '').toLowerCase();
    if (!['email', 'phone', 'meeting'].includes(contactValue)) {
      return null;
    }
    
    return {
      ...result,
      value: contactValue as 'email' | 'phone' | 'meeting'
    };
  }

  // Deserialize array of entities with metadata
  static deserializeEntityArray(array: unknown): EntityWithMetadata<string>[] {
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
      return this.deserializeStringEntity(item);
    }).filter(Boolean) as EntityWithMetadata<string>[];
  }

  // Parse date from various input formats
  static parseDate(dateInput: unknown): Date {
    if (!dateInput) {
      return new Date();
    }

    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }

    try {
      const parsed = new Date(String(dateInput));
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch (error) {
      return new Date();
    }
  }

  // Create default AccumulatedEntitiesProps
  static createDefaultProps(): AccumulatedEntitiesProps {
    return {
      goals: [],
      decisionMakers: [],
      painPoints: [],
      integrationNeeds: [],
      evaluationCriteria: [],
      budget: null,
      timeline: null,
      urgency: null,
      contactMethod: null,
      visitorName: null,
      role: null,
      industry: null,
      company: null,
      teamSize: null,
      lastUpdated: new Date(),
      totalExtractions: 0
    };
  }

  // Validate serialized entity structure
  static validateSerializedEntity(entity: unknown): EntityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!entity) {
      return { isValid: true, errors, warnings }; // null entities are valid
    }

    if (typeof entity !== 'object') {
      errors.push('Entity must be an object');
      return { isValid: false, errors, warnings };
    }

    const data = entity as Record<string, unknown>;

    if (data.value === undefined || data.value === null) {
      errors.push('Entity value is required');
    }

    if (data.confidence !== undefined) {
      if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
        errors.push('Entity confidence must be a number between 0 and 1');
      }
    } else {
      warnings.push('Entity confidence is missing, will use default value');
    }

    if (data.extractedAt && !this.isValidISOString(String(data.extractedAt))) {
      warnings.push('Entity extractedAt is not a valid ISO string, will use current date');
    }

    if (!data.sourceMessageId) {
      warnings.push('Entity sourceMessageId is missing, will use default value');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Check if string is valid ISO date format
  static isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch (_error) {
      return false;
    }
  }
} 