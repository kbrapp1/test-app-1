'use client';

import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useCallback } from 'react';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { MoveFolderUseCase } from '../../../application/use-cases/folders/MoveFolderUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

// Domain Types
interface DragOperation {
  readonly itemId: string;
  readonly itemType: 'asset' | 'folder';
  readonly targetId: string | null;
  readonly sourceItem: any;
}

interface DragValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

interface UseDamDragAndDropProps {
  onItemsUpdate: (updater: (items: GalleryItemDto[]) => GalleryItemDto[]) => void;
  onToast: (toast: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  onRefreshData?: () => Promise<void> | void;
}

/**
 * Domain-driven hook for DAM drag and drop operations
 * 
 * Follows DDD principles:
 * - Clear domain modeling with value objects
 * - Separation of validation, execution, and UI concerns
 * - Use case orchestration
 * - Clean error handling
 */
export function useDamDragAndDrop({ onItemsUpdate, onToast, onRefreshData }: UseDamDragAndDropProps) {
  
  // Sensor configuration for responsive drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, { 
      activationConstraint: { delay: 100, tolerance: 5 } 
    })
  );

  // Domain Service: Authentication Context
  const getAuthContext = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('No session found');

    const decodedToken = jwtDecode<any>(session.access_token);
    const activeOrgId = decodedToken.custom_claims?.active_organization_id;
    
    if (!activeOrgId) throw new Error('No active organization found');

    return { supabase, user, activeOrgId };
  }, []);

  // Domain Service: Drag Operation Factory
  const createDragOperation = useCallback((event: DragEndEvent): DragOperation | null => {
    const { active, over } = event;
    if (!active || !over) return null;

    const itemType = active.data.current?.type;
    if (itemType !== 'asset' && itemType !== 'folder') return null;

    // Extract target folder ID from different drop zone types
    let targetId: string | null = null;
    if (over.id === 'sidebar-home-folder') {
      targetId = null; // Home folder
    } else if (typeof over.id === 'string' && over.id.startsWith('sidebar-')) {
      targetId = over.id.replace('sidebar-', '');
    } else {
      targetId = over.id as string;
    }

    // Override with explicit folder ID from drop zone data
    const dropZoneData = over.data.current;
    if (dropZoneData?.folderId !== undefined) {
      targetId = dropZoneData.folderId;
    }

    return {
      itemId: active.id as string,
      itemType,
      targetId,
      sourceItem: active.data.current?.item,
    };
  }, []);

  // Domain Service: Operation Validation
  const validateDragOperation = useCallback((operation: DragOperation, overData: any): DragValidationResult => {
    const { itemType, targetId, sourceItem } = operation;
    
    // Check drop zone compatibility
    const acceptsAssets = overData?.accepts?.includes('asset');
    const acceptsFolders = overData?.accepts?.includes('folder');
    
    if (itemType === 'asset' && !acceptsAssets) {
      return { isValid: false, reason: 'Drop zone does not accept assets' };
    }
    
    if (itemType === 'folder' && !acceptsFolders) {
      return { isValid: false, reason: 'Drop zone does not accept folders' };
    }

    // Validate no-change scenarios
    if (itemType === 'asset' && sourceItem?.folder_id === targetId) {
      return { isValid: false, reason: 'Asset is already in the target folder' };
    }
    
    if (itemType === 'folder' && sourceItem?.parentFolderId === targetId) {
      return { isValid: false, reason: 'Folder is already in the target location' };
    }

    // Prevent folder self-move
    if (itemType === 'folder' && operation.itemId === targetId) {
      return { isValid: false, reason: 'Cannot move a folder into itself' };
    }

    return { isValid: true };
  }, []);

  // Use Case: Execute Asset Move
  const executeAssetMove = useCallback(async (operation: DragOperation) => {
    const { supabase, activeOrgId } = await getAuthContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
    
    await moveUseCase.execute({
      assetId: operation.itemId,
      targetFolderId: operation.targetId,
      organizationId: activeOrgId,
    });
  }, [getAuthContext]);

  // Use Case: Execute Folder Move
  const executeFolderMove = useCallback(async (operation: DragOperation) => {
    const { supabase, activeOrgId } = await getAuthContext();
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveFolderUseCase(folderRepository);
    
    await moveUseCase.execute({
      folderId: operation.itemId,
      targetParentFolderId: operation.targetId,
      organizationId: activeOrgId,
    });
  }, [getAuthContext]);

  // Application Service: Orchestrate Drag Operation
  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🔄 Processing drag operation...');
    
    // 1. Create domain operation
    const operation = createDragOperation(event);
    if (!operation) return;

    // 2. Validate operation
    const validation = validateDragOperation(operation, event.over?.data.current);
    if (!validation.isValid) {
      onToast({ 
        title: validation.reason?.includes('already') ? 'No Change' : 'Invalid Move',
        description: validation.reason,
        variant: validation.reason?.includes('already') ? 'default' : 'destructive'
      });
      return;
    }

    // 3. Execute optimistic update
    onItemsUpdate(prevItems => prevItems.filter(item => item.id !== operation.itemId));

    try {
      // 4. Execute domain operation
      if (operation.itemType === 'asset') {
        await executeAssetMove(operation);
        onToast({ title: 'Asset moved successfully!' });
      } else {
        await executeFolderMove(operation);
        onToast({ title: 'Folder moved successfully!' });
      }

      // 5. Refresh data for consistency
      if (onRefreshData) {
        await onRefreshData();
      }

    } catch (error) {
      console.error(`Move ${operation.itemType} error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      
      onToast({ 
        title: `Error moving ${operation.itemType}`, 
        description: errorMessage, 
        variant: 'destructive' 
      });

      // Revert optimistic update by refreshing
      if (onRefreshData) {
        await onRefreshData();
      }
    }
  };

  return { 
    sensors, 
    handleDragEnd,
  };
} 
