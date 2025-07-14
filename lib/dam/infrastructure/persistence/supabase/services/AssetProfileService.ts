import { SupabaseClient } from '@supabase/supabase-js';
import { RawAssetDbRecord as _RawAssetDbRecord } from '../mappers/AssetMapper';

/**
 * Asset Profile Service
 * Follows Single Responsibility Principle - only handles user profile enrichment for assets
 */
export class AssetProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Enrich a single asset with user profile data
   */
  async enrichAssetWithProfile(asset: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!asset.user_id) {
      return asset;
    }

    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('full_name')
        .eq('id', asset.user_id)
        .single();

      if (profile) {
        asset.user = { full_name: profile.full_name };
      }

      return asset;
    } catch (error) {
      console.warn(`Failed to fetch profile for user ${asset.user_id}:`, error);
      return asset;
    }
  }

  /**
   * Enrich multiple assets with user profile data (batch operation)
   */
  async enrichAssetsWithProfiles(assets: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    if (!assets || assets.length === 0) {
      return assets;
    }

    try {
      // Get unique user IDs
      const userIds = Array.from(new Set(assets.map(asset => asset.user_id).filter(Boolean)));
      
      if (userIds.length === 0) {
        return assets;
      }

      // Fetch all profiles in one query
      const { data: profiles, error } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (error) {
        console.warn('Failed to fetch user profiles:', error);
        return assets;
      }

      // Create profile map for efficient lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Enrich assets with profile data
      return assets.map(asset => {
        const profile = profileMap.get(asset.user_id);
        if (profile) {
          asset.user = { full_name: profile.full_name };
        }
        return asset;
      });
    } catch (error) {
      console.warn('Error enriching assets with profiles:', error);
      return assets;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<{ full_name: string } | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      return profile;
    } catch (error) {
      console.warn(`Failed to fetch profile for user ${userId}:`, error);
      return null;
    }
  }
} 
