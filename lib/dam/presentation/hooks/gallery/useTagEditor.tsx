import { useState, useEffect, useCallback } from 'react';
import { PlainTag } from '../../../application/dto/DamApiRequestDto';
import {
  UseTagEditorProps,
  UseTagEditorReturn,
  TagEditorDataService,
  TagEditorComputationService
} from '../services';

/**
 * Domain-driven hook for tag editor management
 * 
 * REFACTORED TO DDD ARCHITECTURE:
 * - Uses dedicated services for data operations and computations
 * - Maintains clean separation of concerns with DDD layers
 * - Focuses solely on state coordination and React lifecycle
 * - Provides proper error handling and loading states
 * - Follows single responsibility principle
 */
export const useTagEditor = ({ 
  assetId, 
  organizationId, 
  currentTags, 
  onTagAdded 
}: UseTagEditorProps): UseTagEditorReturn => {
  // State management
  const [inputValue, setInputValue] = useState('');
  const [availableActiveTags, setAvailableActiveTags] = useState<PlainTag[]>([]);
  const [allOrgTags, setAllOrgTags] = useState<PlainTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Service instances for data operations and computations
  const computationService = new TagEditorComputationService();

  // Popover handlers
  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setError(null);
      setInputValue('');
    }
  }, []);

  // Fetch organization tags data using DDD service
  const fetchTagsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dataService = new TagEditorDataService();
      const { allTags, usedTags } = await dataService.fetchTagsData(organizationId);
      
      setAllOrgTags(allTags);
      setAvailableActiveTags(usedTags);

    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during tag data fetch.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Load tags on mount and organization change
  useEffect(() => {
    if (organizationId) {
      fetchTagsData();
    }
  }, [organizationId, fetchTagsData]);

  // Handle tag selection using DDD service
  const handleSelectSuggestion = useCallback(async (tag: PlainTag) => {
    setIsLoading(true);
    setError(null);

    let success = false;
    try {
      const dataService = new TagEditorDataService();
      await dataService.addTagToAsset(assetId, tag.id);

      onTagAdded(tag, [...currentTags, tag]);
      success = true;
    } catch (e: any) {
      setError(e.message || 'Failed to add tag.');
    } finally {
      setIsLoading(false);
      if (success) {
        setIsPopoverOpen(false);
      }
    }
  }, [assetId, currentTags, onTagAdded]);

  // Handle tag creation using DDD service
  const handleCreateOrAddTag = useCallback(async (tagName: string) => {
    const trimmedTagName = tagName.trim();
    if (trimmedTagName === '') return;

    setIsLoading(true);
    setError(null);

    // Check if tag name exists in organization using computation service
    const existingOrgTag = computationService.findExistingTag(trimmedTagName, allOrgTags);

    if (existingOrgTag) {
      // Tag exists - check if already on asset
      const isAlreadyOnAsset = computationService.isTagAlreadyOnAsset(trimmedTagName, currentTags);
      if (isAlreadyOnAsset) {
        setError(`Tag "${trimmedTagName}" is already on this asset.`);
        setIsLoading(false);
        return;
      }
      // Reuse existing tag
      await handleSelectSuggestion(existingOrgTag);
    } else {
      // Create new tag using DDD service
      try {
        const dataService = new TagEditorDataService();
        const newTagDto = await dataService.createTag(trimmedTagName);
        await handleSelectSuggestion(newTagDto);
      } catch (e: any) {
        setError(e.message || 'Failed to create new tag.');
        setIsLoading(false);
      }
    }
  }, [allOrgTags, currentTags, handleSelectSuggestion, computationService]);

  // Calculate display suggestions using computation service
  const displaySuggestions = computationService.getDisplaySuggestions(
    inputValue,
    availableActiveTags,
    currentTags,
    allOrgTags
  );

  // Calculate create new availability using computation service
  const canCreateNew = computationService.getCanCreateNew(
    inputValue,
    allOrgTags,
    currentTags
  );

  return {
    // State
    inputValue,
    availableActiveTags,
    allOrgTags,
    isLoading,
    error,
    isPopoverOpen,
    
    // Actions
    setInputValue,
    setError,
    handlePopoverOpenChange,
    handleSelectSuggestion,
    handleCreateOrAddTag,
    fetchTagsData,
    
    // Computed data
    displaySuggestions,
    canCreateNew,
  };
}; 
