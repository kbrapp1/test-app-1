import { toast } from 'sonner';

/**
 * Application service for asset operations
 * Provides utility functions for UI operations (download, copy, notifications)
 * 
 * Note: Data operations (CRUD) should use React Query hooks from @/lib/dam/hooks/useAssets
 */
export class AssetOperationsService {

  static downloadAsset(downloadUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async copyAssetUrl(publicUrl: string): Promise<void> {
    await navigator.clipboard.writeText(publicUrl);
  }

  static showRenameSuccess(newName: string): void {
    toast.success('Asset renamed', { 
      description: `Asset has been renamed to "${newName}".`,
      duration: 3000
    });
  }

  static showDeleteSuccess(): void {
    toast.success('Asset deleted', { 
      description: 'The asset has been permanently removed.',
      duration: 3000
    });
  }

  static showDownloadSuccess(fileName: string): void {
    toast.success('Download started', { 
      description: `"${fileName}" is downloading.`,
      duration: 3000
    });
  }

  static showCopyUrlSuccess(): void {
    toast.success('URL copied', { description: 'Asset URL has been copied to clipboard.' });
  }

  static showError(operation: string, error?: string): void {
    toast.error(`Failed to ${operation}`, { description: error || 'Please try again.' });
  }
} 
