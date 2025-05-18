'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types/dam';
import { Tag } from '@/lib/actions/dam/tag.actions';
import {
  listTagsForOrganization,
  createTag,
} from '@/lib/actions/dam/tag.actions';
import { addTagToAsset } from '@/lib/actions/dam/asset-crud.actions'; // Corrected import path

// Shadcn UI components
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils"; // For conditional class names

interface TagEditorProps {
  assetId: string;
  organizationId: string;
  currentTags: Tag[];
  onTagAdded: (newlyAddedTag: Tag, allCurrentTags: Tag[]) => void; // Callback after a tag is successfully added
  // Consider onTagRemoved if this component also handles removal
}

export const TagEditor: React.FC<TagEditorProps> = ({
  assetId,
  organizationId,
  currentTags,
  onTagAdded,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]); // Tags available for org, not yet on asset
  const [suggestions, setSuggestions] = useState<Tag[]>([]); // Filtered suggestions based on input
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Fetch available tags for the organization and set initial suggestions
  useEffect(() => {
    const fetchOrgTags = async () => {
      setIsLoading(true);
      setError(null);
      const result = await listTagsForOrganization(organizationId);
      if (result.success && result.data) {
        const currentTagIds = new Set(currentTags.map(t => t.id));
        const filteredOrgTags = result.data.filter(orgTag => !currentTagIds.has(orgTag.id));
        setAvailableTags(filteredOrgTags);
        // Initially, suggestions can be all available tags or empty, 
        // will be refined by input
        setSuggestions(filteredOrgTags); 
      } else {
        setError(result.error || 'Failed to fetch tags.');
        setAvailableTags([]);
        setSuggestions([]);
      }
      setIsLoading(false);
    };

    if (organizationId && isPopoverOpen) { // Fetch when popover opens
      fetchOrgTags();
    } else if (!isPopoverOpen) {
      setInputValue(''); // Reset input when popover closes
      setError(null);
    }
  }, [organizationId, currentTags, isPopoverOpen]);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue === '') {
      // If input is empty, show all available (non-current) tags
      const currentTagIds = new Set(currentTags.map(t => t.id));
      setSuggestions(availableTags.filter(orgTag => !currentTagIds.has(orgTag.id)));
    } else {
      setSuggestions(
        availableTags.filter(tag =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }
  }, [inputValue, availableTags, currentTags]);

  const handleSelectSuggestion = async (tag: Tag) => {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('tagId', tag.id);

    try {
      const result = await addTagToAsset(formData);
      if (result.success) {
        onTagAdded(tag, [...currentTags, tag]);
        setInputValue('');
        setIsPopoverOpen(false);
        // Optimistically remove from available/suggestions if needed, or rely on useEffect re-fetch
        setAvailableTags(prev => prev.filter(t => t.id !== tag.id)); 
      } else {
        setError(result.error || 'Failed to add tag.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const handleCreateNewTag = async (tagName: string) => {
    if (tagName.trim() === '') return;
    setIsLoading(true);
    setError(null);

    // 1. Create the new tag
    const createFormData = new FormData();
    createFormData.append('name', tagName.trim());
    // organizationId is handled by createTag internally via getActiveOrganizationId

    try {
      const createResult = await createTag(createFormData);
      if (createResult.success && createResult.data) {
        const newTag = createResult.data;
        
        // 2. Add the newly created tag to the asset
        const addFormData = new FormData();
        addFormData.append('assetId', assetId);
        addFormData.append('tagId', newTag.id);
        
        const addResult = await addTagToAsset(addFormData);
        if (addResult.success) {
          onTagAdded(newTag, [...currentTags, newTag]);
          setInputValue('');
          setIsPopoverOpen(false);
          // New tag is not in availableTags, so no need to filter from there
        } else {
          setError(addResult.error || 'Failed to associate new tag with asset.');
          // Potentially offer to delete the created tag if association fails?
          // For now, the tag exists in the org but isn't on the asset.
        }
      } else {
        setError(createResult.error || 'Failed to create new tag.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during tag creation or addition.');
    }
    setIsLoading(false);
  };

  // Determine if the "create new" option should be shown
  const showCreateOption = inputValue.trim() !== '' && 
                         !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
                         !currentTags.some(ct => ct.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="py-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search or create tag..." 
              value={inputValue}
              onValueChange={setInputValue} // We will add filtering logic based on this soon
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : (showCreateOption ? "No existing tags match." : "No tags found.")}
              </CommandEmpty>
              {!isLoading && suggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestions.map(tag => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name} // value is used for Command navigation/filtering
                      onSelect={() => handleSelectSuggestion(tag)} // Pass the full tag object
                      className="cursor-pointer"
                    >
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!isLoading && showCreateOption && (
                <CommandItem
                  key="create-new"
                  value={inputValue.trim()} // Use input value for the create option
                  onSelect={() => handleCreateNewTag(inputValue.trim())}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{inputValue.trim()}"
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="mt-2 text-sm text-destructive">Error: {error}</p>}
    </div>
  );
};

TagEditor.displayName = 'TagEditor'; 