import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveOrganizationId } from '@/lib/auth';
import { useDamUrlManager } from '../navigation/useDamUrlManager';

interface UseDamTagFilterHandlerProps {
  gallerySearchTerm: string;
  currentFolderId: string | null;
}

/**
 * Domain presentation hook for managing tag filter functionality
 * 
 * Handles:
 * - Organization context for tag filtering
 * - Tag selection state from URL parameters
 * - Tag filter change handling with context preservation
 */
export function useDamTagFilterHandler({ gallerySearchTerm, currentFolderId }: UseDamTagFilterHandlerProps) {
  const urlManager = useDamUrlManager();
  const searchParams = useSearchParams();

  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [selectedTagIdsFromUrl, setSelectedTagIdsFromUrl] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const orgId = await getActiveOrganizationId();
        setActiveOrgId(orgId);
      } catch (error) {
        console.error("Failed to get active organization ID for tag filter", error);
      }
    };
    fetchOrgId();
  }, []);

  useEffect(() => {
    const currentTagIdsParam = searchParams.get('tagIds');
    if (currentTagIdsParam) {
      setSelectedTagIdsFromUrl(new Set(currentTagIdsParam.split(',').map(id => id.trim()).filter(id => id)));
    } else {
      setSelectedTagIdsFromUrl(new Set());
    }
  }, [searchParams]);

  const handleTagFilterChange = useCallback((newTagIds: Set<string>) => {
    urlManager.setTagsPreserveContext(newTagIds, gallerySearchTerm, currentFolderId);
  }, [gallerySearchTerm, currentFolderId, urlManager]);

  return {
    activeOrgId,
    selectedTagIdsFromUrl,
    handleTagFilterChange,
  };
} 
