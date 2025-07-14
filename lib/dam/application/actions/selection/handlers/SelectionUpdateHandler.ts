/**
 * Application Service: Selection Update Handler
 * 
 * Single Responsibility: Handles selection update operations
 * Orchestrates selection state management following DDD principles
 */

import { AuthenticationService } from '../services/AuthenticationService';
import { FormDataExtractionService } from '../services/FormDataExtractionService';
import { RepositoryFactoryService } from '../services/RepositoryFactoryService';
import type { SelectionActionResult } from '../types';

export class SelectionUpdateHandler {
  /**
   * Handles selection update server action
   * @param formData - Form data containing selection update parameters
   * @returns Promise resolving to action result
   */
  static async handle(formData: FormData): Promise<SelectionActionResult> {
    try {
      // 1. Extract and validate form data
      const extractionResult = FormDataExtractionService.extractSelectionUpdate(formData);
      if (!extractionResult.isValid) {
        return { 
          success: false, 
          error: extractionResult.errors.join(', ') 
        };
      }

      const request = extractionResult.data!;

      // 2. Parse current selection state
      let currentSelection;
      try {
        currentSelection = request.selectionData ? JSON.parse(request.selectionData) : null;
      } catch {
        return { 
          success: false, 
          error: 'Invalid selection data format' 
        };
      }

      // 3. Get authenticated context
      const _context = await AuthenticationService.getAuthenticatedContext();

      // 4. Create use case and execute
      const supabase = AuthenticationService.createSupabaseClient();
      const factory = new RepositoryFactoryService(supabase);
      const useCase = factory.createUpdateSelectionUseCase();

      const result = await useCase.execute({
        selection: currentSelection,
        action: request.action as 'add' | 'remove' | 'toggle' | 'clear',
        itemId: request.itemId,
        itemType: request.itemType,
      });

      if (!result.isValid) {
        return { 
          success: false, 
          error: result.errors?.join(', ') || 'Selection update failed' 
        };
      }

      return {
        success: true,
        selection: result.selection
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 