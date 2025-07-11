/**
 * Text-to-Speech Page - Protected with Server-Side Access Control
 * 
 * AI INSTRUCTIONS:
 * - Uses server-side access control for consistent protection
 * - Guarantees non-null organizationId to content component
 * - Handles feature flags and role permissions
 * - Single responsibility: access control wrapper
 * - Follows established pattern from notes and team pages
 */

import { checkTtsAccess } from '@/lib/shared/access-control/server/checkFeatureAccess';
import { FeatureNotAvailable, NoOrganizationAccess, InsufficientPermissions } from '@/components/access-guards';
import { TtsPageClient } from '@/lib/tts/presentation/components/TtsPageClient';
import { Permission } from '@/lib/auth/roles';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export default async function TextToSpeechPage() {
  try {
    // AI: Check feature access with TTS viewing permissions on server-side
    const accessResult = await checkTtsAccess([Permission.VIEW_TTS]);

    // AI: Access granted - render content with guaranteed organizationId
    return <TtsPageClient organizationId={accessResult.organizationId} />;
    
  } catch (error: unknown) {
    // AI: Handle different types of access denials with specific error matching
    const errorMessage = error instanceof Error ? error.message : '';
    
    // AI: Check for feature flag errors
    if (errorMessage.includes('Feature') && errorMessage.includes('not enabled')) {
      return <FeatureNotAvailable feature="Text-to-Speech" />;
    }
    
    // AI: Check for organization access errors
    if (errorMessage.includes('Organization access required')) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Check for permission errors (most specific match)
    if (errorMessage.includes('Insufficient permissions')) {
      // AI: Extract required permissions from error message
      const permissionMatch = errorMessage.match(/\[(.*?)\]/);
      const requiredPermissions = permissionMatch ? permissionMatch[1].split(', ') : ['view:tts'];
      
      return (
        <InsufficientPermissions 
          feature="Text-to-Speech"
          requiredPermissions={requiredPermissions}
          showContactAdmin={true}
        />
      );
    }
    
    // AI: Check for role-related errors
    if (errorMessage.includes('No role found')) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Generic access denied fallback
    return <NoOrganizationAccess />;
  }
} 