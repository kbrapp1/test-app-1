/**
 * Application Service: Move Operations
 * 
 * Single Responsibility: Executes move operations for assets and folders
 * Uses React Query mutations for proper cache invalidation
 */

import { MoveFolderUseCase } from '../../../../../application/use-cases/folders/MoveFolderUseCase';
import { SupabaseFolderRepository } from '../../../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { AuthContextService } from '../services/AuthContextService';
import type { DragOperation } from '../types';

export class MoveOperationsService {
  /**
   * Executes an asset move operation using React Query cache invalidation
   * @param operation - The drag operation containing move details
   */
  static async executeAssetMove(operation: DragOperation): Promise<void> {
    // Call the API endpoint 
    const response = await fetch(`/api/dam/asset/${operation.itemId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFolderId: operation.targetId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Move failed' }));
      const errorMessage = errorData.error || `Move failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Manually trigger React Query cache invalidation since we can't use hooks in a static method
    // This is a workaround - ideally this would be done via proper React Query mutations
    window.dispatchEvent(new CustomEvent('reactQueryInvalidateCache', {
      detail: {
        patterns: ['dam-gallery', 'dam-search', 'assets'],
        queries: ['assets', 'folders']
      }
    }));
  }

  /**
   * Executes a folder move operation
   * @param operation - The drag operation containing move details
   */
  static async executeFolderMove(operation: DragOperation): Promise<void> {
    const { supabase, activeOrgId } = await AuthContextService.getContext();
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveFolderUseCase(folderRepository);
    
    await moveUseCase.execute({
      folderId: operation.itemId,
      targetParentFolderId: operation.targetId,
      organizationId: activeOrgId,
    });

    // Manually trigger React Query cache invalidation for consistent gallery updates
    window.dispatchEvent(new CustomEvent('reactQueryInvalidateCache', {
      detail: {
        patterns: ['dam-gallery', 'dam-search', 'folders'],
        queries: ['assets', 'folders']
      }
    }));
  }
} 