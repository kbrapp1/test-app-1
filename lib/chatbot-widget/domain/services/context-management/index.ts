/**
 * Context Management Domain Services Index
 * 
 * AI INSTRUCTIONS:
 * - Export all context management domain services
 * - Maintain clean separation of concerns per service
 * - Each service focuses on specific domain areas under 100 lines
 * - Follow @golden-rule barrel export patterns
 */

// Core context window management orchestration
export { ContextWindowManagementService } from './ContextWindowManagementService';

// Specialized context management services
export { MessageRelevanceCalculationService } from './MessageRelevanceCalculationService';
export type { MessageRelevanceScore } from './MessageRelevanceCalculationService';
export { MessageRetentionSelectionService } from './MessageRetentionSelectionService';
export type { MessageTokenInfo, ContextWindowLimits } from './MessageRetentionSelectionService';
export { ContextWindowValidationService } from './ContextWindowValidationService';

// Message context metadata services
export { MessageContextMetadataFactory } from '../message-processing/MessageContextMetadataFactory';
export { MessageContextValidationService } from '../message-processing/MessageContextValidationService';
export { MessageContextUpdateService } from '../message-processing/MessageContextUpdateService';
export { MessageContextQueryService } from '../message-processing/MessageContextQueryService';