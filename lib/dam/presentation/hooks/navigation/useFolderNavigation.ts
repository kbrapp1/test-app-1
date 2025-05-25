import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { NavigateToFolderUseCase, FolderNavigationDto } from '../../../application/use-cases/folders/NavigateToFolderUseCase';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/client';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

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

  // Initialize repositories and use case
  const supabase = createClient();
  const folderRepository = new SupabaseFolderRepository(supabase);
  const navigateToFolderUseCase = new NavigateToFolderUseCase(folderRepository);

  const navigateToFolder = useCallback(async (folderId: string | null) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get organization context
      const organizationId = await getActiveOrganizationId();
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
  }, [navigateToFolderUseCase, toast]);

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
    navigateToFolder(initialFolderId);
  }, [initialFolderId]); // Don't include navigateToFolder to avoid infinite loops

  return {
    ...state,
    navigateToFolder,
    refresh,
    goUp,
    goToRoot,
  };
};

export default useFolderNavigation; 
