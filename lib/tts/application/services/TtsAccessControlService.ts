/**
 * TTS Feature Access Control Service
 * 
 * AI INSTRUCTIONS:
 * - Universal rule: TTS defaults to enabled when flag missing
 * - Provide convenience functions for common permission checks
 * - Handle organization context validation
 * - Integrate with shared access control system
 * - Follow DDD application layer patterns
 */

import { Permission } from '@/lib/auth/roles';
import { checkTtsAccess as checkBaseTtsAccess, ServerFeatureAccessResult } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { TtsPermissionDeniedError, TtsFeatureNotAvailableError, TtsOrganizationAccessError } from '../../domain/common/TtsError';

export class TtsAccessControlService {
  // Check basic TTS feature access - defaults to enabled when flag missing
  static async checkTtsAccess(requiredPermissions?: Permission[]): Promise<ServerFeatureAccessResult> {
    try {
      return await checkBaseTtsAccess(requiredPermissions);
    } catch (error: unknown) {
      // Transform generic errors to TTS-specific errors
      if (error instanceof Error) {
        if (error.message?.includes('feature')) {
          const errorWithContext = error as Error & { organizationId?: string };
          throw new TtsFeatureNotAvailableError(
            errorWithContext.organizationId || 'unknown',
            'Text-to-Speech'
          );
        }
        if (error.message?.includes('permission')) {
          const errorWithContext = error as Error & { userRole?: string };
          throw new TtsPermissionDeniedError(
            error.message,
            requiredPermissions?.join(', ') || 'unknown',
            errorWithContext.userRole
          );
        }
        if (error.message?.includes('organization')) {
          throw new TtsOrganizationAccessError(error.message);
        }
      }
      
      // Re-throw other errors as-is
      throw error;
    }
  }

  // Check speech generation permissions - core TTS functionality
  static async checkSpeechGenerationAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.GENERATE_SPEECH]);
  }

  // Check TTS history access permissions - includes viewing and managing personal history
  static async checkHistoryAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.VIEW_TTS_HISTORY]);
  }

  // Check history deletion permissions - granular control separate from view
  static async checkHistoryDeleteAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.DELETE_TTS_HISTORY]);
  }

  // Check DAM integration permissions - cross-domain operation
  static async checkDamIntegrationAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.SAVE_TTS_TO_DAM]);
  }

  // Check audio export permissions - separate from generation for granular control
  static async checkAudioExportAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.EXPORT_AUDIO]);
  }

  // Check voice configuration permissions - advanced feature for power users
  static async checkVoiceConfigurationAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.CONFIGURE_VOICES]);
  }

  // Check administrative permissions - admin-only system configuration
  static async checkAdminAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.MANAGE_TTS_SETTINGS]);
  }

  // Check usage statistics permissions - business intelligence and monitoring
  static async checkUsageStatsAccess(): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess([Permission.VIEW_TTS_USAGE]);
  }

  // Check multiple permissions at once - user must have ALL specified permissions
  static async checkMultiplePermissions(permissions: Permission[]): Promise<ServerFeatureAccessResult> {
    return this.checkTtsAccess(permissions);
  }

  // Check if user has any of the specified permissions - returns true if user has ANY
  static async checkAnyPermission(permissions: Permission[]): Promise<ServerFeatureAccessResult> {
    // Try each permission individually and return success on first match
    for (const permission of permissions) {
      try {
        return await this.checkTtsAccess([permission]);
      } catch (error) {
        // Continue to next permission if this one fails
        continue;
      }
    }
    
    // If none of the permissions worked, throw the last error
    throw new TtsPermissionDeniedError(
      `User does not have any of the required permissions: ${permissions.join(', ')}`,
      permissions.join(', ')
    );
  }

  /**
   * Get user's TTS-related permissions
   * 
   * AI INSTRUCTIONS:
   * - Utility function to get all TTS permissions for a user
   * - Use for UI conditional rendering decisions
   * - Returns permission map for efficient checking
   */
  static async getUserTtsPermissions(): Promise<{
    organizationId: string;
    userId: string;
    permissions: {
      canViewTts: boolean;
      canGenerateSpeech: boolean;
      canViewHistory: boolean;
      canDeleteHistory: boolean;
      canSaveToDAM: boolean;
      canConfigureVoices: boolean;
      canExportAudio: boolean;
      canManageSettings: boolean;
      canViewUsageStats: boolean;
    };
  }> {
    // First check basic TTS access
    const basicAccess = await this.checkTtsAccess([Permission.VIEW_TTS]);
    
    // Check each permission individually (non-throwing)
    const checkPermission = async (permission: Permission): Promise<boolean> => {
      try {
        await this.checkTtsAccess([permission]);
        return true;
      } catch {
        return false;
      }
    };

    const permissions = {
      canViewTts: true, // Already validated by basicAccess
      canGenerateSpeech: await checkPermission(Permission.GENERATE_SPEECH),
      canViewHistory: await checkPermission(Permission.VIEW_TTS_HISTORY),
      canDeleteHistory: await checkPermission(Permission.DELETE_TTS_HISTORY),
      canSaveToDAM: await checkPermission(Permission.SAVE_TTS_TO_DAM),
      canConfigureVoices: await checkPermission(Permission.CONFIGURE_VOICES),
      canExportAudio: await checkPermission(Permission.EXPORT_AUDIO),
      canManageSettings: await checkPermission(Permission.MANAGE_TTS_SETTINGS),
      canViewUsageStats: await checkPermission(Permission.VIEW_TTS_USAGE),
    };

    return {
      organizationId: basicAccess.organizationId,
      userId: basicAccess.userId,
      permissions,
    };
  }
} 