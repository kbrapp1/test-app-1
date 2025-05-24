'use client';

import React, { useState } from 'react';
// Remove the direct import of AssetGallery (Server Component)
// import { AssetGallery } from './AssetGallery';
import { AssetGalleryClient } from './AssetGalleryClient';
import { AssetGrid } from './AssetGrid';
import { VirtualizedAssetGrid } from './VirtualizedAssetGrid';
import { useDamGalleryData } from '../../hooks/useDamGalleryData';

/**
 * DomainGallery - Complete Domain-Driven Gallery Component
 * 
 * This component demonstrates multiple DDD presentation patterns:
 * - Server-side rendering with domain use cases (via ServerGalleryWrapper)
 * - Client-side data fetching with domain hooks 
 * - Grid and gallery view modes
 * - High-performance virtualization for large datasets
 * - Proper separation of concerns
 */

interface DomainGalleryProps {
  folderId?: string;
  initialData?: any;
}

export const DomainGallery: React.FC<DomainGalleryProps> = ({
  folderId,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'client' | 'grid' | 'virtualized'>('client');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // For client and grid modes, use domain hook
  const galleryData = useDamGalleryData({
    currentFolderId: folderId || null,
  });

  // Only destructure when needed to avoid unnecessary computation
  const { 
    items: clientData, 
    loading, 
    error, 
    fetchData: refetch 
  } = galleryData;

  const handleItemClick = (item: any) => {
    console.log('Item clicked:', item);
    // In a real app, this would navigate to folder or open asset details
  };

  const handleItemAction = (action: string, item: any) => {
    console.log('Item action:', action, item);
    // In a real app, this would handle actions like rename, delete, move
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection Controls */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('server')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'server' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Server Gallery
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'client' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Client Gallery
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'grid' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Asset Grid
          </button>
          <button
            onClick={() => setActiveTab('virtualized')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'virtualized' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Virtualized Grid
          </button>
        </div>

        {/* View Mode Toggle (for grid mode) */}
        {activeTab === 'grid' && (
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'grid' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
          </div>
        )}
      </div>

      {/* Status Information */}
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Active Mode:</strong> {activeTab}</p>
        {activeTab === 'grid' && (
          <p><strong>View Mode:</strong> {viewMode}</p>
        )}
        <p><strong>Folder ID:</strong> {folderId || 'root'}</p>
        {(activeTab === 'client' || activeTab === 'grid') && (
          <p><strong>Loading State:</strong> {loading ? 'Loading...' : 'Loaded'}</p>
        )}
      </div>

      {/* Component Rendering */}
      <div className="min-h-[400px]">
        {activeTab === 'server' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Server-Side Gallery (AssetGallery)
            </h2>
            <p className="text-gray-600">
              Server components are not compatible with client component mode. Use Client Gallery instead.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ <strong>Note:</strong> Server Components (async) cannot be used inside Client Components. 
                The Server Gallery is available in dedicated Server Component pages.
              </p>
              <button
                onClick={() => setActiveTab('client')}
                className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                Switch to Client Gallery
              </button>
            </div>
          </div>
        )}

        {activeTab === 'client' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-700">
              Client-Side Gallery (AssetGalleryClient)
            </h2>
            <p className="text-gray-600">
              This component uses client-side domain hooks for reactive data fetching.
            </p>
            {loading && (
              <div className="text-center py-8">
                <p>Loading gallery data...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-600">
                <p>Error: {error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && (
              <AssetGalleryClient 
                currentFolderId={folderId || null}
                viewMode={viewMode}
                enableNavigation={true}
              />
            )}
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-purple-700">
              Asset Grid (AssetGrid)
            </h2>
            <p className="text-gray-600">
              This component provides both grid and list view modes with interactive controls.
            </p>
            {loading && (
              <div className="text-center py-8">
                <p>Loading grid data...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-600">
                <p>Error: {error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && (
              <AssetGrid 
                items={clientData}
                viewMode={viewMode}
                onItemClick={handleItemClick}
                onItemAction={handleItemAction}
              />
            )}
          </div>
        )}

        {activeTab === 'virtualized' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-pink-700">
              Virtualized Grid (VirtualizedAssetGrid)
            </h2>
            <p className="text-gray-600">
              This component handles large datasets (1000+ items) with high-performance virtualization.
            </p>
            {loading && (
              <div className="text-center py-8">
                <p>Loading virtualized data...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-600">
                <p>Error: {error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && (
              <VirtualizedAssetGrid 
                items={clientData}
                viewMode={viewMode}
                onItemClick={handleItemClick}
                onItemAction={handleItemAction}
              />
            )}
          </div>
        )}
      </div>

      {/* Architecture Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Domain-Driven Design Benefits:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Server Gallery:</strong> Uses domain use cases directly in server components</li>
          <li>• <strong>Client Gallery:</strong> Uses domain hooks for reactive client-side data</li>
          <li>• <strong>Asset Grid:</strong> Provides flexible UI patterns with domain DTOs</li>
          <li>• <strong>Virtualized Grid:</strong> Provides high-performance virtualization for large datasets</li>
          <li>• <strong>Clean Architecture:</strong> Presentation → Application → Domain separation</li>
          <li>• <strong>Type Safety:</strong> Domain entities ensure consistent data structures</li>
          <li>• <strong>Testability:</strong> Each layer can be tested independently</li>
        </ul>
      </div>
    </div>
  );
};

export default DomainGallery; 