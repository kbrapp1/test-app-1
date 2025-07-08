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

/**
 * Specialized Service for Entity Serialization Operations
 * 
 * AI INSTRUCTIONS:
 * - Handle conversion between runtime and storage formats
 * - Support legacy data format migration
 * - Provide error recovery for malformed data
 * - Maintain type safety throughout serialization process
 * - Handle Date object conversion for JSON compatibility
 */
export class EntitySerializationService {

  /** Serialize AccumulatedEntities to plain object for storage */
  static serializeAccumulatedEntities(props: AccumulatedEntitiesProps): SerializedAccumulatedEntities {
    return {
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

  /** Deserialize stored data back to AccumulatedEntitiesProps */
  static deserializeAccumulatedEntities(storedData: any): AccumulatedEntitiesProps {
    if (!storedData || typeof storedData !== 'object') {
      return this.createDefaultProps();
    }

    try {
      const props: AccumulatedEntitiesProps = {
        // Parse array entities
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

  /** Serialize single entity with metadata */
  static serializeEntity(entity: EntityWithMetadata<any> | null): SerializedEntityWithMetadata | null {
    if (!entity) return null;
    
    return {
      value: entity.value,
      extractedAt: entity.extractedAt.toISOString(),
      confidence: entity.confidence,
      sourceMessageId: entity.sourceMessageId
    };
  }

  /**
   * Serialize array of entities with metadata
   * 
   * AI INSTRUCTIONS:
   * - Handle empty arrays gracefully
   * - Apply consistent serialization to all entities
   * - Maintain array order and metadata
   * - Filter out null entities from serialization
   */
  static serializeEntityArray(entities: EntityWithMetadata<string>[]): SerializedEntityWithMetadata[] {
    return entities.map(entity => this.serializeEntity(entity)).filter(Boolean) as SerializedEntityWithMetadata[];
  }

  /** Deserialize single entity with metadata */
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

  /** Deserialize array of entities with metadata */
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

  /**
   * Parse date from various input formats
   * 
   * AI INSTRUCTIONS:
   * - Handle ISO strings, Date objects, and invalid inputs
   * - Provide fallback to current date for invalid inputs
   * - Support legacy date format migration
   * - Ensure valid Date objects are returned
   */
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

  /** Create default AccumulatedEntitiesProps */
  static createDefaultProps(): AccumulatedEntitiesProps {
    return {
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

  /** Validate serialized entity structure */
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

  /**
   * Check if string is valid ISO date format
   * 
   * AI INSTRUCTIONS:
   * - Validate ISO string format for date parsing
   * - Support data integrity checks
   * - Provide simple boolean validation
   * - Handle edge cases gracefully
   */
  static isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  /** Migrate legacy data format to current format */
  static migrateLegacyData(legacyData: any): AccumulatedEntitiesProps {
    if (!legacyData || typeof legacyData !== 'object') {
      return this.createDefaultProps();
    }

    // Handle legacy format where entities were simple strings
    const migrateStringArray = (arr: any[]): EntityWithMetadata<string>[] => {
      if (!Array.isArray(arr)) return [];
      
      return arr.map(item => {
        if (typeof item === 'string') {
          return {
            value: item,
            extractedAt: new Date(),
            confidence: 0.5,
            sourceMessageId: 'legacy-migration'
          };
        }
        return this.deserializeEntity(item);
      }).filter(Boolean) as EntityWithMetadata<string>[];
    };

    return {
      decisionMakers: migrateStringArray(legacyData.decisionMakers),
      painPoints: migrateStringArray(legacyData.painPoints),
      integrationNeeds: migrateStringArray(legacyData.integrationNeeds),
      evaluationCriteria: migrateStringArray(legacyData.evaluationCriteria),
      budget: this.deserializeEntity(legacyData.budget),
      timeline: this.deserializeEntity(legacyData.timeline),
      urgency: this.deserializeEntity(legacyData.urgency),
      contactMethod: this.deserializeEntity(legacyData.contactMethod),
      visitorName: this.deserializeEntity(legacyData.visitorName),
      role: this.deserializeEntity(legacyData.role),
      industry: this.deserializeEntity(legacyData.industry),
      company: this.deserializeEntity(legacyData.company),
      teamSize: this.deserializeEntity(legacyData.teamSize),
      lastUpdated: this.parseDate(legacyData.lastUpdated || legacyData.lastEntityUpdate),
      totalExtractions: legacyData.totalExtractions || legacyData.entityMetadata?.totalEntitiesExtracted || 0
    };
  }
} 