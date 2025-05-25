'use client';

import React from 'react';
import { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { useTagEditor } from '../../hooks/gallery/useTagEditor';
import { TagSuggestionList } from './TagSuggestionList';
import { TagCreationOption } from './TagCreationOption';
import { TagEditorEmptyState } from './TagEditorEmptyState';

// Shadcn UI components
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Search, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DomainTagEditorProps {
  assetId: string;
  organizationId: string;
  currentTags: PlainTag[];
  onTagAdded: (newlyAddedTag: PlainTag, allCurrentTags: PlainTag[]) => void;
}

/**
 * DomainTagEditor - Domain-Driven Tag Management Component
 * 
 * Refactored to follow DDD best practices:
 * - Single responsibility: orchestrates tag editing UI
 * - Domain-focused: uses extracted business logic hook
 * - Clean separation: extracted UI components and business logic
 * - Maintainable: ~80 lines with clear structure
 */
export const DomainTagEditor: React.FC<DomainTagEditorProps> = ({
  assetId,
  organizationId,
  currentTags,
  onTagAdded,
}) => {
  // Extract all business logic to domain hook
  const tagEditor = useTagEditor({
    assetId,
    organizationId,
    currentTags,
    onTagAdded,
  });

  return (
    <div className="space-y-3">
      <Popover open={tagEditor.isPopoverOpen} onOpenChange={tagEditor.handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 border-dashed border-2 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all duration-200",
              "bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-100/70 hover:to-purple-100/70",
              tagEditor.isPopoverOpen && "border-blue-400 bg-blue-50 text-blue-700"
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
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <TagIcon className="mr-2 h-4 w-4" />
              Tag Manager
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative border-b border-gray-100">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search or create tag..."
              value={tagEditor.inputValue}
              onChange={(e) => tagEditor.setInputValue(e.target.value)}
              className="w-full pl-9 pr-3 py-3 text-sm border-0 focus:outline-none focus:ring-0"
            />
          </div>
          
          {/* Scrollable Content Area */}
          <div 
            className="max-h-64 overflow-y-auto focus:outline-none"
            onMouseEnter={(e) => e.currentTarget.focus()}
            onWheel={(e) => {
              // Allow natural scrolling but ensure it's handled
              e.stopPropagation();
            }}
          >
            <Command className="border-0">
              {/* Empty State */}
              {tagEditor.displaySuggestions.length === 0 && !tagEditor.canCreateNew && (
                <TagEditorEmptyState 
                  isLoading={tagEditor.isLoading}
                  canCreateNew={tagEditor.canCreateNew}
                />
              )}
              
              {/* Content when not loading */}
              {!tagEditor.isLoading && (
                <>
                  {/* Existing Tags */}
                  <TagSuggestionList
                    displaySuggestions={tagEditor.displaySuggestions}
                    allOrgTags={tagEditor.allOrgTags}
                    availableActiveTags={tagEditor.availableActiveTags}
                    currentTags={currentTags}
                    onSelectSuggestion={tagEditor.handleSelectSuggestion}
                  />

                  {/* Create New Tag Option */}
                  <TagCreationOption
                    canCreateNew={tagEditor.canCreateNew}
                    inputValue={tagEditor.inputValue}
                    hasExistingSuggestions={tagEditor.displaySuggestions.length > 0}
                    onCreateOrAddTag={tagEditor.handleCreateOrAddTag}
                  />
                </>
              )}
              
              {/* Loading State */}
              {tagEditor.isLoading && (
                <div className="py-6 text-center">
                  <div className="text-gray-400">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <p className="text-sm">Loading tags...</p>
                    </div>
                  </div>
                </div>
              )}
            </Command>
          </div>
          
          {/* Error Display */}
          {tagEditor.error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {tagEditor.error}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

DomainTagEditor.displayName = 'DomainTagEditor'; 
