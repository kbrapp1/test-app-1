'use client';

import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter as FilterIcon, Loader2 } from 'lucide-react';
import type { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { useTagFilter } from '../../hooks/search/useTagFilter';

interface DamTagFilterProps {
  organizationId: string | null;
  selectedTagIds: Set<string>;
  onTagFilterChange: (newTagIds: Set<string>) => void;
  tooltipText?: string;
}

export function DamTagFilter({
  organizationId,
  selectedTagIds,
  onTagFilterChange,
  tooltipText = "Filter by tags"
}: DamTagFilterProps) {
  const {
    organizationTags,
    isLoadingTags,
    selectedTagIdsInPopover,
    isPopoverOpen,
    handleTagSelect,
    handleApplyFilters,
    handleClearFilters,
    handleOpenChange,
    hasActiveFilters,
  } = useTagFilter({
    organizationId,
    selectedTagIds,
    onTagFilterChange,
  });

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={`relative ${hasActiveFilters ? 'border-primary ring-1 ring-primary' : ''}`}
        >
          <FilterIcon className="h-5 w-5" />
          {hasActiveFilters && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {selectedTagIds.size}
            </Badge>
          )}
          <span className="sr-only">{tooltipText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium leading-none">Filter by Tags</h4>
          <p className="text-sm text-muted-foreground">
            Select tags to filter assets.
          </p>
        </div>
        {isLoadingTags ? (
          <div className="p-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
            Loading tags...
          </div>
        ) : organizationTags.length > 0 ? (
          <ScrollArea className="h-auto max-h-60">
            <div className="p-4 space-y-2">
              {organizationTags.map((tag: PlainTag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-filter-${tag.id}`}
                    checked={selectedTagIdsInPopover.has(tag.id)}
                    onCheckedChange={() => handleTagSelect(tag.id)}
                  />
                  <label
                    htmlFor={`tag-filter-${tag.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No tags available for this organization.
          </p>
        )}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={selectedTagIdsInPopover.size === 0 && selectedTagIds.size === 0}
          >
            Clear
          </Button>
          <Button size="sm" onClick={handleApplyFilters}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
