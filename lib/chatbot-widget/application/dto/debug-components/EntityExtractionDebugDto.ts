/**
 * Entity Extraction Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Entity extraction debug information
 * - Handle entity detection and extraction analysis
 * - Keep under 200-250 lines
 * - Focus on entity debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface EntityExtractionDebugDto {
  extractedEntities: Array<{
    type: string;
    value: string;
    confidence: number;
    category: 'core_business' | 'advanced' | 'contact';
    sourceText?: string;
    position?: { start: number; end: number };
    normalizedValue?: string;
    validationStatus?: 'valid' | 'invalid' | 'uncertain';
  }>;
  
  totalEntitiesFound: number;
  extractionMode: 'basic' | 'comprehensive' | 'custom';
  
  extractionDetails?: {
    rawExtractionResult?: any;
    processingTime?: number;
    patternsMatched?: string[];
    modelUsed?: string;
  };
  
  qualityMetrics?: {
    averageConfidence: number;
    highConfidenceCount: number;
    lowConfidenceCount: number;
    duplicatesFound?: number;
    conflictsResolved?: number;
  };
  
  validationResults?: {
    validatedEntities: number;
    invalidEntities: number;
    uncertainEntities: number;
    validationErrors?: Array<{
      entityType: string;
      value: string;
      error: string;
    }>;
  };
  
  contextualAnalysis?: {
    entityRelationships?: Array<{
      entity1: string;
      entity2: string;
      relationship: string;
      confidence: number;
    }>;
    missingExpectedEntities?: string[];
    unexpectedEntities?: string[];
  };
} 