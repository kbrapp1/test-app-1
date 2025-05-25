'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { FolderBreadcrumbs } from '../../navigation/FolderBreadcrumbs';
import { NewFolderDialog } from '../../dialogs/NewFolderDialog';

interface GalleryHeaderProps {
  showNavigationUI: boolean;
  enableNavigation: boolean;
  folderNavigation?: any;
  activeFolderId: string | null;
  onRefresh: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  showNavigationUI,
  enableNavigation,
  folderNavigation,
  activeFolderId,
  onRefresh,
}) => {
  if (!showNavigationUI || !enableNavigation || !folderNavigation?.navigation) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Folder Navigation
        </h3>
        <div className="flex items-center space-x-2">
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
