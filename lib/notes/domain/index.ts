/**
 * Notes Domain Layer - Barrel Exports
 * 
 * AI INSTRUCTIONS:
 * - Export all domain layer components for easy importing
 * - Follow @golden-rule barrel export patterns exactly
 */

// Aggregates
export * from './aggregates/NoteAggregate';

// Value Objects
export * from './value-objects/NoteId';

// Domain Services
export * from './services/NotesOrderingService';
export * from './services/IPermissionService';
export * from './services/IAuthContext';

// Repository Interfaces
export * from './repositories/INotesRepository';

// Domain Errors
export * from './errors/NotesDomainError';

// Domain Events
export * from './events/NoteEvents';

// Specifications
export * from './specifications/NoteSpecifications'; 