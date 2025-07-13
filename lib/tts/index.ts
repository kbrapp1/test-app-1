// TTS Module Exports - DDD Architecture
// Fully migrated to Domain-Driven Design structure

// Re-export domain layer (Value Objects & Entities)
export * from './domain';

// Re-export server actions
export * from './presentation/actions/tts';

// Re-export components for external use
export { TtsInterface, type TtsFormInitializationData } from './presentation/components/tts-interface';
export { TtsHistoryPanel } from './presentation/components/TtsHistoryPanel';
export { SaveAsDialog } from './presentation/components/SaveAsDialog';
export { TtsPageClient } from './presentation/components/TtsPageClient';

// Re-export hooks for external use
export { useTtsGeneration } from './presentation/hooks/useTtsGeneration';
export { useTtsDamIntegration } from './presentation/hooks/useTtsDamIntegration';
export { useHeadlessAudioPlayer } from './presentation/hooks/useHeadlessAudioPlayer';
export { useTtsSaveAsDialog } from './presentation/hooks/useTtsSaveAsDialog';
export { useTtsOperations } from './presentation/hooks/useTtsOperations';
export * from './presentation/hooks/useTtsMutations';

// Re-export schemas for external use
export * from './application/schemas/ttsSchemas';

// Re-export use cases for external use
export { getTtsVoices } from './application/use-cases/getTtsVoicesUsecase';
export { startSpeechGeneration } from './application/use-cases/startSpeechGenerationUsecase';
export { getSpeechGenerationResult } from './application/use-cases/getSpeechGenerationResultUsecase';

// Provider infrastructure (DDD compliant)
export { TtsProviderManager } from './infrastructure/providers/TtsProviderManager';
export { TtsReplicateAdapter } from './infrastructure/providers/replicate/TtsReplicateAdapter';
export { TtsElevenLabsAdapter } from './infrastructure/providers/elevenlabs/TtsElevenLabsAdapter';

// Re-export provider configuration
export * from './infrastructure/providers/ttsProviderConfig';

// Re-export DDD-compliant providers
export * from './infrastructure/providers/ttsService'; 