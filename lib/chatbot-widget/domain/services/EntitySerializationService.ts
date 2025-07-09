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
  static deserializeAccumulatedEntities(storedData: any): AccumulatedEntitiesProps {
    if (!storedData || typeof storedData !== 'object') {
      return this.createDefaultProps();
    }

    try {
      const props: AccumulatedEntitiesProps = {
        // Parse array entities
        goals: this.deserializeEntityArray(storedData.goals),
        decisionMakers: this.deserializeEntityArray(storedData.decisionMakers),
        painPoints: this.deserializeEntityArray(storedData.painPoints),
        integrationNeeds: this.deserializeEntityArray(storedData.integrationNeeds),
        evaluationCriteria: this.deserializeEntityArray(storedData.evaluationCriteria),
        
        // Parse single-value entities
        budget: this.deserializeEntity(storedData.budget),
        timeline: this.deserializeEntity(storedData.timeline),
        urgency: this.deserializeEntity(storedData.urgency),
        contactMethod: this.deserializeEntity(storedData.contactMethod),
        visitorName: this.deserializeEntity(storedData.visitorName),
        role: this.deserializeEntity(storedData.role),
        industry: this.deserializeEntity(storedData.industry),
        company: this.deserializeEntity(storedData.company),
        teamSize: this.deserializeEntity(storedData.teamSize),
        
        // Parse metadata
        lastUpdated: this.parseDate(storedData.lastUpdated || storedData.lastEntityUpdate),
        totalExtractions: storedData.totalExtractions || storedData.entityMetadata?.totalEntitiesExtracted || 0
      };

      return props;
      
    } catch (error) {
      // Deserialization failed - return default props without logging
      return this.createDefaultProps();
    }
  }

  // Serialize single entity with metadata
  static serializeEntity(entity: EntityWithMetadata<any> | null): SerializedEntityWithMetadata | null {
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

  // Deserialize single entity with metadata
  static deserializeEntity(entity: any): EntityWithMetadata<any> | null {
    if (!entity || typeof entity !== 'object') return null;
    
    try {
      return {
        value: entity.value,
        extractedAt: this.parseDate(entity.extractedAt || entity.lastUpdated),
        confidence: entity.confidence || 0.5,
        sourceMessageId: entity.sourceMessageId || 'unknown',
      };
    } catch (error) {
      return null;
    }
  }

  // Deserialize array of entities with metadata
  static deserializeEntityArray(array: any[]): EntityWithMetadata<string>[] {
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
      return this.deserializeEntity(item);
    }).filter(Boolean) as EntityWithMetadata<string>[];
  }

  // Parse date from various input formats
  static parseDate(dateInput: any): Date {
    if (!dateInput) {
      return new Date();
    }

    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }

    try {
      const parsed = new Date(dateInput);
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
  static validateSerializedEntity(entity: any): EntityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!entity) {
      return { isValid: true, errors, warnings }; // null entities are valid
    }

    if (typeof entity !== 'object') {
      errors.push('Entity must be an object');
      return { isValid: false, errors, warnings };
    }

    if (entity.value === undefined || entity.value === null) {
      errors.push('Entity value is required');
    }

    if (entity.confidence !== undefined) {
      if (typeof entity.confidence !== 'number' || entity.confidence < 0 || entity.confidence > 1) {
        errors.push('Entity confidence must be a number between 0 and 1');
      }
    } else {
      warnings.push('Entity confidence is missing, will use default value');
    }

    if (entity.extractedAt && !this.isValidISOString(entity.extractedAt)) {
      warnings.push('Entity extractedAt is not a valid ISO string, will use current date');
    }

    if (!entity.sourceMessageId) {
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
    } catch {
      return false;
    }
  }
} 