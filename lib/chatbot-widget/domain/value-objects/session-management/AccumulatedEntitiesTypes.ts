/**
 * Accumulated Entities Types
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Define accumulated entities interfaces for session context
 * - Domain value objects for entity tracking and metadata
 * - Keep under 200 lines by focusing on entity structures only
 * - Follow DDD patterns exactly
 */

import { EntityValue } from '../../types/ChatbotTypes';

export interface EntityWithMetadata {
  value: string;
  confidence: number;
  lastUpdated: string;
  sourceMessageId: string;
}

export interface BooleanEntityWithMetadata {
  value: boolean;
  confidence: number;
  lastUpdated: string;
  sourceMessageId: string;
}

export interface AccumulatedEntitiesTypes extends Record<string, unknown> {
  // ARRAY ENTITIES (accumulative across conversation)
  decisionMakers: string[];
  painPoints: string[];
  integrationNeeds: string[];
  evaluationCriteria: string[];
  
  // INDIVIDUAL ENTITIES (single values with metadata)
  // Core Business Entities
  budget?: EntityWithMetadata;
  timeline?: EntityWithMetadata;
  urgency?: EntityWithMetadata;
  contactMethod?: EntityWithMetadata;
  role?: EntityWithMetadata;
  industry?: EntityWithMetadata;
  company?: EntityWithMetadata;
  teamSize?: EntityWithMetadata;
  
  // NEW: Complete Entity Storage (2025 Best Practice)
  // Personal Information
  visitorName?: EntityWithMetadata;
  
  // Solution Context
  currentSolution?: EntityWithMetadata;
  
  // Scheduling & Preferences
  preferredTime?: EntityWithMetadata;
  
  // Sentiment & Behavioral Data
  sentiment?: EntityWithMetadata; // "positive", "neutral", "negative"
  emotionalTone?: EntityWithMetadata; // "excited", "frustrated", "curious", etc.
  
  // Conversation Flow Entities
  conversationPhase?: EntityWithMetadata; // "discovery", "qualification", "demonstration", etc.
  engagementLevel?: EntityWithMetadata; // "low", "medium", "high", "very_high"
  
  // Business Logic Entities
  nextBestAction?: EntityWithMetadata; // "continue_conversation", "capture_contact", etc.
  
  // AI Response Tone Tracking
  responseStyle?: EntityWithMetadata; // "professional", "friendly", "consultative", etc.
  
  // Lead Capture Signals
  leadCaptureReadiness?: BooleanEntityWithMetadata;
  
  // NEW: Complete Entity History (2025 Best Practice)
  entityHistory?: {
    [entityName: string]: Array<{
      value: EntityValue;
      confidence: number;
      timestamp: string;
      sourceMessageId: string;
      changeType: 'created' | 'updated' | 'corrected' | 'confirmed';
      previousValue?: EntityValue;
    }>;
  };
  
  // Enhanced Metadata
  lastEntityUpdate?: string;
  entityMetadata?: {
    totalEntitiesExtracted: number;
    correctionsApplied: number;
    lastExtractionMethod: 'enhanced' | 'basic' | 'fallback';
    lastProcessedMessageId: string;
    // NEW: Complete tracking metrics
    entitiesStoredThisSession: number;
    uniqueEntitiesDiscovered: number;
    entityEvolutionCount: number; // how many times entities were refined
    confidenceScoreAverage: number;
    highConfidenceEntitiesCount: number; // confidence > 0.8
    lastHighConfidenceExtraction?: string;
  };
}