'use client';

import React from 'react';
import { Upload } from 'lucide-react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { GalleryHeader } from './sections/GalleryHeader';
import { UploadProgress } from './sections/UploadProgress';
import { ContentSections } from './sections/ContentSections';
import { EmptyState } from './sections/EmptyState';

interface GalleryLayoutProps {
  loading: boolean;
  isFirstLoad: boolean;
  error?: string;
  folderNavigation?: any;
  showNavigationUI: boolean;
  activeFolderId: string | null;
  upload: any;
  onRefresh: () => void;
  folders: (GalleryItemDto & { type: 'folder' })[];
  assets: (GalleryItemDto & { type: 'asset' })[];
  searchTerm?: string;
  enableNavigation: boolean;
  renderFolders: () => React.ReactNode;
  renderAssets: () => React.ReactNode;
  enableMultiSelect?: boolean;
  multiSelect?: any;
}

const LoadingState: React.FC = () => (
  <div className="text-center p-8">
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
    <p>Loading gallery...</p>
  </div>
);

const ErrorState: React.FC<{ error: string; onRefresh: () => void; folderNavigation?: any }> = ({ 
  error, 
  onRefresh, 
  folderNavigation 
}) => (
  <div className="text-center p-8">
    <div className="text-red-500 mb-4">
      <p>Failed to load gallery data</p>
      <p className="text-sm">{error}</p>
    </div>
    <div className="space-x-2">
      <button 
        onClick={onRefresh}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry Gallery
      </button>
      {folderNavigation && (
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

const DragOverlay: React.FC<{ activeFolderId: string | null }> = ({ activeFolderId }) => (
  <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
    <div className="text-center">
      <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-blue-900 mb-2">Drop files to upload</h3>
      <p className="text-blue-700">
        Release to upload to {activeFolderId ? 'this folder' : 'root folder'}
      </p>
    </div>
  </div>
);

const LoadingIndicator: React.FC = () => (
  <div className="text-center p-4 text-sm text-gray-500">
    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
    Refreshing content...
  </div>
);

export const GalleryLayout: React.FC<GalleryLayoutProps> = ({
  loading,
  isFirstLoad,
  error,
  folderNavigation,
  showNavigationUI,
  activeFolderId,
  upload,
  onRefresh,
  folders,
  assets,
  searchTerm,
  enableNavigation,
  renderFolders,
  renderAssets,
  enableMultiSelect = false,
  multiSelect,
}) => {
  // Handle loading state
  if ((loading && isFirstLoad) || (folderNavigation?.loading && !folderNavigation.navigation)) {
    return <LoadingState />;
  }

  // Handle error state
  const displayError = error || folderNavigation?.error;
  if (displayError) {
    return <ErrorState error={displayError} onRefresh={onRefresh} folderNavigation={folderNavigation} />;
  }

  const hasContent = folders.length > 0 || assets.length > 0;
  const showRefreshIndicator = (loading && !isFirstLoad) || folderNavigation?.loading;

  return (
    <div 
      className="space-y-6 min-h-96 relative"
      onDragOver={upload.handleDragOver}
      onDragLeave={upload.handleDragLeave}
      onDrop={upload.handleDrop}
    >
      {upload.uploadState.isDragOver && <DragOverlay activeFolderId={activeFolderId} />}
      
      <UploadProgress upload={upload} />
      
      <GalleryHeader
        showNavigationUI={showNavigationUI}
        enableNavigation={enableNavigation}
        folderNavigation={folderNavigation}
        activeFolderId={activeFolderId}
        onRefresh={onRefresh}
        enableMultiSelect={enableMultiSelect}
        multiSelect={multiSelect}
      />

      {hasContent ? (
        <ContentSections
          folders={folders}
          assets={assets}
          renderFolders={renderFolders}
          renderAssets={renderAssets}
          enableMultiSelect={enableMultiSelect}
          multiSelect={multiSelect}
        />
      ) : (
        !loading && (
          <EmptyState
            searchTerm={searchTerm}
            activeFolderId={activeFolderId}
            enableNavigation={enableNavigation}
            upload={upload}
            onRefresh={onRefresh}
          />
        )
      )}

      {showRefreshIndicator && <LoadingIndicator />}
    </div>
  );
}; 
