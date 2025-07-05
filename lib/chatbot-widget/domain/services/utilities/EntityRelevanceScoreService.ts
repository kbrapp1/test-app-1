/**
 * Entity Relevance Score Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate entity-based relevance scores
 * - Pure domain service with business entity focus
 * - Follow @golden-rule patterns exactly
 * - Weight business-critical entities appropriately
 * - Keep under 150 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';

/**
 * Domain Service for calculating entity relevance scores
 * Scores messages based on business-critical entity mentions
 */
export class EntityRelevanceScoreService {
  
  /**
   * Entity weights for business-critical scoring
   * 
   * AI INSTRUCTIONS:
   * - Higher weights for more business-critical entities
   * - Adjust weights based on business value and conversion impact
   * - Total weights should allow for scores up to 1.0
   */
  private static readonly ENTITY_WEIGHTS = {
    budget: 0.3,
    company: 0.25,
    role: 0.2,
    timeline: 0.15,
    teamSize: 0.1,
    industry: 0.1,
    urgency: 0.15,
    contactMethod: 0.05
  } as const;
  
  /**
   * Calculate entity relevance score based on business entity mentions
   * 
   * AI INSTRUCTIONS:
   * - Score based on business-critical entity presence and density
   * - Use weighted scoring for different entity types
   * - Apply bonus for multiple entity mentions
   * - Return score between 0.0 and 1.0
   */
  static calculateEntityRelevanceScore(
    message: ChatMessage,
    businessEntities: Record<string, any>
  ): number {
    if (!businessEntities || Object.keys(businessEntities).length === 0) {
      return 0.1; // Base score for messages without entity context
    }
    
    const content = message.content.toLowerCase();
    let entityScore = 0;
    let entityCount = 0;
    
    // Score each entity mention with appropriate weight
    Object.entries(businessEntities).forEach(([entityType, entityValue]) => {
      if (entityValue && typeof entityValue === 'string') {
        const entityString = entityValue.toLowerCase();
        if (content.includes(entityString)) {
          const weight = this.ENTITY_WEIGHTS[entityType as keyof typeof this.ENTITY_WEIGHTS] || 0.05;
          entityScore += weight;
          entityCount++;
        }
      }
    });
    
    // Bonus for multiple entity mentions (indicates comprehensive discussion)
    if (entityCount > 1) {
      entityScore += 0.1 * (entityCount - 1);
    }
    
    return Math.min(1.0, entityScore);
  }
  
  /**
   * Calculate entity density score
   * 
   * AI INSTRUCTIONS:
   * - Measure entity mention density relative to message length
   * - Higher density indicates more entity-focused content
   * - Normalize for different message lengths
   */
  static calculateEntityDensityScore(
    message: ChatMessage,
    businessEntities: Record<string, any>
  ): number {
    if (!businessEntities || Object.keys(businessEntities).length === 0) {
      return 0.0;
    }
    
    const content = message.content.toLowerCase();
    const contentLength = content.length;
    
    if (contentLength === 0) return 0.0;
    
    let totalEntityLength = 0;
    let entityMentions = 0;
    
    Object.entries(businessEntities).forEach(([_, entityValue]) => {
      if (entityValue && typeof entityValue === 'string') {
        const entityString = entityValue.toLowerCase();
        if (content.includes(entityString)) {
          totalEntityLength += entityString.length;
          entityMentions++;
        }
      }
    });
    
    // Calculate density as percentage of content that contains entities
    const densityScore = totalEntityLength / contentLength;
    
    // Bonus for multiple distinct entities
    const diversityBonus = entityMentions > 1 ? 0.2 : 0.0;
    
    return Math.min(1.0, densityScore + diversityBonus);
  }
  
  /**
   * Get entity type priority score
   * 
   * AI INSTRUCTIONS:
   * - Return priority score for specific entity types
   * - Higher scores for more business-critical entities
   * - Used for weighted calculations
   */
  static getEntityTypePriority(entityType: string): number {
    return this.ENTITY_WEIGHTS[entityType as keyof typeof this.ENTITY_WEIGHTS] || 0.05;
  }
  
  /**
   * Calculate combined entity score
   * 
   * AI INSTRUCTIONS:
   * - Combine relevance and density scores
   * - Weight relevance higher than density
   * - Provide comprehensive entity-based scoring
   */
  static calculateCombinedEntityScore(
    message: ChatMessage,
    businessEntities: Record<string, any>
  ): number {
    const relevanceScore = this.calculateEntityRelevanceScore(message, businessEntities);
    const densityScore = this.calculateEntityDensityScore(message, businessEntities);
    
    // Weight relevance higher than density (70/30 split)
    return (relevanceScore * 0.7) + (densityScore * 0.3);
  }
} 