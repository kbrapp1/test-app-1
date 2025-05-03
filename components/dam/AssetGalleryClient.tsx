"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AssetGrid } from './AssetGrid';
import type { CombinedItem } from './AssetGrid';

interface AssetGalleryClientProps {
  currentFolderId: string | null;
}

export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = ({ currentFolderId }) => {
  const cacheRef = useRef<Map<string | null, CombinedItem[]>>(new Map());
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      console.log(`[Client Cache] Checking cache for folder: ${currentFolderId}`);
      // Check in-memory cache first
      if (cacheRef.current.has(currentFolderId)) {
        console.log(`[Client Cache] Cache HIT for folder: ${currentFolderId}`);
        setItems(cacheRef.current.get(currentFolderId)!);
      } else {
        console.log(`[Client Cache] Cache MISS for folder: ${currentFolderId}, fetching from API...`);
        setLoading(true);
        try {
          const res = await fetch(`/api/dam?folderId=${currentFolderId ?? ''}`, { cache: 'force-cache', next: { revalidate: 60 } });
          const data: CombinedItem[] = await res.json();
          cacheRef.current.set(currentFolderId, data);
          if (!cancelled) setItems(data);
        } catch (e) {
          console.error('Error fetching folder items:', e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentFolderId]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (items.length === 0) return <p>This folder is empty.</p>;

  return <AssetGrid combinedItems={items} />;
}; 