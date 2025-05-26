import { AssetMapper, RawAssetDbRecord } from '../mappers/AssetMapper';
import { Asset } from '../../../../domain/entities/Asset';
import { AssetProfileService } from './AssetProfileService';
import { AssetUrlService } from './AssetUrlService';

/**
 * Asset Data Processor Service
 * Follows Single Responsibility Principle - handles data processing and enrichment
 */
export class AssetDataProcessor {
  constructor(
    private profileService: AssetProfileService,
    private urlService: AssetUrlService
  ) {}

  /**
   * Process raw database data for findById operation
   */
  async processRawDataForFindById(data: any): Promise<Asset> {
    const rawDataForMapper: any = { ...data };
    
    // Handle folder name mapping
    if (data.folder && data.folder.name) {
      rawDataForMapper.folder_name = data.folder.name;
    }
    delete rawDataForMapper.folder;
    
    // Enrich with user profile
    const enrichedData = await this.profileService.enrichAssetWithProfile(rawDataForMapper);
    
    // Convert to domain entity and add public URL
    const domainAsset = AssetMapper.toDomain(enrichedData as unknown as RawAssetDbRecord);
    return this.urlService.addPublicUrlToAsset(domainAsset);
  }

  /**
   * Process array of raw database records
   */
  async processRawDataArray(rawData: any[]): Promise<Asset[]> {
    // Handle folder name mapping for each record
    const processedData = rawData.map(data => {
      const rawDataForMapper: any = { ...data };
      
      // Handle folder name mapping
      if (data.folder && data.folder.name) {
        rawDataForMapper.folder_name = data.folder.name;
      }
      delete rawDataForMapper.folder;
      
      return rawDataForMapper;
    });
    
    // Enrich with user profiles (batch operation)
    const enrichedAssets = await this.profileService.enrichAssetsWithProfiles(processedData);
    
    // Convert to domain entities and add public URLs
    return enrichedAssets.map(raw => this.mapRawToDomainWithPublicUrl(raw as unknown as RawAssetDbRecord));
  }

  /**
   * Map raw data to domain with public URL
   */
  private mapRawToDomainWithPublicUrl(raw: RawAssetDbRecord): Asset {
    const domainAsset = AssetMapper.toDomain(raw);
    return this.urlService.addPublicUrlToAsset(domainAsset);
  }

  /**
   * Process single raw record for operations like save/update
   */
  async processSingleRawRecord(data: any): Promise<Asset> {
    // Enrich with user profile
    const enrichedData = await this.profileService.enrichAssetWithProfile(data);
    
    // Convert to domain entity and add public URL
    return this.mapRawToDomainWithPublicUrl(enrichedData as unknown as RawAssetDbRecord);
  }
} 
