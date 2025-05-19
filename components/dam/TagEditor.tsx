'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types/dam';
import { Tag } from '@/lib/actions/dam/tag.actions';
import {
  listTagsForOrganization,
  getAllTagsForOrganizationInternal,
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
  const [availableActiveTags, setAvailableActiveTags] = useState<Tag[]>([]); // Tags from listTagsForOrganization (active, not on current asset)
  const [allOrgTags, setAllOrgTags] = useState<Tag[]>([]); // All tags from getAllTagsForOrganizationInternal
  const [suggestions, setSuggestions] = useState<Tag[]>([]); // Filtered suggestions based on input (derived from availableActiveTags)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Fetch available tags for the organization and set initial suggestions
  useEffect(() => {
    const fetchTagsData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch all tags for existence checking
      const allTagsResult = await getAllTagsForOrganizationInternal(organizationId);
      if (allTagsResult.success && allTagsResult.data) {
        setAllOrgTags(allTagsResult.data);
      } else {
        setError(allTagsResult.error || 'Failed to fetch all organization tags.');
        setAllOrgTags([]);
        // Potentially stop further processing or handle error more gracefully
      }

      // Fetch active tags for suggestions (tags on other assets)
      const activeTagsResult = await listTagsForOrganization(organizationId);
      if (activeTagsResult.success && activeTagsResult.data) {
        const currentTagIds = new Set(currentTags.map(t => t.id));
        // availableActiveTags are those active in the org but not on the current asset
        const filteredActiveOrgTags = activeTagsResult.data.filter(orgTag => !currentTagIds.has(orgTag.id));
        setAvailableActiveTags(filteredActiveOrgTags);
        // setSuggestions(filteredActiveOrgTags); // This state is now derived differently or less critical
      } else {
        setError(prevError => prevError ? `${prevError}\n${activeTagsResult.error || 'Failed to fetch active tags.'}` : (activeTagsResult.error || 'Failed to fetch active tags.'));
        setAvailableActiveTags([]);
        // setSuggestions([]);
      }
      setIsLoading(false);
    };

    if (organizationId && isPopoverOpen) {
      fetchTagsData();
    } else if (!isPopoverOpen) {
      setInputValue(''); // Reset input when popover closes
      setError(null);
      setAvailableActiveTags([]); // Explicitly clear suggestions source when popover is closed
    }
  }, [organizationId, currentTags, isPopoverOpen]);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue === '') {
      // If input is empty, show all available (non-current) ACTIVE tags as primary suggestions
      const currentTagIds = new Set(currentTags.map(t => t.id));
      setSuggestions(availableActiveTags.filter(orgTag => !currentTagIds.has(orgTag.id)));
    } else {
      // Filter active tags for suggestions
      setSuggestions(
        availableActiveTags.filter(tag =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }
  }, [inputValue, availableActiveTags, currentTags]);

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
        setAvailableActiveTags([]);
        
        setIsPopoverOpen(false);
      } else {
        setError(result.error || 'Failed to add tag.');
        setAvailableActiveTags([]);
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setAvailableActiveTags([]);
      setIsLoading(false);
    }
  };

  const handleCreateOrAddTag = async (tagName: string) => {
    const trimmedTagName = tagName.trim();
    if (trimmedTagName === '') return;

    setIsLoading(true);
    setError(null);

    // Check if this tag name already exists in *any* capacity in the org (active or orphaned)
    const existingOrgTag = allOrgTags.find(t => t.name.toLowerCase() === trimmedTagName.toLowerCase());

    if (existingOrgTag) {
      // Tag name exists. Is it already on the current asset?
      const isAlreadyOnAsset = currentTags.some(ct => ct.id === existingOrgTag.id);
      if (isAlreadyOnAsset) {
        setError(`Tag "${trimmedTagName}" is already on this asset.`);
        setIsLoading(false);
        // Optionally close popover or clear input
        // setInputValue(''); 
        // setIsPopoverOpen(false);
        return;
      }
      // Tag exists in org but not on this asset, reuse it.
      await handleSelectSuggestion(existingOrgTag); // handleSelectSuggestion already sets loading to false
    } else {
      // Tag name does not exist in the org, proceed to create it.
      // This is the original handleCreateNewTag logic
      const createFormData = new FormData();
      createFormData.append('name', trimmedTagName);

      try {
        const createResult = await createTag(createFormData);
        if (createResult.success && createResult.data) {
          const newTag = createResult.data;
          
          // Add the newly created tag to the asset
          await handleSelectSuggestion(newTag); // Reuse logic to add to asset & update UI
        } else {
          setError(createResult.error || 'Failed to create new tag.');
          setIsLoading(false);
        }
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred during tag creation.');
        setIsLoading(false);
      }
    }
    // Note: handleSelectSuggestion sets isLoading to false at its end.
    // If we didn't call it (e.g. create failed before add), ensure isLoading is false.
    // This is handled within the branches above.
  };

  // Determine if the "create new" option should be shown
  // A tag can be created if the exact name isn't in allOrgTags AND isn't in currentTags
  const exactMatchInAllOrgTags = allOrgTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());
  const exactMatchInCurrentTags = currentTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());
  
  const canCreateNew = inputValue.trim() !== '' && !exactMatchInAllOrgTags && !exactMatchInCurrentTags;

  // Suggestions for display in the dropdown:
  let displaySuggestions: Tag[] = [];
  // Filter out tags already on the current asset from the available active tags once
  const activeTagsToShow = availableActiveTags.filter(orgTag => !currentTags.some(ct => ct.id === orgTag.id));

  if (inputValue.trim() !== '') { 
    displaySuggestions = activeTagsToShow.filter(tag => 
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Use the already calculated exactMatchInAllOrgTags and exactMatchInCurrentTags
    // (These were calculated above for canCreateNew)
    if (exactMatchInAllOrgTags && !exactMatchInCurrentTags) {
      const isAlreadySuggested = displaySuggestions.some(s => s.id === exactMatchInAllOrgTags.id);
      if (!isAlreadySuggested) {
        displaySuggestions = [exactMatchInAllOrgTags, ...displaySuggestions];
      }
    }
  } else {
    // If input is empty, display all non-current active tags (already filtered in activeTagsToShow)
    displaySuggestions = activeTagsToShow;
  }

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
              onValueChange={setInputValue} 
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : (canCreateNew ? "No existing tags match." : "No tags found or matches existing.")}
              </CommandEmpty>
              
              {isPopoverOpen && !isLoading && (
                <>
                  <CommandGroup heading="Suggestions">
                    {displaySuggestions.map(tag => (
                      <CommandItem
                        key={tag.id} 
                        value={tag.name} 
                        onSelect={() => handleSelectSuggestion(tag)} // Selects existing tag (active or orphaned if exact match)
                        className="cursor-pointer"
                      >
                        {tag.name}
                        {allOrgTags.find(t => t.id === tag.id) && !availableActiveTags.find(at => at.id === tag.id) && !currentTags.find(ct => ct.id === tag.id) && 
                          <span className="ml-2 text-xs text-muted-foreground">(previously used)</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {canCreateNew && (
                    <CommandGroup>
                      <CommandItem
                        key="create-new"
                        value={inputValue.trim()} 
                        onSelect={() => handleCreateOrAddTag(inputValue.trim())} // Changed from handleCreateNewTag
                        className="cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create "{inputValue.trim()}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                </>
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