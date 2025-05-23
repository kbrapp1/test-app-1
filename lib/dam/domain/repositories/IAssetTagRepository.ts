import { Asset } from '../entities/Asset';
import { Tag } from '../entities/Tag';

/**
 * Repository interface for managing the relationship between Assets and Tags.
 */
export interface IAssetTagRepository {
  /**
   * Links a tag to an asset.
   * @param assetId The ID of the asset.
   * @param tagId The ID of the tag.
   * @param organizationId The ID of the organization.
   * @param userId The ID of the user performing the action (optional, for auditing or RLS).
   * @returns Promise<boolean> True if the link was successful, false otherwise.
   */
  linkTagToAsset(assetId: string, tagId: string, organizationId: string, userId?: string): Promise<boolean>;

  /**
   * Unlinks a tag from an asset.
   * @param assetId The ID of the asset.
   * @param tagId The ID of the tag.
   * @param organizationId The ID of the organization.
   * @returns Promise<boolean> True if the unlink was successful, false otherwise.
   */
  unlinkTagFromAsset(assetId: string, tagId: string, organizationId: string): Promise<boolean>;

  /**
   * Finds all tags associated with a given asset ID.
   * This might return Tag entities directly if the repository handles the join and mapping,
   * or it could return just tag IDs if another service layer is responsible for fetching full Tag entities.
   * For simplicity and consistency with AssetMapper, let's aim to return full Tag entities.
   * @param assetId The ID of the asset.
   * @param organizationId The ID of the organization (for RLS and scoping).
   * @returns Promise<Tag[]> An array of Tag entities.
   */
  findTagsByAssetId(assetId: string, organizationId: string): Promise<Tag[]>;

  /**
   * Finds all asset IDs associated with a given tag ID.
   * @param tagId The ID of the tag.
   * @param organizationId The ID of the organization (for RLS and scoping).
   * @returns Promise<string[]> An array of asset IDs.
   */
  findAssetIdsByTagId(tagId: string, organizationId: string): Promise<string[]>;

  /**
   * Updates all tags for a given asset. This typically involves removing all existing links
   * for the asset and then creating new links for the provided tag IDs.
   * @param assetId The ID of the asset.
   * @param tagIds An array of tag IDs to associate with the asset.
   * @param organizationId The ID of the organization.
   * @param userId The ID of the user performing the action.
   * @returns Promise<boolean> True if the update was successful.
   */
  updateTagsForAsset(assetId: string, tagIds: string[], organizationId: string, userId: string): Promise<boolean>;

  /**
   * Checks if a specific tag is linked to any assets within an organization.
   * @param tagId The ID of the tag.
   * @param organizationId The ID of the organization.
   * @returns Promise<boolean> True if the tag is linked to at least one asset, false otherwise.
   */
  isTagLinked(tagId: string, organizationId: string): Promise<boolean>;
} 