'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FolderPickerDialog } from './FolderPickerDialog';
import { BulkOperationType } from '../../../domain/value-objects/BulkOperation';
import { bulkMoveItems, bulkDeleteItems, bulkTagItems, bulkDownloadItems } from '../../../application/actions/selection.actions';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';

interface BulkOperationDialogs {
  move: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  delete: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  tag: {
    isOpen: boolean;
    selectedAssets: string[];
    operation: 'add' | 'remove';
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
  download: {
    isOpen: boolean;
    selectedAssets: string[];
    selectedFolders: string[];
    selectedItems?: Array<{ id: string; name: string; type: 'asset' | 'folder' }>;
  };
}

interface BulkOperationDialogsProps {
  bulkDialogs: BulkOperationDialogs;
  onClose: (type: keyof BulkOperationDialogs) => void;
  onOperationComplete: () => void;
  currentFolderId: string | null;
}

export const BulkOperationDialogs: React.FC<BulkOperationDialogsProps> = ({
  bulkDialogs,
  onClose,
  onOperationComplete,
  currentFolderId
}) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Handle bulk move operation
  const handleBulkMove = async (targetFolderId: string | null) => {
    // Add a small delay before showing loading state for better UX
    const loadingTimeout = setTimeout(() => {
      setLoading(prev => ({ ...prev, move: true }));
    }, 100);
    
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(bulkDialogs.move.selectedAssets));
      formData.append('folderIds', JSON.stringify(bulkDialogs.move.selectedFolders));
      formData.append('targetFolderId', targetFolderId === null ? 'null' : targetFolderId || '');
      
      const result = await bulkMoveItems(formData);
      
      if (result.success) {
        const totalItems = bulkDialogs.move.selectedAssets.length + bulkDialogs.move.selectedFolders.length;
        toast.success('Items moved successfully', {
          description: `${totalItems} item${totalItems > 1 ? 's' : ''} moved successfully.`
        });
        onOperationComplete();
        onClose('move');
      } else {

        toast.error('Move failed', {
          description: result.error || 'Failed to move items. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Move failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(prev => ({ ...prev, move: false }));
    }
  };

  // Handle bulk delete operation
  const handleBulkDelete = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(bulkDialogs.delete.selectedAssets));
      formData.append('folderIds', JSON.stringify(bulkDialogs.delete.selectedFolders));
      
      const result = await bulkDeleteItems(formData);
      
      if (result.success) {
        const totalItems = bulkDialogs.delete.selectedAssets.length + bulkDialogs.delete.selectedFolders.length;
        toast.success('Items deleted successfully', {
          description: `${totalItems} item${totalItems > 1 ? 's' : ''} deleted successfully.`
        });
        onOperationComplete();
        onClose('delete');
      } else {
        toast.error('Delete failed', {
          description: result.error || 'Failed to delete items. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Delete failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Handle bulk tag operation
  const handleBulkTag = async (tagIds: string[]) => {
    try {
      // TODO: Implement bulk tag use case
      onOperationComplete();
      onClose('tag');
    } catch (error) {
      // Bulk tag operation failed
    }
  };

  // Handle bulk download operation
  const handleBulkDownload = async () => {
    setLoading(prev => ({ ...prev, download: true }));
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(bulkDialogs.download.selectedAssets));
      formData.append('folderIds', JSON.stringify(bulkDialogs.download.selectedFolders));
      formData.append('format', 'zip'); // Default to ZIP for better UX
      
      const result = await bulkDownloadItems(formData);
      
      if (result.success) {
        // Handle download URLs or ZIP file
        if (result.downloadUrls && result.downloadUrls.length > 0) {
          // Use hidden anchor elements for seamless downloads instead of window.open
          result.downloadUrls.forEach((url, index) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = ''; // Let the server determine the filename
            link.style.display = 'none';
            document.body.appendChild(link);
            
            // Small delay between multiple downloads to avoid browser blocking
            setTimeout(() => {
              link.click();
              document.body.removeChild(link);
            }, index * 100);
          });
        } else if (result.zipBase64 && result.zipFileName) {
          try {
            // Convert base64 to blob and download ZIP file
            const binaryString = atob(result.zipBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
        }
            const zipBlob = new Blob([bytes], { type: 'application/zip' });
            saveAs(zipBlob, result.zipFileName);
            
          } catch (conversionError) {
            toast.error('Download failed', {
              description: 'Failed to process ZIP file data. Please try again.'
            });
            return;
          }
        } else {
          toast.error('Download failed', {
            description: 'No download data received from server.'
          });
          return;
        }
        
        // Generate success message based on selection
        const assetCount = bulkDialogs.download.selectedAssets.length;
        const folderCount = bulkDialogs.download.selectedFolders.length;
        const totalItems = assetCount + folderCount;
        const isSingleAsset = assetCount === 1 && folderCount === 0;
        
        let description = '';
        if (isSingleAsset) {
          description = 'Asset download started.';
        } else if (assetCount > 0 && folderCount > 0) {
          description = `${assetCount} asset${assetCount > 1 ? 's' : ''} and ${folderCount} folder${folderCount > 1 ? 's' : ''} downloaded as ZIP.`;
        } else if (assetCount > 0) {
          description = `${assetCount} asset${assetCount > 1 ? 's' : ''} downloaded as ZIP.`;
        } else {
          description = `${folderCount} folder${folderCount > 1 ? 's' : ''} downloaded as ZIP.`;
        }
        
        toast.success('Download completed', { description });
        onOperationComplete();
        onClose('download');
      } else {
        toast.error('Download failed', {
          description: result.error || 'Failed to download items. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Download failed', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  return (
    <>
      {/* Bulk Move Dialog */}
      {(() => {
        const totalItems = bulkDialogs.move.selectedAssets.length + bulkDialogs.move.selectedFolders.length;
        const selectedItems = bulkDialogs.move.selectedItems || [];
        
        // Generate dialog title based on selection
        let dialogTitle = "Move Items";
        if (totalItems === 1 && selectedItems.length > 0) {
          dialogTitle = `Move "${selectedItems[0].name}"`;
        } else if (totalItems > 1) {
          const assetCount = bulkDialogs.move.selectedAssets.length;
          const folderCount = bulkDialogs.move.selectedFolders.length;
          
          if (assetCount > 0 && folderCount > 0) {
            dialogTitle = `Move ${totalItems} items`;
          } else if (assetCount > 0) {
            dialogTitle = `Move ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
          } else {
            dialogTitle = `Move ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
          }
        }

        return (
          <FolderPickerDialog
            isOpen={bulkDialogs.move.isOpen}
            onOpenChange={(isOpen) => !isOpen && onClose('move')}
            onFolderSelect={(targetFolderId) => {
              handleBulkMove(targetFolderId);
            }}
            currentAssetFolderId={currentFolderId}
            assetName={totalItems === 1 && selectedItems.length > 0 ? selectedItems[0].name : undefined}
            // Override the dialog title for bulk operations
            dialogTitle={dialogTitle}
            dialogDescription={
              totalItems === 1 
                ? "Select a destination folder or move to root."
                : `Select a destination folder for the ${totalItems} selected items.`
            }
            isMoving={loading.move}
          />
        );
      })()}

      {/* Bulk Delete Dialog */}
      {(() => {
        const totalItems = bulkDialogs.delete.selectedAssets.length + bulkDialogs.delete.selectedFolders.length;
        const selectedItems = bulkDialogs.delete.selectedItems || [];
        const assetCount = bulkDialogs.delete.selectedAssets.length;
        const folderCount = bulkDialogs.delete.selectedFolders.length;
        
        // Generate title based on selection
        let title = "Delete Asset";
        if (totalItems === 1) {
          if (selectedItems.length > 0) {
            title = selectedItems[0].type === 'folder' ? "Delete Folder" : "Delete Asset";
          }
        } else {
          if (assetCount > 0 && folderCount > 0) {
            title = `Delete ${totalItems} items`;
          } else if (assetCount > 0) {
            title = `Delete ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
          } else {
            title = `Delete ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
          }
        }

        // Generate description based on selection
        let description = "This action cannot be undone.";
        if (totalItems === 1 && selectedItems.length > 0) {
          description = `Are you sure you want to delete "${selectedItems[0].name}"? This action cannot be undone.`;
        } else if (selectedItems.length > 0) {
          const itemNames = selectedItems.slice(0, 3).map(item => `"${item.name}"`).join(', ');
          const remaining = selectedItems.length - 3;
          if (remaining > 0) {
            description = `Are you sure you want to delete ${itemNames} and ${remaining} other item${remaining > 1 ? 's' : ''}? This action cannot be undone.`;
          } else {
            description = `Are you sure you want to delete ${itemNames}? This action cannot be undone.`;
          }
        } else {
          description = `Are you sure you want to delete the selected ${totalItems} item${totalItems > 1 ? 's' : ''}? This action cannot be undone.`;
        }

        // Generate button text
        const buttonText = loading.delete 
          ? 'Deleting...' 
          : totalItems === 1 
            ? (selectedItems[0]?.type === 'folder' ? 'Delete Folder' : 'Delete Asset')
            : 'Delete';

        return (
          <AlertDialog open={bulkDialogs.delete.isOpen} onOpenChange={(open) => !open && onClose('delete')}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onClose('delete')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDelete}
                  disabled={loading.delete}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buttonText}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })()}

      {/* Bulk Tag Dialog */}
      <AlertDialog open={bulkDialogs.tag.isOpen} onOpenChange={(open) => !open && onClose('tag')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDialogs.tag.operation === 'add' ? 'Add Tags' : 'Remove Tags'} 
              {' '}({bulkDialogs.tag.selectedAssets.length} assets)
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select tags to {bulkDialogs.tag.operation} for the selected assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onClose('tag')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleBulkTag([])}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Download Dialog */}
      {(() => {
        const assetCount = bulkDialogs.download.selectedAssets.length;
        const folderCount = bulkDialogs.download.selectedFolders.length;
        const totalItems = assetCount + folderCount;
        const isSingleAsset = assetCount === 1 && folderCount === 0;
        
        // Generate title based on selection
        let title = '';
        if (isSingleAsset) {
          title = 'Download Asset';
        } else if (assetCount > 0 && folderCount > 0) {
          title = `Download ${totalItems} items`;
        } else if (assetCount > 0) {
          title = `Download ${assetCount} asset${assetCount > 1 ? 's' : ''}`;
        } else {
          title = `Download ${folderCount} folder${folderCount > 1 ? 's' : ''}`;
        }
        
        // Generate description based on selection
        let description = '';
        if (isSingleAsset) {
          description = 'The asset will be downloaded directly to your computer.';
        } else if (folderCount > 0) {
          description = 'Items will be downloaded as a ZIP file containing all assets from selected folders.';
        } else {
          description = 'Assets will be downloaded as a ZIP file. This may take a moment for large files.';
        }
        
        // Generate button text
        const buttonText = loading.download 
          ? 'Downloading...' 
          : isSingleAsset 
            ? 'Download' 
            : 'Download ZIP';
        
        return (
      <AlertDialog open={bulkDialogs.download.isOpen} onOpenChange={(open) => !open && onClose('download')}>
        <AlertDialogContent>
          <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onClose('download')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDownload}
              disabled={loading.download}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                  {buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        );
      })()}
    </>
  );
}; 