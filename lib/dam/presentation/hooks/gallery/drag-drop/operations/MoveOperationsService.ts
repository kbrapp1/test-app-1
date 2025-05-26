/**
 * Application Service: Move Operations
 * 
 * Single Responsibility: Executes move operations for assets and folders
 * Orchestrates use cases for drag-drop move operations
 */

import { MoveAssetUseCase } from '../../../../../application/use-cases/assets/MoveAssetUseCase';
import { MoveFolderUseCase } from '../../../../../application/use-cases/folders/MoveFolderUseCase';
import { SupabaseAssetRepository } from '../../../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { AuthContextService } from '../services/AuthContextService';
import type { DragOperation } from '../types';

export class MoveOperationsService {
  /**
   * Executes an asset move operation
   * @param operation - The drag operation containing move details
   */
  static async executeAssetMove(operation: DragOperation): Promise<void> {
    const { supabase, activeOrgId } = await AuthContextService.getContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
    
    await moveUseCase.execute({
      assetId: operation.itemId,
      targetFolderId: operation.targetId,
      organizationId: activeOrgId,
    });
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
  }
} 