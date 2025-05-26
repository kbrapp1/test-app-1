import { Selection } from '../../../domain/entities/Selection';
import { SelectionOperations } from '../../../domain/services/SelectionOperations';
import { SelectionValidator } from '../../../domain/services/SelectionValidator';
import { Asset } from '../../../domain/entities/Asset';
import { Folder } from '../../../domain/entities/Folder';
import { AppError, ValidationError } from '@/lib/errors/base';

export type SelectionAction = 'add' | 'remove' | 'toggle' | 'range' | 'all' | 'clear' | 'setMode';

interface UpdateSelectionUseCaseRequest {
  selection: Selection;
  action: SelectionAction;
  itemId?: string;
  itemType?: 'asset' | 'folder';
  items?: Array<Asset | Folder>;
  selectionMode?: 'none' | 'single' | 'multiple';
  startId?: string;
  endId?: string;
}

interface UpdateSelectionUseCaseResponse {
  selection: Selection;
  isValid: boolean;
  errors: string[];
}

/**
 * Update Selection Use Case - Application Layer
 * 
 * Handles all selection state updates following DDD principles.
 * Delegates complex operations to domain services.
 */
export class UpdateSelectionUseCase {
  public async execute(request: UpdateSelectionUseCaseRequest): Promise<UpdateSelectionUseCaseResponse> {
    const { selection, action, itemId, itemType, items, selectionMode, startId, endId } = request;

    if (!selection) {
      throw new ValidationError('Selection is required');
    }

    try {
      let updatedSelection: Selection;

      switch (action) {
        case 'add':
          updatedSelection = this.handleAddAction(selection, itemId, itemType);
          break;

        case 'remove':
          updatedSelection = this.handleRemoveAction(selection, itemId, itemType);
          break;

        case 'toggle':
          updatedSelection = this.handleToggleAction(selection, itemId, itemType);
          break;

        case 'range':
          updatedSelection = this.handleRangeAction(selection, startId, endId, items);
          break;

        case 'all':
          updatedSelection = this.handleSelectAllAction(selection, items);
          break;

        case 'clear':
          updatedSelection = selection.clearSelection();
          break;

        case 'setMode':
          updatedSelection = this.handleSetModeAction(selection, selectionMode);
          break;

        default:
          throw new ValidationError(`Unknown selection action: ${action}`);
      }

      // Validate the resulting selection
      const isValid = SelectionValidator.isValid(updatedSelection);
      const errors = isValid ? [] : ['Invalid selection state'];

      return {
        selection: updatedSelection,
        isValid,
        errors
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new ValidationError(`Selection update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private handleAddAction(selection: Selection, itemId?: string, itemType?: 'asset' | 'folder'): Selection {
    if (!itemId || !itemType) {
      throw new ValidationError('Item ID and type are required for add action');
    }

    return itemType === 'asset' 
      ? selection.addAsset(itemId)
      : selection.addFolder(itemId);
  }

  private handleRemoveAction(selection: Selection, itemId?: string, itemType?: 'asset' | 'folder'): Selection {
    if (!itemId || !itemType) {
      throw new ValidationError('Item ID and type are required for remove action');
    }

    return itemType === 'asset'
      ? selection.removeAsset(itemId)
      : selection.removeFolder(itemId);
  }

  private handleToggleAction(selection: Selection, itemId?: string, itemType?: 'asset' | 'folder'): Selection {
    if (!itemId || !itemType) {
      throw new ValidationError('Item ID and type are required for toggle action');
    }

    return itemType === 'asset'
      ? selection.toggleAsset(itemId)
      : selection.toggleFolder(itemId);
  }

  private handleRangeAction(
    selection: Selection, 
    startId?: string, 
    endId?: string, 
    items?: Array<Asset | Folder>
  ): Selection {
    if (!startId || !endId) {
      throw new ValidationError('Start ID and end ID are required for range action');
    }

    if (!items || items.length === 0) {
      throw new ValidationError('Items array is required for range selection');
    }

    return SelectionOperations.selectRange(selection, startId, endId, items);
  }

  private handleSelectAllAction(selection: Selection, items?: Array<Asset | Folder>): Selection {
    if (!items || items.length === 0) {
      throw new ValidationError('Items array is required for select all action');
    }

    return SelectionOperations.selectAll(selection, items);
  }

  private handleSetModeAction(
    selection: Selection, 
    selectionMode?: 'none' | 'single' | 'multiple'
  ): Selection {
    if (!selectionMode) {
      throw new ValidationError('Selection mode is required for setMode action');
    }

    return selection.setSelectionMode(selectionMode);
  }
} 