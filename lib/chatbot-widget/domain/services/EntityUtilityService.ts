/**
 * Entity Utility Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle entity utility operations and calculations
 * - Domain service focused on entity analysis and summary operations
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Provide entity counting, summary, and analysis functions
 * - Support entity quality assessment and metadata operations
 */

import {
  EntityWithMetadata,
  AccumulatedEntitiesProps,
  EntityCounts,
  EntitySummary
} from '../types/AccumulatedEntityTypes';
import { EntityAccumulationStrategies } from './EntityAccumulationStrategies';

// Specialized Service for Entity Utility Operations
export class EntityUtilityService {

  // Generate comprehensive entity summary
  static generateEntitySummary(props: AccumulatedEntitiesProps): EntitySummary {
    return {
      goals: props.goals.map(e => e.value),
      decisionMakers: props.decisionMakers.map(e => e.value),
      painPoints: props.painPoints.map(e => e.value),
      integrationNeeds: props.integrationNeeds.map(e => e.value),
      evaluationCriteria: props.evaluationCriteria.map(e => e.value),
      budget: props.budget?.value || null,
      timeline: props.timeline?.value || null,
      urgency: props.urgency?.value || null,
      contactMethod: props.contactMethod?.value || null,
      visitorName: props.visitorName?.value || null,
      role: props.role?.value || null,
      industry: props.industry?.value || null,
      company: props.company?.value || null,
      teamSize: props.teamSize?.value || null
    };
  }

  // Count entities by accumulation strategy category
  static countEntitiesByCategory(props: AccumulatedEntitiesProps): EntityCounts {
    return {
      additive: props.goals.length + props.decisionMakers.length + props.painPoints.length + 
                props.integrationNeeds.length + props.evaluationCriteria.length,
      replaceable: [props.budget, props.timeline, props.urgency, props.contactMethod]
                  .filter(entity => entity !== null).length,
      confidenceBased: [props.visitorName, props.role, props.industry, props.company, props.teamSize]
                      .filter(entity => entity !== null).length
    };
  }

  // Check if entity collection is empty
  static isEntityCollectionEmpty(props: AccumulatedEntitiesProps): boolean {
    return props.totalExtractions === 0;
  }

  // Validate entity collection integrity
  static validateEntityCollection(props: AccumulatedEntitiesProps): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate total extractions
    if (props.totalExtractions < 0) {
      errors.push('Total extractions cannot be negative');
    }

    // Collect all entities for validation
    const allEntities = [
      ...props.goals,
      ...props.decisionMakers,
      ...props.painPoints,
      ...props.integrationNeeds,
      ...props.evaluationCriteria,
      props.budget,
      props.timeline,
      props.urgency,
      props.contactMethod,
      props.visitorName,
      props.role,
      props.industry,
      props.company,
      props.teamSize
    ].filter(entity => entity !== null);

    // Validate confidence scores using strategies service
    if (!EntityAccumulationStrategies.validateEntityConfidence(allEntities)) {
      errors.push('Invalid confidence scores detected. All confidence scores must be between 0 and 1');
    }

    // Validate dates
    const invalidDates = allEntities.filter(entity => 
      !entity.extractedAt || isNaN(entity.extractedAt.getTime())
    );
    if (invalidDates.length > 0) {
      errors.push(`${invalidDates.length} entities have invalid extraction dates`);
    }

    // Validate last updated date
    if (!props.lastUpdated || isNaN(props.lastUpdated.getTime())) {
      errors.push('Last updated date is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate entity collection statistics
  static calculateEntityStatistics(props: AccumulatedEntitiesProps): {
    totalEntities: number;
    averageConfidence: number;
    highConfidenceEntities: number;
    recentEntities: number;
    oldestEntity: Date | null;
    newestEntity: Date | null;
  } {
    const allEntities = [
      ...props.goals,
      ...props.decisionMakers,
      ...props.painPoints,
      ...props.integrationNeeds,
      ...props.evaluationCriteria,
      props.budget,
      props.timeline,
      props.urgency,
      props.contactMethod,
      props.visitorName,
      props.role,
      props.industry,
      props.company,
      props.teamSize
    ].filter(entity => entity !== null);

    if (allEntities.length === 0) {
      return {
        totalEntities: 0,
        averageConfidence: 0,
        highConfidenceEntities: 0,
        recentEntities: 0,
        oldestEntity: null,
        newestEntity: null
      };
    }

    const totalConfidence = allEntities.reduce((sum, entity) => sum + entity.confidence, 0);
    const averageConfidence = totalConfidence / allEntities.length;
    
    const highConfidenceEntities = allEntities.filter(entity => entity.confidence >= 0.8).length;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEntities = allEntities.filter(entity => entity.extractedAt >= oneDayAgo).length;
    
    const dates = allEntities.map(entity => entity.extractedAt);
    const oldestEntity = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestEntity = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalEntities: allEntities.length,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      highConfidenceEntities,
      recentEntities,
      oldestEntity,
      newestEntity
    };
  }

  // Find entities by confidence threshold
  static findEntitiesByConfidence(
    props: AccumulatedEntitiesProps,
    minConfidence: number = 0.7
  ): EntityWithMetadata<any>[] {
    const allEntities = [
      ...props.goals,
      ...props.decisionMakers,
      ...props.painPoints,
      ...props.integrationNeeds,
      ...props.evaluationCriteria,
      props.budget,
      props.timeline,
      props.urgency,
      props.contactMethod,
      props.visitorName,
      props.role,
      props.industry,
      props.company,
      props.teamSize
    ].filter(entity => entity !== null);

    return allEntities.filter(entity => entity.confidence >= minConfidence);
  }

  // Get entity extraction timeline
  static getEntityExtractionTimeline(props: AccumulatedEntitiesProps): Array<{
    date: Date;
    entityType: string;
    value: any;
    confidence: number;
    sourceMessageId: string;
  }> {
    const timeline: Array<{
      date: Date;
      entityType: string;
      value: any;
      confidence: number;
      sourceMessageId: string;
    }> = [];

    // Add additive entities
    const additiveTypes = ['goals', 'decisionMakers', 'painPoints', 'integrationNeeds', 'evaluationCriteria'] as const;
    additiveTypes.forEach(type => {
      props[type].forEach(entity => {
        timeline.push({
          date: entity.extractedAt,
          entityType: type,
          value: entity.value,
          confidence: entity.confidence,
          sourceMessageId: entity.sourceMessageId
        });
      });
    });

    // Add single-value entities
    const singleValueTypes = ['budget', 'timeline', 'urgency', 'contactMethod', 'visitorName', 'role', 'industry', 'company', 'teamSize'] as const;
    singleValueTypes.forEach(type => {
      const entity = props[type];
      if (entity) {
        timeline.push({
          date: entity.extractedAt,
          entityType: type,
          value: entity.value,
          confidence: entity.confidence,
          sourceMessageId: entity.sourceMessageId
        });
      }
    });

    // Sort by extraction date (newest first)
    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
} 