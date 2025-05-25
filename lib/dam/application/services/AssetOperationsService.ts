import { toast } from 'sonner';
import { AssetDetailsDto } from '../use-cases/assets/GetAssetDetailsUseCase';

/**
 * Application service for asset operations
 * Handles business logic for asset CRUD operations
 */
export class AssetOperationsService {
  static async loadAssetDetails(assetId: string): Promise<AssetDetailsDto> {
    const response = await fetch(`/api/dam/asset/${assetId}?details=true`);
    if (!response.ok) throw new Error('Failed to load asset details');
    return response.json();
  }

  static async updateAssetName(assetId: string, newName: string): Promise<void> {
    const response = await fetch(`/api/dam/asset/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) throw new Error('Failed to update asset');
  }

  static async deleteAsset(assetId: string): Promise<void> {
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
