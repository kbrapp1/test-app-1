import { useState, useEffect, useCallback } from 'react';
import type { CombinedItem } from '@/lib/dam/types/component';

interface UseAssetGalleryDataProps {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: string;
  filterSizeMax?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useAssetGalleryData({
  currentFolderId,
  searchTerm,
  tagIds,
  filterType,
  filterCreationDateOption,
  filterDateStart,
  filterDateEnd,
  filterOwnerId,
  filterSizeOption,
  filterSizeMin,
  filterSizeMax,
  sortBy,
  sortOrder,
}: UseAssetGalleryDataProps) {
  const [allItems, setAllItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // When fetchData is called directly (e.g. refresh), we don't want optimistic hiding
    // setOptimisticallyHiddenItemId(null); // This state will be managed outside or passed in if needed by caller
    try {
      const timestamp = new Date().getTime();
      const queryTerm = searchTerm || '';
      let apiUrl = `/api/dam?folderId=${currentFolderId ?? ''}&q=${encodeURIComponent(queryTerm)}&_=${timestamp}`;
      if (tagIds) apiUrl += `&tagIds=${encodeURIComponent(tagIds)}`;
      if (filterType) apiUrl += `&type=${encodeURIComponent(filterType)}`;
      if (filterCreationDateOption) apiUrl += `&creationDateOption=${encodeURIComponent(filterCreationDateOption)}`;
      if (filterDateStart) apiUrl += `&dateStart=${encodeURIComponent(filterDateStart)}`;
      if (filterDateEnd) apiUrl += `&dateEnd=${encodeURIComponent(filterDateEnd)}`;
      if (filterOwnerId) apiUrl += `&ownerId=${encodeURIComponent(filterOwnerId)}`;
      if (filterSizeOption) apiUrl += `&sizeOption=${encodeURIComponent(filterSizeOption)}`;
      if (filterSizeMin) apiUrl += `&sizeMin=${encodeURIComponent(filterSizeMin)}`;
      if (filterSizeMax) apiUrl += `&sizeMax=${encodeURIComponent(filterSizeMax)}`;
      if (sortBy) apiUrl += `&sortBy=${encodeURIComponent(sortBy)}`;
      if (sortOrder) apiUrl += `&sortOrder=${encodeURIComponent(sortOrder)}`;

      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      
      const responseJson = await res.json();
      setAllItems(responseJson.data || []);
    } catch (e) {
      setAllItems([]);
      console.error("Error fetching DAM items:", e);
    } finally {
      setLoading(false);
      if (isFirstLoad) setIsFirstLoad(false); // Set isFirstLoad to false after the first fetch attempt
    }
  }, [
    currentFolderId, searchTerm, tagIds, filterType, filterCreationDateOption,
    filterDateStart, filterDateEnd, filterOwnerId, filterSizeOption,
    filterSizeMin, filterSizeMax, sortBy, sortOrder 
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { allItems, loading, isFirstLoad, fetchData, setAllItems };
} 