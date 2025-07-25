'use server';

import { TtsCompositionRoot } from '../../infrastructure/composition/TtsCompositionRoot';
import { TtsUnifiedContextService } from '../../application/services/TtsUnifiedContextService';
import { TtsErrorHandler } from '../../domain/common/TtsError';
import { TtsHistorySaveInput } from '../../domain/types/DatabaseTypes';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';

// Valid sort fields for TTS predictions
type TtsPredictionSortField = 'createdAt' | 'updatedAt' | 'inputText' | 'status' | 'voiceId';

interface GetTtsHistoryActionParams {
  page?: number;
  limit?: number;
  sortBy?: TtsPredictionSortField;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

export async function getTtsVoices(provider?: string, modelId?: string) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'getTtsVoices',
    [provider, modelId],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Security context validated

        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.getVoices(provider, modelId);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function startSpeechGeneration(inputText: string, voiceId: string, provider: string) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'startSpeechGeneration',
    [inputText, voiceId, provider],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Security context validated and deduplication service ready

        // Pass context to application service instead of re-validating
        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.startSpeechGeneration(inputText, voiceId, provider, context.user.id, context.organizationId);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function getSpeechGenerationResult(ttsPredictionDbId: string) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'getSpeechGenerationResult',
    [ttsPredictionDbId],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Security context validated

        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.getSpeechGenerationResult(ttsPredictionDbId);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string,
  linkToPrediction: boolean = true
) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'saveTtsAudioToDam',
    [audioUrl, desiredAssetName, ttsPredictionId, linkToPrediction],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Log security context for monitoring
        console.log('[TTS_SECURITY]', {
          action: 'saveTtsAudioToDam',
          userId: context.user.id,
          organizationId: context.organizationId,
          fromCache: context.securityContext.fromCache,
          validationMethod: context.securityContext.validationMethod,
          timestamp: context.securityContext.timestamp
        });

        // Pass context to application service instead of re-validating
        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.saveTtsAudioToDam(audioUrl, desiredAssetName, ttsPredictionId, linkToPrediction, context.user.id, context.organizationId);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function saveTtsHistory(input: TtsHistorySaveInput) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'saveTtsHistory',
    [input],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Log security context for monitoring
        console.log('[TTS_SECURITY]', {
          action: 'saveTtsHistory',
          userId: context.user.id,
          organizationId: context.organizationId,
          fromCache: context.securityContext.fromCache,
          validationMethod: context.securityContext.validationMethod,
          timestamp: context.securityContext.timestamp
        });

        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.saveTtsHistory(input);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function getTtsHistory(params?: GetTtsHistoryActionParams) {
  // Use deduplication for history requests
  return await apiDeduplicationService.deduplicateServerAction(
    'getTtsHistory',
    [params],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Enhanced logging for history requests to see caching
        console.log('[TTS_HISTORY_CACHE]', {
          action: 'getTtsHistory',
          userId: context.user.id,
          organizationId: context.organizationId,
          fromCache: context.securityContext.fromCache,
          validationMethod: context.securityContext.validationMethod,
          timestamp: context.securityContext.timestamp,
          params: params
        });

        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.getTtsHistory(params, context.user.id, context.organizationId);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
}

export async function markTtsUrlProblematic(
  ttsPredictionId: string, 
  errorMessage?: string | null
) {
  // Use deduplication service with TTS domain
  return await apiDeduplicationService.deduplicateServerAction(
    'markTtsUrlProblematic',
    [ttsPredictionId, errorMessage],
    async () => {
      try {
        // ✅ OPTIMIZED: Use unified context service directly (1 API call vs 3+)
        const unifiedService = TtsUnifiedContextService.getInstance();
        const context = await unifiedService.getUnifiedTtsContext();
        
        if (!context.isValid) {
          return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(new Error(context.error || 'TTS validation failed')));
        }

        // Log security context for monitoring
        console.log('[TTS_SECURITY]', {
          action: 'markTtsUrlProblematic',
          userId: context.user.id,
          organizationId: context.organizationId,
          fromCache: context.securityContext.fromCache,
          validationMethod: context.securityContext.validationMethod,
          timestamp: context.securityContext.timestamp
        });

        const ttsAppService = TtsCompositionRoot.getTtsApplicationService();
        return ttsAppService.markTtsUrlProblematic(ttsPredictionId, errorMessage);
      } catch (error) {
        return TtsErrorHandler.errorResponse(TtsErrorHandler.standardizeError(error));
      }
    },
    'tts-operations'
  );
} 