/**
 * Message Processing Services Index - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Updated to include specialized workflow components
 * - Centralized export point for all message processing workflow components
 * - Maintains clean import boundaries and dependency management
 * - Supports DDD-aware modular architecture for workflow orchestration
 */

export { MessageProcessingWorkflowService } from './MessageProcessingWorkflowService';
export { WorkflowContextBuilder } from './WorkflowContextBuilder';
export { WorkflowResultFinalizer } from './WorkflowResultFinalizer';
export { JourneyStageMapper } from './JourneyStageMapper';
export * from './WorkflowTypes';

export { ChatMessageProcessingService } from './ChatMessageProcessingService';
export type { MessageProcessingContext } from './ChatMessageProcessingService'; 