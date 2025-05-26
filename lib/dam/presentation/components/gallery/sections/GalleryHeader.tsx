'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, CheckSquare } from 'lucide-react';
import { FolderBreadcrumbs } from '../../navigation/FolderBreadcrumbs';
import { NewFolderDialog } from '../../dialogs/NewFolderDialog';

interface GalleryHeaderProps {
  showNavigationUI: boolean;
  enableNavigation: boolean;
  folderNavigation?: any;
  activeFolderId: string | null;
  onRefresh: () => void;
  // Multi-select props
  enableMultiSelect?: boolean;
  multiSelect?: any;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  showNavigationUI,
  enableNavigation,
  folderNavigation,
  activeFolderId,
  onRefresh,
  enableMultiSelect = false,
  multiSelect,
}) => {
  if (!showNavigationUI || !enableNavigation || !folderNavigation?.navigation) {
    return null; // Multi-select is now handled by workspace-level controls
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Folder Navigation
        </h3>
        <div className="flex items-center space-x-2">
          {enableMultiSelect && (
            <Button
              variant={multiSelect?.isSelecting ? "default" : "outline"}
              size="sm"
              onClick={multiSelect?.toggleSelectionMode}
              className="flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              {multiSelect?.isSelecting ? 'Exit Selection' : 'Select Items'}
            </Button>
          )}
          <NewFolderDialog
            currentFolderId={activeFolderId}
            asIcon={false}
            onFolderCreated={onRefresh}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={folderNavigation.goToRoot}
            disabled={folderNavigation.loading}
          >
            Go to Root
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={folderNavigation.refresh}
            disabled={folderNavigation.loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      <FolderBreadcrumbs
        navigation={folderNavigation.navigation}
        onNavigateToFolder={folderNavigation.navigateToFolder}
        loading={folderNavigation.loading}
      />
    </div>
  );
}; 
