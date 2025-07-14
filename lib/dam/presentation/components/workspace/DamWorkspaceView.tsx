'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AssetGalleryClient } from '../gallery/AssetGalleryClient';
import { FolderPickerDialog } from '../dialogs/FolderPickerDialog';
import { WorkspaceHeader, WorkspaceFilters } from './layout';
import { useDamPageState } from '../../hooks/navigation/useDamPageState';
import { useDamPageHandlers } from '../../hooks/navigation/useDamPageHandlers';
import { useDamFilters } from '../../hooks/search/useDamFilters';
import { useAssetItemDialogs } from '../../hooks/assets/useAssetItemDialogs';
import { getFolderNavigation } from '../../../application/actions/navigation.actions';
import { DamErrorBoundary } from '../error/DamErrorBoundary';
import type { BreadcrumbItemData } from '../navigation';

export interface DamWorkspaceViewProps {
  initialCurrentFolderId: string | null;
  initialCurrentSearchTerm: string;
  breadcrumbPath: BreadcrumbItemData[];
}

/**
 * DamWorkspaceView - Domain-Driven DAM Workspace Component
 * 
 * Orchestrates the complete DAM workspace experience:
 * - Asset browsing and management
 * - Folder navigation and organization  
 * - Search and filtering capabilities
 * - Multi-view support (grid/list)
 * 
 * Follows DDD principles:
 * - Domain language: "workspace" vs technical "page" 
 * - Single responsibility: workspace coordination
 * - Clean separation: business logic in hooks, UI in layout components
 * - Proper dependencies: layout → domain → infrastructure
 */
export function DamWorkspaceView({ 
  initialCurrentFolderId, 
  initialCurrentSearchTerm,
  breadcrumbPath: initialBreadcrumbPath,
}: DamWorkspaceViewProps) {
  
  const router = useRouter();
  

  
  // Extract state management to domain hook
  const workspaceState = useDamPageState({
    initialCurrentFolderId,
    initialCurrentSearchTerm,
  });

  // Dynamic breadcrumb state
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItemData[]>(initialBreadcrumbPath);
  const [breadcrumbLoading, setBreadcrumbLoading] = useState(false);

  // Navigation handler that updates URL and triggers state changes
  const handleFolderNavigation = useCallback((folderId: string | null) => {
    const url = folderId ? `/dam?folderId=${folderId}` : '/dam';
    router.push(url);
  }, [router]);

  // Update breadcrumbs when folder navigation changes
  useEffect(() => {
    const updateBreadcrumbs = async () => {
      // Check if we already have the correct breadcrumbs
      const currentBreadcrumbFolder = breadcrumbPath[breadcrumbPath.length - 1]?.id;
      if (currentBreadcrumbFolder === workspaceState.currentFolderId) {
        return; // Already have correct breadcrumbs
      }

      if (workspaceState.currentFolderId === initialCurrentFolderId) {
        // Use initial breadcrumbs for the initial folder
        setBreadcrumbPath(initialBreadcrumbPath);
        return;
      }

      setBreadcrumbLoading(true);
      try {
    
        const { breadcrumbs } = await getFolderNavigation(workspaceState.currentFolderId);
        setBreadcrumbPath(breadcrumbs);
      } catch (error) {
        console.error('Failed to update breadcrumbs:', error);
        // Fallback to basic breadcrumb
        setBreadcrumbPath([
          { id: null, name: 'Root', href: '/dam' },
          ...(workspaceState.currentFolderId ? [{ 
            id: workspaceState.currentFolderId, 
            name: 'Current Folder', 
            href: `/dam?folderId=${workspaceState.currentFolderId}` 
          }] : [])
        ]);
      } finally {
        setBreadcrumbLoading(false);
      }
    };

    updateBreadcrumbs();
  }, [workspaceState.currentFolderId, initialCurrentFolderId, initialBreadcrumbPath, breadcrumbPath]);

  // Listen for folder updates to refresh breadcrumbs
  useEffect(() => {
    const handleFolderUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, folderId, newName: _newName } = customEvent.detail;
      
      // If the renamed folder is in our current breadcrumb path, refresh breadcrumbs
      if (type === 'rename') {
        const isInBreadcrumbPath = breadcrumbPath.some(crumb => crumb.id === folderId);
        const isCurrentFolder = workspaceState.currentFolderId === folderId;
        
        if (isInBreadcrumbPath || isCurrentFolder) {
          setBreadcrumbLoading(true);
          try {
      
            const { breadcrumbs } = await getFolderNavigation(workspaceState.currentFolderId);
            setBreadcrumbPath(breadcrumbs);
          } catch (error) {
            console.error('Failed to update breadcrumbs after folder rename:', error);
          } finally {
            setBreadcrumbLoading(false);
          }
        }
      }
    };

    window.addEventListener('folderUpdated', handleFolderUpdate);
    return () => window.removeEventListener('folderUpdated', handleFolderUpdate);
  }, [breadcrumbPath, workspaceState.currentFolderId]);

  // Extract filter management (already domain-driven)
  const {
    filterType,
    setFilterType,
    filterCreationDateOption,
    setFilterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    setFilterOwnerId,
    filterSizeOption,
    setFilterSizeOption,
    filterSizeMin,
    filterSizeMax,
    sortBy,
    sortOrder,
    currentTagIds,
    isAnyFilterActive,
    clearAllFilters,
    updateUrlParams,
  } = useDamFilters(workspaceState.currentFolderId);

  // Extract business logic handlers to domain hook
  const workspaceHandlers = useDamPageHandlers({
    updateUrlParams,
    handleGalleryRefresh: workspaceState.handleGalleryRefresh,
    closeMoveDialog: () => {}, // Will be handled below
  });

  // Extract move dialog management
  const {
    moveDialog,
    closeMoveDialog,
  } = useAssetItemDialogs();

  // Multi-select state management - always enabled with hover-based selection
  const [selectedCount, setSelectedCount] = useState(0);



  // Handle asset move with proper domain entity conversion
  const handleMoveAssetConfirm = async (selectedFolderId: string | null) => {
    if (!moveDialog.data) return;
    await workspaceHandlers.handleMoveAssetConfirm(selectedFolderId, moveDialog.data);
  };

  return (
    <DamErrorBoundary>
      <div 
        className="flex flex-col"
        style={{
          height: selectedCount > 0 ? 'calc(100% - 7rem)' : '100%',
          transition: 'height 0.3s ease-out'
        }}
      >
        <div className="pl-1 pr-4 pt-2 pb-4 md:pl-1 md:pr-6 md:pt-2 md:pb-6 space-y-4">
          <WorkspaceHeader
            gallerySearchTerm={workspaceState.gallerySearchTerm}
            currentFolderId={workspaceState.currentFolderId}
            breadcrumbPath={breadcrumbPath}
            breadcrumbLoading={breadcrumbLoading}
          />
          
          <WorkspaceFilters
            filterType={filterType}
            filterCreationDateOption={filterCreationDateOption}
            filterDateStart={filterDateStart}
            filterDateEnd={filterDateEnd}
            filterOwnerId={filterOwnerId}
            filterSizeOption={filterSizeOption}
            filterSizeMin={filterSizeMin}
            filterSizeMax={filterSizeMax}
            sortBy={sortBy}
            sortOrder={sortOrder}
            isAnyFilterActive={isAnyFilterActive}
            selectedCount={selectedCount}
            setFilterType={setFilterType}
            setFilterCreationDateOption={setFilterCreationDateOption}
            setFilterOwnerId={setFilterOwnerId}
            setFilterSizeOption={setFilterSizeOption}
            handleSortChange={workspaceHandlers.handleSortChange}
            clearAllFilters={clearAllFilters}
          />
        </div>

        <div className="flex-1">
        <AssetGalleryClient 
          key={`${workspaceState.currentFolderId || 'root'}`}
          viewMode={workspaceState.viewMode} 
          currentFolderId={workspaceState.currentFolderId}
          searchTerm={workspaceState.gallerySearchTerm}
          tagIds={currentTagIds}
          filterType={filterType}
          filterCreationDateOption={filterCreationDateOption}
          filterDateStart={filterDateStart}
          filterDateEnd={filterDateEnd}
          filterOwnerId={filterOwnerId}
          filterSizeOption={filterSizeOption}
          filterSizeMin={filterSizeMin}
          filterSizeMax={filterSizeMax}
          sortBy={sortBy ? String(sortBy) : undefined}
          sortOrder={sortOrder ? String(sortOrder) : undefined}
          enableNavigation={true}
          showNavigationUI={false}
          onFolderNavigate={handleFolderNavigation}
          enableMultiSelect={true}
          onSelectionChange={(selectedAssets, selectedFolders) => {
            setSelectedCount(selectedAssets.length + selectedFolders.length);
          }}
        />
        </div>



        {/* Render FolderPickerDialog for moving assets */}
        {moveDialog.isOpen && moveDialog.data && (
          <FolderPickerDialog
            isOpen={moveDialog.isOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                closeMoveDialog();
              }
            }}
            onFolderSelect={handleMoveAssetConfirm}
            currentAssetFolderId={moveDialog.data.folderId}
            assetName={moveDialog.data.name}
          />
        )}
      </div>
    </DamErrorBoundary>
  );
} 
