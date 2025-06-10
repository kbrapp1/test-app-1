// Value Objects
export { PredictionStatus, type PredictionStatusType } from './value-objects/PredictionStatus';
export { TextInput } from './value-objects/TextInput';
export { 
  VoiceId, 
  type TtsVoice, 
  type VoiceGender, 
  type VoiceAccent 
} from './value-objects/VoiceId';
export { SpeechRequest, type ProviderSettings } from './value-objects/SpeechRequest';
export { SpeechResult, type AudioOutput, type ProviderMetadata } from './value-objects/SpeechResult';

// Entities
export { TtsPrediction } from './entities/TtsPrediction'; 

// Export domain repositories
export { 
  type TtsPredictionRepository, 
  type FindOptions, 
  type CountFilters 
} from './repositories/TtsPredictionRepository';

// Export domain services
export { TtsPredictionService } from './services/TtsPredictionService';
export { 
  TtsValidationService,
  type TextInputValidationResult,
  type VoiceValidationResult,
  type TtsRequestValidationResult,
  type PermissionValidationResult
} from './services/TtsValidationService'; 