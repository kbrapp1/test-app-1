import { toast } from 'sonner';

/**
 * Application service for asset operations
 * Handles business logic for asset CRUD operations
 * 
 * MIGRATION NOTE: This service now provides React Query hook-based utilities
 * instead of direct fetch operations. Use the hooks from @/lib/dam/hooks/useAssets
 * for data operations with proper cache management.
 */
export class AssetOperationsService {
  /**
   * @deprecated Use useAssetDetails() hook instead for proper React Query integration
   */
  static async loadAssetDetails(assetId: string): Promise<any> {
    console.warn('AssetOperationsService.loadAssetDetails is deprecated. Use useAssetDetails() hook instead.');
    const response = await fetch(`/api/dam/asset/${assetId}?details=true`);
    if (!response.ok) throw new Error('Failed to load asset details');
    return response.json();
  }

  /**
   * @deprecated Use useAssetUpdate() mutation instead for proper React Query integration
   */
  static async updateAssetName(assetId: string, newName: string): Promise<void> {
    console.warn('AssetOperationsService.updateAssetName is deprecated. Use useAssetUpdate() mutation instead.');
    const response = await fetch(`/api/dam/asset/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) throw new Error('Failed to update asset');
  }

  /**
   * @deprecated Use useAssetDelete() mutation instead for proper React Query integration
   */
  static async deleteAsset(assetId: string): Promise<void> {
    console.warn('AssetOperationsService.deleteAsset is deprecated. Use useAssetDelete() mutation instead.');
    const response = await fetch(`/api/dam/asset/${assetId}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Failed to delete asset (${response.status})`);
    }
  }

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
