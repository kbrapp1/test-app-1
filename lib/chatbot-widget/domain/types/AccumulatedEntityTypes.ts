/**
 * Accumulated Entity Types
 * 
 * AI INSTRUCTIONS:
 * - Central location for all accumulated entity related types
 * - Maintain type safety across all entity accumulation services
 * - Support three accumulation strategies (additive, replaceable, confidence-based)
 * - Include comprehensive metadata and configuration types
 * - Follow @golden-rule patterns exactly
 */

export interface EntityWithMetadata<T> {
  value: T;
  extractedAt: Date;
  confidence: number;
  sourceMessageId: string;
}

export interface AccumulatedEntitiesProps {
  // Additive array entities (accumulate over time)
  goals: EntityWithMetadata<string>[];
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
  visitorName: EntityWithMetadata<string> | null;
  role: EntityWithMetadata<string> | null;
  industry: EntityWithMetadata<string> | null;
  company: EntityWithMetadata<string> | null;
  teamSize: EntityWithMetadata<string> | null;
  
  // Metadata
  lastUpdated: Date;
  totalExtractions: number;
}

export type AdditiveEntityType = 'goals' | 'decisionMakers' | 'painPoints' | 'integrationNeeds' | 'evaluationCriteria';
export type ReplaceableEntityType = 'budget' | 'timeline' | 'urgency' | 'contactMethod';
export type ConfidenceBasedEntityType = 'visitorName' | 'role' | 'industry' | 'company' | 'teamSize';
export type AnyEntityType = AdditiveEntityType | ReplaceableEntityType | ConfidenceBasedEntityType;

export interface EntityAccumulationStrategy {
  type: 'additive' | 'replaceable' | 'confidence-based';
  confidenceThreshold?: number;
}

export interface EntityOperationContext {
  messageId: string;
  confidence: number;
  extractedAt: Date;
}

export interface EntityCounts {
  additive: number;
  replaceable: number;
  confidenceBased: number;
}

export interface EntitySummary {
  goals: string[];
  decisionMakers: string[];
  painPoints: string[];
  integrationNeeds: string[];
  evaluationCriteria: string[];
  budget: string | null;
  timeline: string | null;
  urgency: 'low' | 'medium' | 'high' | null;
  contactMethod: 'email' | 'phone' | 'meeting' | null;
  visitorName: string | null;
  role: string | null;
  industry: string | null;
  company: string | null;
  teamSize: string | null;
}

export interface SerializedEntityWithMetadata {
  value: unknown;
  extractedAt: string; // ISO string
  confidence: number;
  sourceMessageId: string;
}

export interface SerializedAccumulatedEntities {
  goals: SerializedEntityWithMetadata[];
  decisionMakers: SerializedEntityWithMetadata[];
  painPoints: SerializedEntityWithMetadata[];
  integrationNeeds: SerializedEntityWithMetadata[];
  evaluationCriteria: SerializedEntityWithMetadata[];
  budget: SerializedEntityWithMetadata | null;
  timeline: SerializedEntityWithMetadata | null;
  urgency: SerializedEntityWithMetadata | null;
  contactMethod: SerializedEntityWithMetadata | null;
  visitorName: SerializedEntityWithMetadata | null;
  role: SerializedEntityWithMetadata | null;
  industry: SerializedEntityWithMetadata | null;
  company: SerializedEntityWithMetadata | null;
  teamSize: SerializedEntityWithMetadata | null;
  lastUpdated: string; // ISO string
  totalExtractions: number;
}

export interface EntityUpdateOperation {
  entityType: AnyEntityType;
  operation: 'add' | 'replace' | 'remove' | 'correct';
  value: string | string[];
  context: EntityOperationContext;
  strategy?: EntityAccumulationStrategy;
}

export interface EntityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EntityNormalizationConfig {
  removeSpecialCharacters: boolean;
  toLowerCase: boolean;
  trimWhitespace: boolean;
} 