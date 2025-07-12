/**
 * Notes Page - Protected with Universal Access Control
 * 
 * AI INSTRUCTIONS:
 * - Uses server-side access control for consistent protection
 * - Guarantees non-null organizationId to content component
 * - Handles feature flags and role permissions
 * - Single responsibility: access control wrapper and data fetching
 */

import { checkNotesAccess } from '@/lib/shared/access-control';
import { Permission } from '@/lib/auth/roles';
import NotesPageContent from './NotesPageContent';
import { NoOrganizationAccess, FeatureNotAvailable, InsufficientPermissions } from '@/components/access-guards';
import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/types/notes';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  try {
    // AI: Check feature access with permissions on server-side
    const accessResult = await checkNotesAccess(); // AI: Check notes feature access

    // AI: Handle access denial
    if (!accessResult.hasAccess) {
      if (accessResult.error?.includes('Organization context required')) {
        return <NoOrganizationAccess />;
      }
      if (accessResult.error?.includes('not enabled')) {
        return <FeatureNotAvailable feature="Notes" />;
      }
      throw new Error(accessResult.error || 'Access denied');
    }

    // AI: Ensure organizationId exists (should be guaranteed by access control)
    if (!accessResult.organizationId) {
      return <NoOrganizationAccess />;
    }

    // AI: Fetch notes data on server side
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    let notes: Note[] = [];
    let fetchError: string | null = null;

    if (userError || !user) {
      // AI: This should not happen since guard validates auth, but handle gracefully
      fetchError = 'Authentication error occurred.';
    } else {
      // AI: Fetch notes for the guaranteed organization
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', accessResult.organizationId) // AI: Use guaranteed organizationId
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching notes:', error.message);
        fetchError = 'Could not fetch notes.';
      } else {
        notes = (data as Note[]) || [];
      }
    }

    // AI: Access granted - render content with guaranteed organizationId and data
    return (
      <NotesPageContent 
        organizationId={accessResult.organizationId} 
        notes={notes}
        fetchError={fetchError}
      />
    );
    
  } catch (error: unknown) {
    // AI: Handle different types of access denials with specific error matching
    const errorMessage = error instanceof Error ? error.message : '';
    
    // AI: Check for feature flag errors
    if (errorMessage.includes('Feature') && errorMessage.includes('not enabled')) {
      return <FeatureNotAvailable feature="Notes" />;
    }
    
    // AI: Check for organization access errors
    if (errorMessage.includes('Organization access required')) {
      return <NoOrganizationAccess />;
    }
    
    // AI: Check for permission errors (most specific match)
    if (errorMessage.includes('Insufficient permissions')) {
      // AI: Extract required permissions from error message
      const permissionMatch = errorMessage.match(/\[(.*?)\]/);
      const requiredPermissions = permissionMatch ? permissionMatch[1].split(', ') : ['view:note'];
      
      return (
        <InsufficientPermissions 
          feature="Notes"
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