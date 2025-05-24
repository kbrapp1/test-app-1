'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/lib/dam/domain/entities/Tag';
import {
  listTagsForOrganizationForClient,
  getAllTagsForOrganizationInternalForClient,
  createTagForClient,
  PlainTag,
} from '@/lib/actions/dam/tag.actions';
import { addTagToAsset } from '@/lib/actions/dam/asset-crud.actions';

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
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Plus, Search, Sparkles, Tag as TagIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DomainTagEditorProps {
  assetId: string;
  organizationId: string;
  currentTags: PlainTag[];
  onTagAdded: (newlyAddedTag: PlainTag, allCurrentTags: PlainTag[]) => void;
}

export const DomainTagEditor: React.FC<DomainTagEditorProps> = ({
  assetId,
  organizationId,
  currentTags,
  onTagAdded,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [availableActiveTags, setAvailableActiveTags] = useState<PlainTag[]>([]);
  const [allOrgTags, setAllOrgTags] = useState<PlainTag[]>([]);
  const [suggestions, setSuggestions] = useState<PlainTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setError(null);     // Clear any previous errors
    } else {
      // Reset input when popover is closed (e.g., by clicking outside)
      setInputValue('');
      // Other cleanup (like tag lists, suggestions, isLoading) is handled by the useEffect below
    }
  }, [setIsPopoverOpen, setError, setInputValue]);

  // Fetch available tags for the organization and set initial suggestions
  useEffect(() => {
    const fetchTagsData = async () => {
      setIsLoading(true);
      setError(null);
      let fetchedAllOrgTags: PlainTag[] = [];
      let fetchedAvailableActiveTags: PlainTag[] = [];
      let combinedError: string | null = null;
      try {
        const allTagsResult = await getAllTagsForOrganizationInternalForClient(organizationId);
        if (allTagsResult.success && allTagsResult.data) {
          fetchedAllOrgTags = allTagsResult.data;
        } else {
          combinedError = allTagsResult.error || 'Failed to fetch organization tags.';
        }
        const activeTagsResult = await listTagsForOrganizationForClient(organizationId);
        if (activeTagsResult.success && activeTagsResult.data) {
          fetchedAvailableActiveTags = activeTagsResult.data;
        } else {
          const activeError = activeTagsResult.error || 'Failed to fetch active tags.';
          combinedError = combinedError ? `${combinedError}\n${activeError}` : activeError;
        }
      } catch (e: any) {
        combinedError = e.message || 'An unexpected error occurred during tag data fetch.';
      }
      setAllOrgTags(fetchedAllOrgTags);
      setAvailableActiveTags(fetchedAvailableActiveTags);
      if (combinedError) {
        setError(combinedError);
      }
      setIsLoading(false);
    };
    if (organizationId) {
      fetchTagsData();
    }
  }, [organizationId]);

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

  const handleSelectSuggestion = async (tag: PlainTag) => {
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
        setIsLoading(false);
      } else {
        setError(result.error || 'Failed to add tag.');
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
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
        return;
      }
      // Tag exists in org but not on this asset, reuse it.
      await handleSelectSuggestion(existingOrgTag);
    } else {
      // Tag name does not exist in the org, proceed to create it.
      const createFormData = new FormData();
      createFormData.append('name', trimmedTagName);

      try {
        const createResult = await createTagForClient(createFormData);
        if (createResult.success && createResult.data) {
          const newTag = createResult.data;
          
          // Add the newly created tag to the asset
          await handleSelectSuggestion(newTag);
        } else {
          setError(createResult.error || 'Failed to create new tag.');
          setIsLoading(false);
        }
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred during tag creation.');
        setIsLoading(false);
      }
    }
  };

  // Determine if the "create new" option should be shown
  const exactMatchInAllOrgTags = allOrgTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());
  const exactMatchInCurrentTags = currentTags.find(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());
  
  const canCreateNew = inputValue.trim() !== '' && !exactMatchInAllOrgTags && !exactMatchInCurrentTags;

  // Suggestions for display in the dropdown
  let displaySuggestions: PlainTag[] = [];
  const activeTagsToShow = availableActiveTags.filter(orgTag => !currentTags.some(ct => ct.id === orgTag.id));

  if (inputValue.trim() !== '') { 
    displaySuggestions = activeTagsToShow.filter(tag => 
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    if (exactMatchInAllOrgTags && !exactMatchInCurrentTags) {
      const isAlreadySuggested = displaySuggestions.some(s => s.id === exactMatchInAllOrgTags.id);
      if (!isAlreadySuggested) {
        displaySuggestions = [exactMatchInAllOrgTags, ...displaySuggestions];
      }
    }
  } else {
    displaySuggestions = activeTagsToShow;
  }

  return (
    <div className="space-y-3">
      <Popover onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 border-dashed border-2 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200",
              "bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-100/70 hover:to-purple-100/70",
              isPopoverOpen && "border-blue-400 bg-blue-50 text-blue-700"
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-0 shadow-xl border-gray-200" 
          align="start"
          sideOffset={8}
        >
          <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <TagIcon className="mr-2 h-4 w-4" />
              Tag Manager
            </div>
          </div>
          
          <Command className="border-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <CommandInput 
                placeholder="Search or create tag..." 
                value={inputValue}
                onValueChange={setInputValue}
                className="pl-9 border-0 focus:ring-0 h-12 text-sm"
              />
            </div>
            
            <CommandList className="max-h-64">
              <CommandEmpty className="py-6 text-center">
                <div className="text-gray-400">
                  {isLoading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Loading tags...</p>
                    </div>
                  ) : canCreateNew ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Sparkles className="h-6 w-6" />
                      <p className="text-sm font-medium">Ready to create new tag</p>
                      <p className="text-xs text-gray-500">Press Enter or click below</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <TagIcon className="h-6 w-6" />
                      <p className="text-sm">No matching tags found</p>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              
              {isPopoverOpen && !isLoading && (
                <>
                  {displaySuggestions.length > 0 && (
                    <CommandGroup>
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Existing Tags
                      </div>
                      {displaySuggestions.map((tag, index) => {
                        const isReused = allOrgTags.find(t => t.id === tag.id) && !availableActiveTags.find(at => at.id === tag.id) && !currentTags.find(ct => ct.id === tag.id);
                        
                        return (
                          <CommandItem
                            key={tag.id} 
                            value={tag.name} 
                            onSelect={() => handleSelectSuggestion(tag)}
                            className={cn(
                              "cursor-pointer mx-2 rounded-md px-3 py-2.5 transition-all duration-150",
                              "bg-white text-gray-700",
                              "data-[selected]:bg-white data-[selected]:text-gray-700 data-[selected]:focus:bg-white data-[selected]:focus:text-gray-700",
                              "hover:bg-blue-100 hover:text-blue-900",
                              "focus:bg-blue-100 focus:text-blue-900",
                              "group relative"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-xs px-2 py-1 transition-colors duration-150",
                                    "bg-white text-gray-700 border-gray-300",
                                    "group-data-[selected]:bg-white group-data-[selected]:text-gray-700 group-data-[selected]:border-gray-300 group-data-[selected]:focus:bg-white group-data-[selected]:focus:text-gray-700",
                                    "group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500",
                                    "group-focus:bg-blue-600 group-focus:text-white group-focus:border-blue-500"
                                  )}
                                >
                                  {tag.name}
                                </Badge>
                                {isReused && (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                    Previously used
                                  </span>
                                )}
                              </div>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-150" />
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}

                  {canCreateNew && (
                    <>
                      {displaySuggestions.length > 0 && <CommandSeparator className="my-1" />}
                      <CommandGroup>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Create New
                        </div>
                        <CommandItem
                          key="create-new"
                          value={inputValue.trim()} 
                          onSelect={() => handleCreateOrAddTag(inputValue.trim())}
                          className={cn(
                            "cursor-pointer mx-2 rounded-md px-3 py-2.5 transition-all duration-150",
                            "hover:bg-green-50 hover:text-green-900 data-[selected]:bg-green-100 data-[selected]:text-green-900",
                            "group relative border border-dashed border-green-200 hover:border-green-300"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <PlusCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Create "{inputValue.trim()}"</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-green-200 text-green-700 group-hover:border-green-300 group-hover:bg-green-50"
                            >
                              New
                            </Badge>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
          
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {error}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

DomainTagEditor.displayName = 'DomainTagEditor'; 