'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { ListTagsUseCase } from '../../../application/use-cases/tags/ListTagsUseCase';
import { SupabaseTagRepository } from '../../../infrastructure/persistence/supabase/SupabaseTagRepository';
import { createClient } from '@/lib/supabase/client';

export interface UseTagFilterParams {
  organizationId: string | null;
  selectedTagIds: Set<string>;
  onTagFilterChange: (tagIds: Set<string>) => void;
}

export interface UseTagFilterReturn {
  // Tag data
  organizationTags: PlainTag[];
  isLoadingTags: boolean;
  
  // Selection state
  selectedTagIdsInPopover: Set<string>;
  setSelectedTagIdsInPopover: (tagIds: Set<string>) => void;
  
  // Popover state
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  
  // Actions
  handleTagSelect: (tagId: string) => void;
  handleApplyFilters: () => void;
  handleClearFilters: () => void;
  handleOpenChange: (open: boolean) => void;
  
  // UI state
  hasActiveFilters: boolean;
}

export function useTagFilter({
  organizationId,
  selectedTagIds,
  onTagFilterChange,
}: UseTagFilterParams): UseTagFilterReturn {
  const [organizationTags, setOrganizationTags] = useState<PlainTag[]>([]);
  const [selectedTagIdsInPopover, setSelectedTagIdsInPopover] = useState<Set<string>>(selectedTagIds);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Sync popover selection with external selection when popover is closed
  useEffect(() => {
    if (!isPopoverOpen) {
      setSelectedTagIdsInPopover(new Set(selectedTagIds));
    }
  }, [selectedTagIds, isPopoverOpen]);

  // Fetch tags when popover opens and we have an organization ID
  useEffect(() => {
    if (organizationId && isPopoverOpen && organizationTags.length === 0) {
      const fetchTags = async () => {
        setIsLoadingTags(true);
        try {
          const supabase = createClient();
          const tagRepository = new SupabaseTagRepository(supabase);
          const listTagsUseCase = new ListTagsUseCase(tagRepository);

          // Get tags for organization (only used/active tags)
          const tags = await listTagsUseCase.execute({
            organizationId,
            includeOrphaned: false,
          });

          // Convert domain entities to PlainTag DTOs
          const tagsDto: PlainTag[] = tags
            .map((tag: any) => ({
              id: tag.id,
              name: tag.name,
              userId: tag.userId,
              organizationId: tag.organizationId,
              createdAt: tag.createdAt,
              updatedAt: tag.updatedAt,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          setOrganizationTags(tagsDto);
        } catch (error) {
          console.error("Exception fetching organization tags:", error);
          setOrganizationTags([]);
        } finally {
          setIsLoadingTags(false);
        }
      };
      fetchTags();
    }
  }, [organizationId, isPopoverOpen, organizationTags.length]);

  const handleTagSelect = useCallback((tagId: string) => {
    setSelectedTagIdsInPopover(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    onTagFilterChange(new Set(selectedTagIdsInPopover));
    setIsPopoverOpen(false);
  }, [selectedTagIdsInPopover, onTagFilterChange]);

  const handleClearFilters = useCallback(() => {
    const newEmptySet = new Set<string>();
    setSelectedTagIdsInPopover(newEmptySet);
    onTagFilterChange(newEmptySet);
    setIsPopoverOpen(false);
  }, [onTagFilterChange]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      // When opening, ensure popover reflects the current URL state
      setSelectedTagIdsInPopover(new Set(selectedTagIds));
    }
  }, [selectedTagIds]);

  const hasActiveFilters = selectedTagIds.size > 0;

  return {
    // Tag data
    organizationTags,
    isLoadingTags,
    
    // Selection state
    selectedTagIdsInPopover,
    setSelectedTagIdsInPopover,
    
    // Popover state
    isPopoverOpen,
    setIsPopoverOpen,
    
    // Actions
    handleTagSelect,
    handleApplyFilters,
    handleClearFilters,
    handleOpenChange,
    
    // UI state
    hasActiveFilters,
  };
} 
