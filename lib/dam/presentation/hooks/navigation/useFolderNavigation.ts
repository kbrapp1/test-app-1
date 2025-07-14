import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { NavigateToFolderUseCase, FolderNavigationDto } from '../../../application/use-cases/folders/NavigateToFolderUseCase';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
// TEMPORARILY DISABLED TO TEST API CALLS
// import { getActiveOrganizationId } from '@/lib/auth/server-action';

/**
 * useFolderNavigation - Domain-Driven Navigation Hook
 * 
 * This hook demonstrates proper DDD presentation patterns:
 * - Uses domain use cases for navigation logic
 * - Manages navigation state with business rules
 * - Provides clean API for folder navigation
 * - Handles loading and error states
 */

interface UseFolderNavigationState {
  navigation: FolderNavigationDto | null;
  loading: boolean;
  error: string | null;
  currentFolderId: string | null;
}

interface UseFolderNavigationReturn extends UseFolderNavigationState {
  navigateToFolder: (folderId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  goUp: () => Promise<void>;
  goToRoot: () => Promise<void>;
}

export const useFolderNavigation = (initialFolderId: string | null = null): UseFolderNavigationReturn => {
  const [state, setState] = useState<UseFolderNavigationState>({
    navigation: null,
    loading: false,
    error: null,
    currentFolderId: initialFolderId,
  });

  const { toast } = useToast();
  const { activeOrganizationId, isLoading: isOrgLoading } = useOrganization();

  // Initialize repositories and use case
  const navigateToFolderUseCase = useMemo(() => {
    const supabase = createClient();
    const folderRepository = new SupabaseFolderRepository(supabase);
    return new NavigateToFolderUseCase(folderRepository);
  }, []);

  const navigateToFolder = useCallback(async (folderId: string | null) => {
    // Don't navigate if organization is still loading
    if (isOrgLoading) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get organization context from provider (eliminates Server Action call)
      const organizationId = activeOrganizationId;
      if (!organizationId) {
        throw new Error('Organization context not found');
      }

      // Execute navigation use case
      const navigationResult = await navigateToFolderUseCase.execute({
        folderId,
        organizationId,
      });

      setState(prev => ({
        ...prev,
        navigation: navigationResult,
        currentFolderId: folderId,
        loading: false,
        error: null,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast({
        title: 'Navigation Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [navigateToFolderUseCase, toast, activeOrganizationId, isOrgLoading]);

  const refresh = useCallback(async () => {
    await navigateToFolder(state.currentFolderId);
  }, [navigateToFolder, state.currentFolderId]);

  const goUp = useCallback(async () => {
    if (state.navigation?.canNavigateUp) {
      await navigateToFolder(state.navigation.parentFolderId || null);
    }
  }, [navigateToFolder, state.navigation]);

  const goToRoot = useCallback(async () => {
    await navigateToFolder(null);
  }, [navigateToFolder]);

  // Initialize navigation on mount or when initial folder changes
  useEffect(() => {
    // Only navigate when organization is loaded
    if (!isOrgLoading) {
      navigateToFolder(initialFolderId);
    }
  }, [initialFolderId, isOrgLoading, navigateToFolder]);

  return {
    ...state,
    navigateToFolder,
    refresh,
    goUp,
    goToRoot,
  };
};

export default useFolderNavigation; 
