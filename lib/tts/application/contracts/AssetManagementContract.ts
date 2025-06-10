/**
 * Asset Management Contract
 * 
 * Anti-corruption layer interface for TTS to communicate with external
 * asset management systems (like DAM) without direct coupling.
 * This follows DDD bounded context patterns.
 */

/**
 * Asset reference DTO for cross-context communication
 */
export interface AssetReference {
  id: string;
  name: string;
  contentType: string;
  size?: number;
  url?: string;
}

/**
 * Text asset content for loading/saving operations
 */
export interface TextAssetContent {
  content: string;
  assetId: string;
  contentType: string;
}

/**
 * Audio asset save request
 */
export interface AudioAssetSaveRequest {
  audioUrl: string;
  desiredName: string;
  contentType: string;
  metadata?: {
    sourceType: 'tts_generation';
    ttsPredictionId?: string;
    voiceId?: string;
    inputText?: string;
  };
}

/**
 * Asset save result
 */
export interface AssetSaveResult {
  success: boolean;
  assetId?: string;
  error?: string;
}

/**
 * Asset content result
 */
export interface AssetContentResult {
  success: boolean;
  content?: string;
  contentType?: string;
  error?: string;
}

/**
 * Asset download result
 */
export interface AssetDownloadResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

/**
 * Contract interface for asset management operations
 * This abstracts external asset management systems from TTS domain
 */
export interface AssetManagementContract {
  /**
   * Load text content from an asset
   */
  loadTextContent(assetId: string): Promise<AssetContentResult>;

  /**
   * Update text content of an existing asset
   */
  updateTextContent(assetId: string, content: string): Promise<AssetSaveResult>;

  /**
   * Save text as a new asset
   */
  saveTextAsNewAsset(content: string, desiredName: string): Promise<AssetSaveResult>;

  /**
   * Save audio file as a new asset
   */
  saveAudioAsset(request: AudioAssetSaveRequest): Promise<AssetSaveResult>;

  /**
   * Get download URL for an asset
   */
  getAssetDownloadUrl(assetId: string): Promise<AssetDownloadResult>;

  /**
   * Check if an asset exists and is accessible
   */
  verifyAssetAccess(assetId: string): Promise<boolean>;
}

/**
 * Asset selection contract for UI integration
 */
export interface AssetSelectionContract {
  /**
   * Open asset selection dialog and return selected asset
   */
  selectAsset(options?: {
    filterByType?: string[];
    title?: string;
  }): Promise<AssetReference | null>;
} 