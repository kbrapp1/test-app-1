/**
 * Context Value Objects
 * 
 * Barrel export for all context-related value objects in the chatbot domain.
 * These value objects represent various context management concepts used
 * throughout the entity correction and context processing workflows.
 */

// Core correction value objects
export { EntityCorrections, type EntityCorrectionsProps } from './EntityCorrections';
export { CorrectionMetadata, type CorrectionMetadataProps } from './CorrectionMetadata';
export { RemovalOperation, type RemovalOperationProps } from './RemovalOperation';
export { CorrectionOperation, type CorrectionOperationProps, type UrgencyLevel, type ContactMethod } from './CorrectionOperation';

// Domain services (re-exported for convenience)
export { EntityCorrectionsValidationService } from '../../services/context/EntityCorrectionsValidationService';