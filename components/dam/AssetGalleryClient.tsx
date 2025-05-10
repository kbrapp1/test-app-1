"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AssetGrid } from './AssetGrid';
import type { CombinedItem } from '@/types/dam';

interface AssetGalleryClientProps {
  currentFolderId: string | null;
  initialSearchTerm?: string;
}

export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = ({ currentFolderId, initialSearchTerm }) => {
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (folderIdToFetch: string | null, termToFetch: string | undefined) => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const queryTerm = termToFetch || '';
      const apiUrl = `/api/dam?folderId=${folderIdToFetch ?? ''}&q=${encodeURIComponent(queryTerm)}&_=${timestamp}`;
      console.log('AssetGalleryClient fetching:', apiUrl);
      const res = await fetch(apiUrl, { 
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }
      
      const data: CombinedItem[] = await res.json();
      setItems(data);
    } catch (e) {
      setItems([]);
      console.error("Error fetching DAM items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentFolderId, initialSearchTerm);
  }, [currentFolderId, initialSearchTerm]);

  if (loading) return (
    <div className="text-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
      <p>Loading...</p>
    </div>
  );
  
  if (items.length === 0) {
    return (
      <div className="text-center p-8">
        {initialSearchTerm ? (
          <p>No results found for "{initialSearchTerm}".</p>
        ) : (
          <p>This folder is empty.</p>
        )}
      </div>
    );
  }

  return <AssetGrid combinedItems={items} onDataChange={() => fetchData(currentFolderId, initialSearchTerm)} setItems={setItems} />;
}; 