'use client';

import React, { useState, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, LayoutGrid } from 'lucide-react';
import { AssetGalleryClient, type ViewMode } from './AssetGalleryClient';
import { DamSearchBar } from './DamSearchBar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DamPageClientViewProps {
  initialCurrentFolderId: string | null;
  initialCurrentSearchTerm: string;
}

export function DamPageClientView({ 
  initialCurrentFolderId, 
  initialCurrentSearchTerm,
}: DamPageClientViewProps) {
  const [currentFolderId, setCurrentFolderId] = useState(initialCurrentFolderId);
  const [gallerySearchTerm, setGallerySearchTerm] = useState(initialCurrentSearchTerm);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    setCurrentFolderId(initialCurrentFolderId);
  }, [initialCurrentFolderId]);

  useEffect(() => setGallerySearchTerm(initialCurrentSearchTerm), [initialCurrentSearchTerm]);

  return (
    <>
      <div className="flex items-center gap-4 w-full mb-6">
        <DamSearchBar currentFolderId={currentFolderId} gallerySearchTerm={gallerySearchTerm} />
        <div className="ml-auto shrink-0 mr-4">
          <TooltipProvider>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)} aria-label="View mode">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <LayoutGrid className="h-5 w-5" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Grid view</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-5 w-5" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>List view</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>
        </div>
      </div>
      <AssetGalleryClient 
        currentFolderId={currentFolderId} 
        initialSearchTerm={gallerySearchTerm} 
        viewMode={viewMode} 
      />
    </>
  );
} 