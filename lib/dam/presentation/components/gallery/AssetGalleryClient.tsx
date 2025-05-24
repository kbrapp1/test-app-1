"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GalleryItemDto } from '../../../application/use-cases/ListFolderContentsUseCase';
import { useDamGalleryData } from '../../hooks/useDamGalleryData';
import { useFolderNavigation } from '../../hooks/useFolderNavigation';
import { useAssetUpload } from '../../hooks/useAssetUpload';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Folder, FileText, Image, Video, Music, File, Eye, Navigation, MoreHorizontal, Edit3, Trash2, Upload, X } from 'lucide-react';
import { AssetDetailsModal } from '../dialogs/AssetDetailsModal';
import { FolderBreadcrumbs } from '../navigation/FolderBreadcrumbs';import { NewFolderDialog } from '../dialogs/NewFolderDialog';import { RenameFolderDialog } from '../dialogs/RenameFolderDialog';import { DeleteFolderDialog } from '../dialogs/DeleteFolderDialog';import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Domain presentation interfaces
import type { AssetGalleryProps } from '../../types/interfaces';

/**
 * AssetGalleryClient - Domain-Driven Client Component with Navigation
 * 
 * This component demonstrates proper DDD presentation patterns:
 * - Uses domain DTOs instead of API response types
 * - Delegates data fetching to domain-aware hooks
 * - Integrates folder navigation with domain use cases
 * - Clean separation between UI and business logic
 * - Type-safe interaction with domain entities
 */

interface DomainAssetGalleryClientProps {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  viewMode: 'grid' | 'list';
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: string;
  filterSizeMax?: string;
  sortBy?: string;
  sortOrder?: string;
  enableNavigation?: boolean; // New prop to enable/disable navigation
  showNavigationUI?: boolean; // New prop to show/hide navigation UI elements
}

// Safe date formatting helper with relative dates
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    
    // For older dates, show formatted date
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    return 'Unknown date';
  }
};

export const AssetGalleryClient: React.FC<DomainAssetGalleryClientProps> = (props) => {
  const { 
    currentFolderId, 
    searchTerm, 
    viewMode,
    enableNavigation = false,
    showNavigationUI = true,
  } = props;

  const [optimisticallyHiddenItemId, setOptimisticallyHiddenItemId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [folderActionDialog, setFolderActionDialog] = useState<{
    type: 'rename' | 'delete' | null;
    folderId: string | null;
    folderName: string | null;
  }>({ type: null, folderId: null, folderName: null });
  
  const { toast } = useToast();

  // Use folder navigation hook when navigation is enabled
  const folderNavigation = useFolderNavigation(currentFolderId);

  // Use domain-driven data hook with current folder from navigation or props
  const activeFolderId = enableNavigation ? folderNavigation.currentFolderId : currentFolderId;
  
  const {
    items,
    folders,
    assets,
    loading,
    isFirstLoad,
    error,
    fetchData: refreshGalleryData,
    updateItems,
  } = useDamGalleryData({
    ...props,
    currentFolderId: activeFolderId,
  });
  
  // Use upload hook with auto-refresh on completion (after data hook)
  const upload = useAssetUpload({
    folderId: activeFolderId,
    onUploadComplete: refreshGalleryData,
  });

    // Reset optimistic hiding when props change  useEffect(() => {    setOptimisticallyHiddenItemId(null);  }, [props]);  // Refresh gallery data when navigation changes  useEffect(() => {    if (enableNavigation && folderNavigation.currentFolderId !== null) {      refreshGalleryData();    }  }, [folderNavigation.currentFolderId, enableNavigation]);  // Listen for global folder update events and refresh gallery  useEffect(() => {    const handleFolderUpdate = (event: Event) => {      const customEvent = event as CustomEvent<{         type: 'rename' | 'delete';         folderId: string;         newName?: string;         folderName?: string;       }>;            // Refresh gallery data when any folder is updated      refreshGalleryData();    };    window.addEventListener('folderUpdated', handleFolderUpdate);        return () => {      window.removeEventListener('folderUpdated', handleFolderUpdate);    };  }, [refreshGalleryData]);  // Filter out optimistically hidden items
  const visibleAssets = assets.filter(asset => 
    asset.id !== optimisticallyHiddenItemId
  );

  const getItemIcon = (item: GalleryItemDto) => {
    if (item.type === 'folder') {
      return <Folder className="w-5 h-5 text-blue-600" />;
    }

    const mimeType = item.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-orange-600" />;
    }
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <FileText className="w-5 h-5 text-gray-600" />;
    }
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleItemClick = (item: GalleryItemDto) => {
    if (item.type === 'folder') {
      if (enableNavigation) {
        // Use domain navigation
        folderNavigation.navigateToFolder(item.id);
      } else {
        // Fallback for non-navigation mode
        console.log('Navigate to folder:', item.id);
        toast({
          title: 'Folder Navigation',
          description: `Would navigate to folder: ${item.name}`,
        });
      }
    } else {
      // Open asset details modal
      setSelectedAssetId(item.id);
    }
  };

  const handleAssetUpdated = (updatedAsset: any) => {
    // Refresh the gallery data to show updated asset
    refreshGalleryData();
  };

  const handleAssetDeleted = (assetId: string) => {
    // Refresh the gallery data to remove deleted asset
    refreshGalleryData();
  };

  // Folder action handlers
  const handleFolderAction = (action: 'rename' | 'delete', folderId: string, folderName: string) => {
    setFolderActionDialog({ type: action, folderId, folderName });
  };

  const handleFolderActionComplete = () => {
    setFolderActionDialog({ type: null, folderId: null, folderName: null });
    refreshGalleryData(); // Refresh gallery after folder operations
  };

  // Handle loading state
  if ((loading && isFirstLoad) || (enableNavigation && folderNavigation.loading && !folderNavigation.navigation)) {
    return (
      <div className="text-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }

  // Handle error state
  if (error || (enableNavigation && folderNavigation.error)) {
    const displayError = error || folderNavigation.error;
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">
          <p>Failed to load gallery data</p>
          <p className="text-sm">{displayError}</p>
        </div>
        <div className="space-x-2">
          <button 
            onClick={refreshGalleryData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Gallery
          </button>
          {enableNavigation && (
            <button 
              onClick={folderNavigation.refresh}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Retry Navigation
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="space-y-6 min-h-96 relative"
        onDragOver={upload.handleDragOver}
        onDragLeave={upload.handleDragLeave}
        onDrop={upload.handleDrop}
      >
        {/* Drag Overlay */}
        {upload.uploadState.isDragOver && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Drop files to upload</h3>
              <p className="text-blue-700">
                Release to upload to {activeFolderId ? 'this folder' : 'root folder'}
              </p>
            </div>
          </div>
        )}

        {/* Upload Progress Section */}
        {upload.uploadState.files.length > 0 && (
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Uploading Files ({upload.uploadState.files.length})
              </h3>
              {!upload.uploadState.isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={upload.clearFiles}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {upload.uploadState.files.map((fileUpload, index) => (
                <div key={`${fileUpload.file.name}-${index}`} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{fileUpload.file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {Math.round(fileUpload.file.size / 1024)}KB
                        </span>
                        {fileUpload.status === 'error' && !upload.uploadState.isUploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => upload.removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={fileUpload.progress} className="flex-1 h-2" />
                      <Badge variant={
                        fileUpload.status === 'completed' ? 'default' :
                        fileUpload.status === 'error' ? 'destructive' :
                        fileUpload.status === 'uploading' ? 'secondary' : 'outline'
                      }>
                        {fileUpload.status === 'completed' ? 'Done' :
                         fileUpload.status === 'error' ? 'Error' :
                         fileUpload.status === 'uploading' ? 'Uploading' : 'Pending'}
                      </Badge>
                    </div>
                    {fileUpload.error && (
                      <p className="text-xs text-red-600 mt-1">{fileUpload.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Breadcrumbs */}
        {showNavigationUI && enableNavigation && folderNavigation.navigation && (
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
                  onFolderCreated={refreshGalleryData}
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
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Folder className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Folders</h2>
              <span className="text-sm text-gray-500">({folders.length})</span>
            </div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {folders.map(folder => (
                  <DomainFolderItem 
                    key={folder.id} 
                    folder={folder}
                    onRefresh={refreshGalleryData}
                    onClick={() => handleItemClick(folder)}
                    enableNavigation={enableNavigation}
                    onAction={handleFolderAction}
                  />
                ))}
              </div>
                        ) : (              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">                {folders.map(folder => (                  <DomainFolderListItem                     key={folder.id}                     folder={folder}                    onRefresh={refreshGalleryData}                    onClick={() => handleItemClick(folder)}                    enableNavigation={enableNavigation}                    onAction={handleFolderAction}                  />                ))}              </div>            )}
          </div>
        )}

        {/* Assets Section */}
        {visibleAssets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <File className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Assets</h2>
              <span className="text-sm text-gray-500">({visibleAssets.length})</span>
            </div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {visibleAssets.map(asset => (
                  <DomainAssetItem 
                    key={asset.id} 
                    asset={asset}
                    onRefresh={refreshGalleryData}
                    onOptimisticHide={setOptimisticallyHiddenItemId}
                    onClick={() => handleItemClick(asset)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleAssets.map(asset => (
                  <DomainAssetListItem 
                    key={asset.id} 
                    asset={asset}
                    onRefresh={refreshGalleryData}
                    onClick={() => handleItemClick(asset)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for refreshes */}
        {(loading && !isFirstLoad) || (enableNavigation && folderNavigation.loading) && (
          <div className="text-center p-4 text-sm text-gray-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
            Refreshing content...
          </div>
        )}

        {/* Handle empty state */}
        {!loading && folders.length === 0 && visibleAssets.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
            {searchTerm ? (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-600 mb-2">No results found for "{searchTerm}"</p>
                <p className="text-sm text-gray-500">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {activeFolderId ? 'This folder is empty' : 'No assets yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {activeFolderId 
                      ? 'Upload files or create folders to organize your content'
                      : 'Start by uploading your first assets or creating folders'
                    }
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  {/* File Upload Button */}
                  <div>
                    <input
                      type="file"
                      multiple
                      accept={upload.getFileAcceptTypes()}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          upload.uploadFiles(Array.from(e.target.files));
                          e.target.value = ''; // Reset input
                        }
                      }}
                      className="hidden"
                      id="upload-input"
                    />
                    <Button
                      asChild
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <label htmlFor="upload-input" className="cursor-pointer">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Files
                      </label>
                    </Button>
                  </div>

                  {/* Create Folder Button */}
                  {enableNavigation && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">or</span>
                      <NewFolderDialog
                        currentFolderId={activeFolderId}
                        asIcon={false}
                        onFolderCreated={refreshGalleryData}
                      />
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>💡 <strong>Tip:</strong> You can also drag and drop files anywhere on this page</p>
                  <p>Supported formats: Images, PDFs, Text files, Audio, Video (max 50MB)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Details Modal */}
      <AssetDetailsModal
        open={!!selectedAssetId}
        onOpenChange={(open) => !open && setSelectedAssetId(null)}
        assetId={selectedAssetId}
        onAssetUpdated={handleAssetUpdated}
        onAssetDeleted={handleAssetDeleted}
      />

      {/* Folder Action Dialogs */}
      {folderActionDialog.type === 'rename' && folderActionDialog.folderId && (
        <RenameFolderDialog
          isOpen={true}
          onClose={handleFolderActionComplete}
          folderId={folderActionDialog.folderId}
          currentName={folderActionDialog.folderName || ''}
        />
      )}

      {folderActionDialog.type === 'delete' && folderActionDialog.folderId && (
        <DeleteFolderDialog
          isOpen={true}
          onClose={handleFolderActionComplete}
          folderId={folderActionDialog.folderId}
          folderName={folderActionDialog.folderName || ''}
          onDeleted={handleFolderActionComplete}
        />
      )}
    </>
  );
};

// Enhanced domain-aware components

interface DomainFolderItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  onRefresh: () => void;
  onClick: () => void;
  enableNavigation: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
}

const DomainFolderItem: React.FC<DomainFolderItemProps> = ({ 
  folder, 
  onRefresh, 
  onClick,
  enableNavigation,
  onAction
}) => (
  <div 
    className={`group relative p-4 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 ${
      enableNavigation ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'cursor-default'
    }`}
  >
    <div 
      className="flex flex-col items-center text-center"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
        <Folder className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="font-medium text-sm text-gray-900 mb-1 truncate w-full" title={folder.name}>
        {folder.name}
      </h3>
      <p className="text-xs text-gray-500">
        {formatDate(folder.createdAt)}
      </p>
    </div>
    
    {/* Action Menu */}
    {onAction && (
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open folder menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onAction('rename', folder.id, folder.name);
              }}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onAction('delete', folder.id, folder.name);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )}
  </div>
);

interface DomainAssetItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  onRefresh: () => void;
  onOptimisticHide: (id: string) => void;
  onClick: () => void;
}

const DomainAssetItem: React.FC<DomainAssetItemProps> = ({ 
  asset, 
  onRefresh, 
  onOptimisticHide,
  onClick 
}) => {
  const getAssetIcon = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) {
      return <Image className="w-6 h-6 text-green-600" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="w-6 h-6 text-purple-600" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music className="w-6 h-6 text-orange-600" />;
    }
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <FileText className="w-6 h-6 text-gray-600" />;
    }
    
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const getAssetTypeLabel = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('text')) return 'Text';
    
    return 'File';
  };

  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className="group relative p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        {/* Image Thumbnail or Icon */}
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors overflow-hidden">
          {isImage && asset.publicUrl && !imageError ? (
            <img
              src={asset.publicUrl}
              alt={asset.name}
              loading="lazy"
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            getAssetIcon()
          )}
        </div>
                <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={asset.name}>          {asset.name}        </h3>        <p className="text-xs text-gray-500">          {formatDate(asset.createdAt)}        </p>
      </div>
    </div>
  );
};

interface DomainAssetListItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  onRefresh: () => void;
  onClick: () => void;
}

const DomainAssetListItem: React.FC<DomainAssetListItemProps> = ({   asset,   onRefresh,  onClick }) => {  const [imageError, setImageError] = useState(false);  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');    const getAssetIcon = () => {    const mimeType = asset.mimeType?.toLowerCase() || '';        if (mimeType.startsWith('image/')) {      return <Image className="w-5 h-5 text-green-600" />;    }    if (mimeType.startsWith('video/')) {      return <Video className="w-5 h-5 text-purple-600" />;    }    if (mimeType.startsWith('audio/')) {      return <Music className="w-5 h-5 text-orange-600" />;    }    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {      return <FileText className="w-5 h-5 text-gray-600" />;    }        return <File className="w-5 h-5 text-gray-500" />;  };

  const getAssetTypeLabel = () => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('text')) return 'Text';
    
    return 'File';
  };

  return (
    <div 
      className="flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {isImage && asset.publicUrl && !imageError ? (
            <img
              src={asset.publicUrl}
              alt={asset.name}
              loading="lazy"
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            getAssetIcon()
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate text-gray-900">{asset.name}</h3>
        <p className="text-sm text-gray-500">{getAssetTypeLabel()}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500">
          {formatDate(asset.createdAt)}
        </p>
      </div>
    </div>
  );
};

// Compact folder list item for list view
interface DomainFolderListItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  onRefresh: () => void;
  onClick: () => void;
  enableNavigation: boolean;
  onAction?: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
}

const DomainFolderListItem: React.FC<DomainFolderListItemProps> = ({ 
  folder, 
  onRefresh, 
  onClick,
  enableNavigation,
  onAction
}) => (
  <div 
    className={`group flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 ${
      enableNavigation ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
    }`}
  >
    <div 
      className="flex items-center flex-1 min-w-0"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
        <Folder className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-900 truncate" title={folder.name}>
          {folder.name}
        </h3>
        <p className="text-xs text-gray-500">
          {formatDate(folder.createdAt)}
        </p>
      </div>
    </div>
    
    {/* Action Menu */}
    {onAction && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onAction('rename', folder.id, folder.name);
          }}>
            <Edit3 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600" 
            onClick={(e) => {
              e.stopPropagation();
              onAction('delete', folder.id, folder.name);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </div>
);

export default AssetGalleryClient; 