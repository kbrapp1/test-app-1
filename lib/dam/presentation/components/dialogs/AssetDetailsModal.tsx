'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AssetDetailsDto } from '../../../application/use-cases/assets/GetAssetDetailsUseCase';
import { DeleteAssetConfirmation } from './ConfirmationDialog';
import { AssetDetailsHeader } from './sections/AssetDetailsHeader';
import { AssetPreviewSection } from './sections/AssetPreviewSection';
import { AssetDetailsSection, AssetTagsSection, AssetCapabilitiesSection } from './sections/index';
import { useAssetDetailsModal } from '../../hooks/assets/useAssetDetailsModal';
import { LoadingSpinner } from './sections/LoadingSpinner';

/**
 * AssetDetailsModal - Main modal container for asset management
 * 
 * Follows DDD principles:
 * - Presentation layer component focused on layout and coordination
 * - Business logic delegated to domain hooks
 * - Sub-components handle specific UI concerns
 * 
 * Refactored from 624 lines to ~180 lines following DDD best practices:
 * - Extracted business logic to useAssetDetailsModal hook
 * - Created focused sub-components for each section
 * - Eliminated code duplication and improved maintainability
 */

interface AssetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string | null;
  onAssetUpdated?: () => void;
  onAssetDeleted?: (assetId: string) => void;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  open,
  onOpenChange,
  assetId,
  onAssetUpdated,
  onAssetDeleted,
}) => {
  const {
    // State
    asset,
    loading,
    error,
    editMode,
    editName,
    deleteConfirmOpen,
    updating,
    isUpdatingTag,
    copiedUrl,
    
    // Actions
    setEditMode,
    setEditName,
    setDeleteConfirmOpen,
    handleSaveEdit,
    handleDelete,
    handleDownload,
    handleCopyUrl,
    handleLocalTagAdded,
    handleLocalRemoveTag,
  } = useAssetDetailsModal({
    open,
    assetId,
    onAssetUpdated,
    onAssetDeleted,
    onOpenChange,
  });

  if (!open || !assetId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 flex flex-col">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <AssetDetailsHeader
                asset={asset}
                editMode={editMode}
                editName={editName}
                updating={updating}
                copiedUrl={copiedUrl}
                error={error}
                onEditModeChange={setEditMode}
                onEditNameChange={setEditName}
                onSaveEdit={handleSaveEdit}
                onCopyUrl={handleCopyUrl}
              />
              
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - Preview and primary actions */}
                <div className="lg:col-span-2 space-y-6">
                  <AssetPreviewSection asset={asset} />
                  
                  {/* Primary actions */}
                  <div className="flex flex-wrap gap-3">
                    {asset?.downloadUrl && (
                      <button
                        onClick={handleDownload} 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    )}
                    {asset?.publicUrl && (
                      <button
                        onClick={handleCopyUrl}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedUrl ? "M5 13l4 4L19 7" : "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"} />
                        </svg>
                        {copiedUrl ? 'Copied!' : 'Share'}
                      </button>
                    )}
                    {asset && (
                      <button
                        onClick={() => setDeleteConfirmOpen(true)} 
                        className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Right column - Details and tags */}
                <div className="space-y-6">
                  <AssetDetailsSection asset={asset} />
                  
                  <AssetTagsSection
                    asset={asset}
                    isUpdatingTag={isUpdatingTag}
                            onTagAdded={handleLocalTagAdded} 
                    onRemoveTag={handleLocalRemoveTag}
                  />

                  <AssetCapabilitiesSection asset={asset} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {asset && (
        <DeleteAssetConfirmation
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          assetName={asset.name}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default AssetDetailsModal; 
