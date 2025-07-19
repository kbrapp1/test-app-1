/**
 * Chatbot Widget Types - DDD-Refactored
 * 
 * REFACTORED: This file now re-exports from proper DDD layers for backward compatibility.
 * - Domain value objects → domain/value-objects/
 * - Application types → application/types/
 * - Infrastructure types → infrastructure/types/
 * 
 * All organizationId security fields preserved across refactoring.
 */

// ===============================================
// DOMAIN LAYER RE-EXPORTS (Pure Business Logic)
// ===============================================
export type {
  EntityValue,
  EntityChange
} from '../value-objects/EntityValueObject';

export type {
  LeadScoringEntities,
  LeadQualificationParams
} from '../value-objects/LeadScoringValueObjects';

export type {
  ChatSessionMetadata,
  CommunicationSettingsData
} from '../value-objects/ChatSessionValueObjects';

// ===============================================
// APPLICATION LAYER RE-EXPORTS (Use Cases & Orchestration)
// ===============================================
export type {
  ContextAnalysisInput,
  ContextInjectionData,
  IntentPersistenceData
} from '../../application/types/ContextAnalysisTypes';

export type {
  AIConfigurationComponent,
  ChatbotServiceResponse
} from '../../application/types/ConfigurationTypes';

// ===============================================
// INFRASTRUCTURE LAYER RE-EXPORTS (External Concerns)
// ===============================================
export type {
  DebugApiCall,
  LoggingContext,
  LogEntry,
  ApiCallLog
} from '../../infrastructure/types/LoggingTypes';

export type {
  ChatSessionPersistenceData
} from '../../infrastructure/types/PersistenceTypes'; 