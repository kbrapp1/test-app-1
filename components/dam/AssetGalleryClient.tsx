"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AssetGrid } from './AssetGrid';
import type { CombinedItem } from './AssetGrid';

interface AssetGalleryClientProps {
  currentFolderId: string | null;
}

export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = ({ currentFolderId }) => {
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Add timestamp to bust browser cache
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/dam?folderId=${currentFolderId ?? ''}&_=${timestamp}`, { 
        cache: 'no-store' // Ensure we get fresh data
      });
      
      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }
      
      const data: CombinedItem[] = await res.json();
      setItems(data);
    } catch (e) {
      // Silently handle errors - we'll show empty state UI
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      if (!cancelled) await fetchData();
    };
    
    load();
    
    return () => { cancelled = true; };
  }, [currentFolderId]);

  if (loading) return (
    <div className="text-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
      <p>Loading assets...</p>
    </div>
  );
  
  if (items.length === 0) {
    return (
      <div className="text-center p-8">
        <p>This folder is empty.</p>
      </div>
    );
  }

  return <AssetGrid combinedItems={items} />;
}; 