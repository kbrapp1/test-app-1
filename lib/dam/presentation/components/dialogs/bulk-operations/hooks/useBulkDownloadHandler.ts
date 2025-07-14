import { useCallback } from 'react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { bulkDownloadItems } from '../../../../../application/actions/selection.actions';

interface UseBulkDownloadHandlerParams {
  selectedAssets: string[];
  selectedFolders: string[];
  onOperationComplete: () => void;
  onClose: () => void;
}

/**
 * Hook for handling bulk download operations
 * 
 * Single Responsibility: Business logic for download operations
 */
export function useBulkDownloadHandler({
  selectedAssets,
  selectedFolders,
  onOperationComplete,
  onClose
}: UseBulkDownloadHandlerParams) {

  const handleBulkDownload = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(selectedAssets));
      formData.append('folderIds', JSON.stringify(selectedFolders));
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
            
          } catch {
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
        const assetCount = selectedAssets.length;
        const folderCount = selectedFolders.length;
        const _totalItems = assetCount + folderCount;
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
        onClose();
      } else {
        toast.error('Download failed', {
          description: result.error || 'Failed to download items. Please try again.'
        });
      }
          } catch {
      toast.error('Download failed', {
        description: 'An unexpected error occurred. Please try again.'
      });
    }
  }, [selectedAssets, selectedFolders, onOperationComplete, onClose]);

  return {
    handleBulkDownload
  };
} 