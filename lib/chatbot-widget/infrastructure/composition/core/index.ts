/**
 * Core Composition Services Index
 * 
 * AI INSTRUCTIONS:
 * - Export all specialized composition services following @golden-rule
 * - Maintain clean separation of concerns per service
 * - Each service focuses on specific domain areas under 250 lines
 * - Follow @golden-rule barrel export patterns
 */

export { InfrastructureServiceCompositionService } from './InfrastructureServiceCompositionService';
export { KnowledgeServiceCompositionService } from './KnowledgeServiceCompositionService';
export { ConversationFlowCompositionService } from './ConversationFlowCompositionService';

// Main composition service (unified facade)
export { CoreDomainServiceCompositionService } from './CoreDomainServiceCompositionService';

// Specialized composition services
export { SessionManagementCompositionService } from './SessionManagementCompositionService';
export { ContentProcessingCompositionService } from './ContentProcessingCompositionService';
export { LeadManagementCompositionService } from './LeadManagementCompositionService';
export { CoreUtilityCompositionService } from './CoreUtilityCompositionService';