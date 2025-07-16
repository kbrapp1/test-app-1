/**
 * Intent Classification Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Intent classification debug information
 * - Handle intent detection and confidence analysis
 * - Keep under 200-250 lines
 * - Focus on intent debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface IntentClassificationDebugDto {
  detectedIntent: string;
  confidence: number;
  alternativeIntents: Array<{ intent: string; confidence: number }>;
  category: 'sales' | 'support' | 'qualification' | 'general';
  threshold: number;
  isAmbiguous: boolean;
  
  classificationDetails?: {
    rawClassificationResult?: unknown;
    processingTime?: number;
    modelUsed?: string;
    classificationMethod?: 'rule_based' | 'ml_model' | 'hybrid';
    confidenceDistribution?: Record<string, number>;
  };
  
  contextAnalysis?: {
    previousIntents?: string[];
    intentTransition?: {
      from: string;
      to: string;
      reason: string;
    };
    conversationalContext?: string[];
    semanticSimilarity?: number;
  };
  
  validationResults?: {
    isValid: boolean;
    validationErrors?: string[];
    fallbackIntent?: string;
    correctionSuggestions?: string[];
  };
  
  performanceMetrics?: {
    classificationLatency: number;
    modelLoadTime?: number;
    preprocessingTime?: number;
    postprocessingTime?: number;
  };
} 