/**
 * Chatbot Widget Application Services
 * 
 * AI INSTRUCTIONS:
 * - Services are organized by domain responsibility following @golden-rule DDD
 * - Each service category handles specific business concerns
 * - Use these imports for clean service access across the application
 * - Maintain layer separation: application services coordinate, domain services implement logic
 */

// Lead Management Services
export * from './lead-management';

// Conversation Management Services  
export * from './conversation-management';

// Configuration Management Services
export * from './configuration-management';

// Analysis Services
export * from './analysis';

// Simulation Services
export * from './simulation';

// Vector Knowledge Services
export { VectorKnowledgeApplicationService } from './VectorKnowledgeApplicationService';
export { VectorKnowledgeOrchestrationService } from './VectorKnowledgeOrchestrationService';

// Website Source Management Services
export { WebsiteSourceProgressService } from './WebsiteSourceProgressService';

// Crawl and Store Services
export { KnowledgeItemPreparationService } from './KnowledgeItemPreparationService';
export { EmbeddingOrchestrationService } from './EmbeddingOrchestrationService';
export { StorageCoordinationService } from './StorageCoordinationService'; 