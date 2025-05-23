'use client';

import React, { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter as FilterIcon, Loader2 } from 'lucide-react';
import type { PlainTag } from '@/lib/actions/dam/tag.actions';
import { listTagsForOrganizationForClient } from '@/lib/actions/dam/tag.actions';

interface DamTagFilterProps {
  activeOrgId: string | null;
  initialSelectedTagIdsFromUrl: Set<string>;
  onFilterChange: (newTagIds: Set<string>) => void;
  tooltipText?: string;
}

export function DamTagFilter({
  activeOrgId,
  initialSelectedTagIdsFromUrl,
  onFilterChange,
  tooltipText = "Filter by tags"
}: DamTagFilterProps) {
  const [organizationTags, setOrganizationTags] = useState<PlainTag[]>([]);
  const [selectedTagIdsInPopover, setSelectedTagIdsInPopover] = useState<Set<string>>(initialSelectedTagIdsFromUrl);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Sync selectedTagIdsInPopover with initialSelectedTagIdsFromUrl when it changes AND popover is not open
  // This ensures that if the URL changes due to external navigation, the popover starts fresh.
  // If the popover is open, the user's current selections are preserved until apply/clear.
  useEffect(() => {
    if (!isTagPopoverOpen) {
      setSelectedTagIdsInPopover(new Set(initialSelectedTagIdsFromUrl));
    }
  }, [initialSelectedTagIdsFromUrl, isTagPopoverOpen]);


  useEffect(() => {
    if (activeOrgId && isTagPopoverOpen && organizationTags.length === 0) { // Fetch tags only if popover is open, orgId available, and tags not yet fetched
      const fetchTags = async () => {
        setIsLoadingTags(true);
        try {
          const result = await listTagsForOrganizationForClient(activeOrgId);
          if (result.success && result.data) {
            setOrganizationTags(result.data.sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            console.error("Failed to fetch organization tags:", result.error);
            setOrganizationTags([]); 
          }
        } catch (error) {
          console.error("Exception fetching organization tags:", error);
          setOrganizationTags([]);
        } finally {
          setIsLoadingTags(false);
        }
      };
      fetchTags();
    }
  }, [activeOrgId, isTagPopoverOpen, organizationTags.length]);

  const handleTagSelect = (tagId: string) => {
    setSelectedTagIdsInPopover(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleApplyTagFilters = () => {
    onFilterChange(new Set(selectedTagIdsInPopover)); 
    setIsTagPopoverOpen(false);
  };

  const handleClearTagFilters = () => {
    const newEmptySet = new Set<string>();
    setSelectedTagIdsInPopover(newEmptySet); // Clear selection in popover
    onFilterChange(newEmptySet); 
    setIsTagPopoverOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsTagPopoverOpen(open);
    if (open) {
      // When opening, ensure popover reflects the current URL state
      setSelectedTagIdsInPopover(new Set(initialSelectedTagIdsFromUrl));
    }
  };


  const hasActiveUrlFilters = initialSelectedTagIdsFromUrl.size > 0;

  return (
    <Popover open={isTagPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className={`relative ${hasActiveUrlFilters ? 'border-primary ring-1 ring-primary' : ''}`}>
          <FilterIcon className="h-5 w-5" />
          {hasActiveUrlFilters && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {initialSelectedTagIdsFromUrl.size}
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
              {organizationTags.map((tag) => (
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
            onClick={handleClearTagFilters}
            disabled={selectedTagIdsInPopover.size === 0 && initialSelectedTagIdsFromUrl.size === 0}
          >
            Clear
          </Button>
          <Button size="sm" onClick={handleApplyTagFilters}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 