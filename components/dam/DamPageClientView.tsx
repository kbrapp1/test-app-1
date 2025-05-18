'use client';

import React, { useState, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, LayoutGrid } from 'lucide-react';
import { AssetGalleryClient, type ViewMode } from './AssetGalleryClient';
import { DamSearchBar } from './DamSearchBar';

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

  // Effect to load viewMode from localStorage on mount
  useEffect(() => {
    const storedViewMode = localStorage.getItem('damViewMode') as ViewMode | null;
    if (storedViewMode && (storedViewMode === 'grid' || storedViewMode === 'list')) {
      setViewMode(storedViewMode);
    }
    // No need to set a default here if localStorage is empty, useState default handles it.
  }, []); // Empty dependency array ensures this runs only on mount

  // Effect to save viewMode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('damViewMode', viewMode);
  }, [viewMode]);

  return (
    <>
      <div className="flex items-center gap-4 w-full mb-6">
        <DamSearchBar currentFolderId={currentFolderId} gallerySearchTerm={gallerySearchTerm} />
        <div className="ml-auto shrink-0 mr-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)} aria-label="View mode">
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
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