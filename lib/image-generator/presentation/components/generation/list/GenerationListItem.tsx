'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';
import { GenerationActionButtons } from '../../forms/controls/GenerationActionButtons';
import { getStatusColor, getStatusText, formatDate, truncatePrompt } from '../../../utils/generationFormatters';
import { useOptimizedImage } from '../../../utils/imageOptimization';

interface GenerationListItemProps {
  generation: GenerationDto;
  onImageClick: () => void;
  onEditClick: () => void;
  onCopyUrl: () => void;
  onDownloadImage: () => void;
  onMakeBaseImage?: () => void;
}

export const GenerationListItem: React.FC<GenerationListItemProps> = React.memo(({
  generation,
  onImageClick,
  onEditClick,
  onCopyUrl,
  onDownloadImage,
  onMakeBaseImage,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [blurPlaceholder, setBlurPlaceholder] = useState<string>();

  // Get optimized thumbnail URL for the 64x64 display
  const optimizedImageUrl = useOptimizedImage(generation.imageUrl || '', 'thumbnail');

  // Reset states when generation changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setBlurPlaceholder(undefined);
  }, [generation.id]);

  // Generate blur placeholder for progressive loading
  useEffect(() => {
    if (generation.imageUrl && generation.status === 'completed' && !imageError) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Create tiny 10x10 version for blur effect
        canvas.width = 10;
        canvas.height = 10;
        ctx?.drawImage(img, 0, 0, 10, 10);
        try {
          setBlurPlaceholder(canvas.toDataURL());
        } catch (error) {
          // Fallback if CORS issues
          setBlurPlaceholder(undefined);
        }
      };
      
      img.onerror = () => {
        setBlurPlaceholder(undefined);
      };
      
      // Use optimized URL for placeholder generation too
      img.src = optimizedImageUrl;
    }
  }, [optimizedImageUrl, generation.status, imageError]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const renderThumbnail = () => {
    if (generation.imageUrl && generation.status === 'completed' && !imageError) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          {/* Blur placeholder - shows first for smooth loading */}
          {blurPlaceholder && !imageLoaded && (
            <img
              src={blurPlaceholder}
              alt="Loading..."
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300"
            />
          )}
          
          {/* Main optimized image */}
          <img
            src={optimizedImageUrl}
            alt={generation.prompt}
            className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Loading spinner - only shows if no placeholder */}
          {!imageLoaded && !blurPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      );
    }

    // Failed or cancelled states
    if (generation.status === 'failed' || generation.status === 'cancelled') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <X className="w-6 h-6 text-red-500" />
        </div>
      );
    }

    // In-progress states
    if (['pending', 'processing'].includes(generation.status)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      );
    }

    // Default state
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200/60 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div>
        {/* Status and Date */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${getStatusColor(generation.status)}`}>
            {getStatusText(generation.status)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(generation.createdAt)}
          </span>
        </div>

        {/* Content Row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Optimized Thumbnail with Progressive Loading */}
          <div 
            className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onImageClick}
          >
            {renderThumbnail()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 mb-1">
              {truncatePrompt(generation.prompt)}
            </p>
            <div className="text-xs text-gray-500">
              Model: FLUX Kontext Max • Size: {generation.width}×{generation.height}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <GenerationActionButtons
          generation={generation}
          onView={onImageClick}
          onEdit={onEditClick}
          onCopy={onCopyUrl}
          onDownload={onDownloadImage}
          onMakeBaseImage={onMakeBaseImage}
        />

        {/* Status Messages */}
        {generation.status === 'failed' && (
          <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
            <div className="w-4 h-4 border border-red-600 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-red-600 rounded-full"></div>
            </div>
            Generation failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  const prevGen = prevProps.generation;
  const nextGen = nextProps.generation;
  
  // Compare critical generation fields that affect display
  if (
    prevGen.id !== nextGen.id ||
    prevGen.status !== nextGen.status ||
    prevGen.imageUrl !== nextGen.imageUrl ||
    prevGen.prompt !== nextGen.prompt ||
    prevGen.createdAt !== nextGen.createdAt ||
    prevGen.width !== nextGen.width ||
    prevGen.height !== nextGen.height
  ) {
    return false; // Re-render
  }
  
  // Compare callback functions (these should be stable)
  if (
    prevProps.onImageClick !== nextProps.onImageClick ||
    prevProps.onEditClick !== nextProps.onEditClick ||
    prevProps.onCopyUrl !== nextProps.onCopyUrl ||
    prevProps.onDownloadImage !== nextProps.onDownloadImage ||
    prevProps.onMakeBaseImage !== nextProps.onMakeBaseImage
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render, props are effectively the same
}); 