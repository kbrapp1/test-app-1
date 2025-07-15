import React from 'react';
import Image from 'next/image';
import type { GalleryItemDto } from '../../../../application/use-cases/folders/ListFolderContentsUseCase';

interface DragItem {
  type: 'asset' | 'folder';
  item: GalleryItemDto;
}

interface DragOverlayProps {
  activeItem: DragItem | null;
  isProcessing: boolean;
  selectedAssets?: string[];
  selectedFolders?: string[];
}

/**
 * Enhanced drag preview component with multi-asset support
 * 
 * Single Responsibility: Visual representation of dragged items
 */
export function DragOverlay({ 
  activeItem, 
  isProcessing, 
  selectedAssets = [], 
  selectedFolders = [] 
}: DragOverlayProps) {
  if (!activeItem || (activeItem.type !== 'asset' && activeItem.type !== 'folder')) return null;

  // Check if we're dragging multiple items
  const isDraggingMultiple = (activeItem.type === 'asset' && selectedAssets.length > 1) || 
                            (activeItem.type === 'folder' && selectedFolders.length > 1) ||
                            (selectedAssets.length > 0 && selectedFolders.length > 0);

  const totalCount = selectedAssets.length + selectedFolders.length;

  if (activeItem.type === 'folder') {
    return isDraggingMultiple ? 
      <MultipleFolderPreview totalCount={totalCount} isProcessing={isProcessing} /> :
      <SingleFolderPreview folder={activeItem.item as GalleryItemDto & { type: 'folder' }} isProcessing={isProcessing} />;
  }

  const asset = activeItem.item as GalleryItemDto & { type: 'asset' };
  return isDraggingMultiple ? 
    <MultipleAssetPreview asset={asset} totalCount={totalCount} isProcessing={isProcessing} /> :
    <SingleAssetPreview asset={asset} isProcessing={isProcessing} />;
}

function MultipleFolderPreview({ totalCount, isProcessing }: { totalCount: number; isProcessing: boolean }) {
  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[240px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
        {/* Stacked folder icons */}
        <div className="relative w-16 h-16 mb-3">
          {/* Background folders */}
          <div className="absolute top-1 left-1 w-14 h-14 rounded-lg bg-blue-50 border border-blue-200 opacity-60"></div>
          <div className="absolute top-0.5 left-0.5 w-15 h-15 rounded-lg bg-blue-75 border border-blue-250 opacity-80"></div>
          {/* Main folder */}
          <div className="absolute top-0 left-0 w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
            <div className="w-8 h-8 text-blue-600">📁</div>
          </div>
          {/* Count badge */}
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {totalCount}
          </div>
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full">
          {totalCount} items
        </h3>
        <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
          {isProcessing ? 'Moving...' : 'Drag to move'}
        </p>
      </div>
    </div>
  );
}

function SingleFolderPreview({ folder, isProcessing }: { folder: GalleryItemDto & { type: 'folder' }; isProcessing: boolean }) {
  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
          <div className="w-8 h-8 text-blue-600">📁</div>
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={folder.name}>
          {folder.name}
        </h3>
        <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
          {isProcessing ? 'Moving...' : 'Drag to move'}
        </p>
      </div>
    </div>
  );
}

function MultipleAssetPreview({ asset, totalCount, isProcessing }: { asset: GalleryItemDto & { type: 'asset' }; totalCount: number; isProcessing: boolean }) {
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[240px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
        {/* Stacked thumbnails */}
        <div className="relative w-16 h-16 mb-3">
          {/* Background thumbnails */}
          <div className="absolute top-1 left-1 w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 opacity-60"></div>
          <div className="absolute top-0.5 left-0.5 w-15 h-15 rounded-lg bg-gray-75 border border-gray-250 opacity-80"></div>
          {/* Main thumbnail */}
          <div className="absolute top-0 left-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-300">
            {isImage && asset.publicUrl ? (
              <Image
                src={asset.publicUrl}
                alt={asset.name}
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-lg"
                draggable="false"
              />
            ) : (
              <div className="w-6 h-6 text-gray-500">📄</div>
            )}
          </div>
          {/* Count badge */}
          <div className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {totalCount}
          </div>
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full">
          {totalCount} items
        </h3>
        <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
          {isProcessing ? 'Moving...' : 'Drag to move'}
        </p>
      </div>
    </div>
  );
}

function SingleAssetPreview({ asset, isProcessing }: { asset: GalleryItemDto & { type: 'asset' }; isProcessing: boolean }) {
  const isImage = asset.mimeType?.toLowerCase().startsWith('image/');

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 shadow-2xl rotate-3 cursor-grabbing max-w-[200px] transition-all duration-200 ${
      isProcessing ? 'opacity-70 scale-95' : 'opacity-90'
    }`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
          {isImage && asset.publicUrl ? (
            <Image
              src={asset.publicUrl}
              alt={asset.name}
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-lg"
              draggable="false"
            />
          ) : (
            <div className="w-6 h-6 text-gray-500">📄</div>
          )}
        </div>
        <h3 className="font-medium text-sm text-gray-900 mb-2 truncate w-full" title={asset.name}>
          {asset.name}
        </h3>
        <p className={`text-xs font-medium ${isProcessing ? 'text-green-600' : 'text-blue-600'}`}>
          {isProcessing ? 'Moving...' : 'Drag to move'}
        </p>
      </div>
    </div>
  );
} 