/**
 * TTS Unified Actions - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - OPTIMIZATION: Single server action to replace multiple context calls
 * - Uses TtsUnifiedContextService for consolidated validation
 * - Maintains all security guarantees while reducing API calls
 * - Follow @golden-rule patterns exactly
 */

'use server';

import { TtsUnifiedContextService, TtsUnifiedContext } from '../../application/services/TtsUnifiedContextService';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';

export interface TtsUnifiedContextResult {
  success: boolean;
  data?: TtsUnifiedContext;
  error?: string;
}

/**
 * OPTIMIZATION: Get all TTS context in single server action
 * Replaces separate calls to useOrganizationContext + validation + feature flags
 */
export async function getTtsUnifiedContext(): Promise<TtsUnifiedContextResult> {
  return await apiDeduplicationService.deduplicateServerAction(
    'getTtsUnifiedContext',
    [], // No parameters needed
    async () => {
      try {
        const unifiedService = TtsUnifiedContextService.getInstance();
        const result = await unifiedService.getUnifiedTtsContext();
        
        if (!result.isValid) {
          return {
            success: false,
            error: result.error || 'TTS context validation failed'
          };
        }

        if (!result.unifiedContext) {
          return {
            success: false,
            error: 'Unified context data not available'
          };
        }

        return {
          success: true,
          data: result.unifiedContext
        };

      } catch (error) {
        console.error('[TTS_UNIFIED_ACTION] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load TTS context'
        };
      }
    },
    'tts-operations'
  );
} 