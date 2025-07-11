/**
 * DAM Asset Management Adapter
 * 
 * Infrastructure adapter that implements the AssetManagementContract
 * by delegating to DAM services. This isolates DAM dependencies to
 * the infrastructure layer following DDD principles.
 */
import { 
  AssetManagementContract,
  AssetSaveResult,
  AssetContentResult,
  AssetDownloadResult,
  AudioAssetSaveRequest 
} from '../../application/contracts/AssetManagementContract';

// DAM imports are isolated to this adapter
import { getAssetContent, updateAssetText, saveAsNewTextAsset, getAssetDownloadUrl } from '../../../dam';

/**
 * DAM implementation of asset management contract
 * 
 * Note: Audio saving is intentionally NOT implemented here to avoid
 * DDD violations. Audio saving should be handled by application layer
 * server actions that coordinate between TTS and DAM domains.
 */
export class DamAssetManagementAdapter implements AssetManagementContract {

  /**
   * Load text content from a DAM asset
   */
  async loadTextContent(assetId: string): Promise<AssetContentResult> {
    try {
      const result = await getAssetContent(assetId);
      
      if (result.success && typeof result.content === 'string') {
        return {
          success: true,
          content: result.content,
          contentType: 'text/plain'
        };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to load asset content'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading content'
      };
    }
  }

  /**
   * Update text content of an existing DAM asset
   */
  async updateTextContent(assetId: string, content: string): Promise<AssetSaveResult> {
    try {
      const result = await updateAssetText(assetId, content);
      
      if (result.success) {
        return {
          success: true,
          assetId: assetId
        };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to update asset text'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating text'
      };
    }
  }

  /**
   * Save text as a new DAM asset
   */
  async saveTextAsNewAsset(content: string, desiredName: string): Promise<AssetSaveResult> {
    try {
      const result = await saveAsNewTextAsset(content, desiredName);
      
      if (result.success && result.data?.newAssetId) {
        return {
          success: true,
          assetId: result.data.newAssetId
        };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to save text as new asset'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving text'
      };
    }
  }

  /**
   * Audio saving is intentionally not implemented in this adapter.
   * 
   * Rationale: This would violate DDD by creating circular dependencies
   * between infrastructure and application layers. Audio saving involves
   * coordination between TTS and DAM domains, which belongs in the
   * application layer through server actions.
   */
  async saveAudioAsset(request: AudioAssetSaveRequest): Promise<AssetSaveResult> {
    // TODO: Implement when moving audio saving to domain layer
    console.warn('saveAudioAsset called with:', request.desiredName);
    
    return {
      success: false,
      error: 'Audio saving not implemented in DAM adapter. Use TTS server actions instead.'
    };
  }

  /**
   * Get download URL for a DAM asset
   */
  async getAssetDownloadUrl(assetId: string): Promise<AssetDownloadResult> {
    try {
      const result = await getAssetDownloadUrl(assetId);
      
      if (result.success && result.downloadUrl) {
        // Extract filename from URL
        let filename = `asset-${assetId}`;
        try {
          const pathSegments = new URL(result.downloadUrl).pathname.split('/');
          const potentialFilename = pathSegments[pathSegments.length - 1];
          if (potentialFilename) {
            filename = decodeURIComponent(potentialFilename);
          }
        } catch {
          // Use default filename if URL parsing fails
        }
        
        return {
          success: true,
          downloadUrl: result.downloadUrl,
          filename
        };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to get download URL'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting download URL'
      };
    }
  }

  /**
   * Check if a DAM asset exists and is accessible
   */
  async verifyAssetAccess(assetId: string): Promise<boolean> {
    try {
      // Try to get asset content to verify access
      const result = await getAssetContent(assetId);
      return result.success;
    } catch {
      return false;
    }
  }
} 