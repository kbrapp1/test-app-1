import { useEffect } from 'react';
import { useFolderNavigation } from '../../../navigation/useFolderNavigation';
import { useAssetUpload } from '../../useAssetUpload';
import { useGalleryDialogs } from '../../../navigation/useGalleryDialogs';
import { useAssetItemDialogs } from '../../useAssetItemDialogs';

interface GalleryStateManagerProps {
  currentFolderId: string | null;
  enableNavigation: boolean;
  onFolderNavigate?: (folderId: string | null) => void;
  refreshGalleryData: () => void;
}

/**
 * GalleryStateManager - Presentation Layer Service
 * 
 * Single Responsibility: Coordinate gallery state and integrate external services
 * Follows DDD principles by managing service coordination and navigation logic
 */
export const useGalleryStateManager = (props: GalleryStateManagerProps) => {
  const { currentFolderId, enableNavigation, onFolderNavigate, refreshGalleryData } = props;

  // Domain hooks - only use internal navigation if no custom handler provided
  const folderNavigation = useFolderNavigation(currentFolderId);
  const activeFolderId = (enableNavigation && !onFolderNavigate) ? folderNavigation.currentFolderId : currentFolderId;
  
  // Service integrations
  const upload = useAssetUpload({
    folderId: activeFolderId,
    onUploadComplete: refreshGalleryData,
  });

  const dialogManager = useGalleryDialogs();
  const assetItemDialogs = useAssetItemDialogs();

  // Refresh on navigation changes - only for internal navigation
  useEffect(() => {
    if (enableNavigation && !onFolderNavigate && folderNavigation.currentFolderId !== null) {
      refreshGalleryData();
    }
  }, [folderNavigation.currentFolderId, enableNavigation, onFolderNavigate, refreshGalleryData]);

  return {
    // Computed state
    activeFolderId,
    
    // Service hooks
    folderNavigation,
    upload,
    dialogManager,
    assetItemDialogs,
  };
}; 