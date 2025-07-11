/**
 * DAM Navigation Server Actions
 * 
 * These server actions provide a thin wrapper around navigation use cases
 * following DDD patterns. They handle authentication, error handling,
 * and serialization concerns for Next.js server components.
 * 
 * 🔧 PERFORMANCE FIX: Added internal deduplication to prevent redundant calls
 * detected by NetworkCallMonitor analysis report
 */

'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { ListFoldersUseCase, NavigateToFolderUseCase } from '../use-cases/folders';
import { SupabaseFolderRepository } from '../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { NotFoundError } from '@/lib/errors/base';
import type { PlainFolder } from '../../types/dam.types';
import { apiDeduplicationService } from '../services/ApiDeduplicationService';
import { checkDamFeatureFlag } from '../services/DamFeatureFlagService';

/**
 * Server action to get root folders for sidebar
 * 🔧 PERFORMANCE FIX: Added deduplication to prevent redundant calls
 */
export async function getRootFolders(): Promise<PlainFolder[]> {
  // 🔄 Apply deduplication to prevent redundant root folder calls
  return await apiDeduplicationService.deduplicateServerAction(
    'getRootFolders',
    [], // No parameters for root folders
    async () => {
      
      try {
        await checkDamFeatureFlag();
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: async (name: string) => {
                const cookieStore = await cookies();
                return cookieStore.get(name)?.value;
              },
            },
          }
        );

        const organizationId = await getActiveOrganizationId();
        
        if (!organizationId) {
          return [];
        }

        // Use DDD architecture: Server Action → Use Case → Repository
        const folderRepository = new SupabaseFolderRepository(supabase);
        const listFoldersUseCase = new ListFoldersUseCase(folderRepository);

        const folders = await listFoldersUseCase.execute({
          parentId: null, // Root folders have no parent
          organizationId,
        });

        // Convert domain entities to plain objects for client serialization
        const plainFolders = folders.map(folder => folder.toPlainObject());
        return plainFolders;
      } catch (error) {
        console.error('❌ getRootFolders: Error fetching root folders:', error);
        return [];
      }
    },
    1500 // 1.5 second deduplication window for root folders
  );
}

/**
 * Server action to get folder navigation with breadcrumbs
 * 
 * 🚫 FIXES: Redundant navigation calls when navigating rapidly
 */
export async function getFolderNavigation(folderId: string | null): Promise<{
  breadcrumbs: Array<{ id: string | null; name: string; href: string }>;
  shouldRedirect?: boolean;
  redirectTo?: string;
}> {
  // 🔄 Apply deduplication to prevent redundant navigation calls
  
  return await apiDeduplicationService.deduplicateServerAction(
    'getFolderNavigation',
    [folderId],
    async () => {
      
      try {
        await checkDamFeatureFlag();
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: async (name: string) => {
                const cookieStore = await cookies();
                return cookieStore.get(name)?.value;
              },
            },
          }
        );

        const organizationId = await getActiveOrganizationId();
        if (!organizationId) {
          // No active organization found
          return { breadcrumbs: [{ id: null, name: 'Root', href: '/dam' }] };
        }

        // Use DDD architecture: Server Action → Use Case → Repository
        const folderRepository = new SupabaseFolderRepository(supabase);
        const navigateUseCase = new NavigateToFolderUseCase(folderRepository);

        const navigation = await navigateUseCase.execute({
          folderId,
          organizationId,
        });

        // Transform breadcrumbs to include href for client components
        const breadcrumbs = navigation.breadcrumbs.map(breadcrumb => ({
          id: breadcrumb.id,
          name: breadcrumb.name,
          href: breadcrumb.id ? `/dam?folderId=${breadcrumb.id}` : '/dam',
        }));

        return { breadcrumbs };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error getting folder navigation:', errorMessage);
        
        // Handle folder not found - redirect to root
        if (error instanceof NotFoundError && folderId) {
          console.warn(`Folder ${folderId} not found, redirecting to root`);
          return { 
            breadcrumbs: [{ id: null, name: 'Root', href: '/dam' }],
            shouldRedirect: true,
            redirectTo: '/dam'
          };
        }
        
        // Handle generic errors that might indicate folder not found
        if (folderId && (errorMessage.includes('not found') || errorMessage.includes('Folder with ID'))) {
          console.warn(`Folder ${folderId} appears to be missing (${errorMessage}), redirecting to root`);
          return { 
            breadcrumbs: [{ id: null, name: 'Root', href: '/dam' }],
            shouldRedirect: true,
            redirectTo: '/dam'
          };
        }
        
        // Fallback breadcrumb path for other errors
        const fallbackBreadcrumbs: Array<{ id: string | null; name: string; href: string }> = [
          { id: null, name: 'Root', href: '/dam' }
        ];
        
        if (folderId) {
          fallbackBreadcrumbs.push({ 
            id: folderId, 
            name: 'Error', 
            href: `/dam?folderId=${folderId}` 
          });
        }
        
        return { breadcrumbs: fallbackBreadcrumbs };
      }
    },
    1000 // 1 second deduplication window for navigation
  );
} 
