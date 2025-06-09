'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';
import { useOptimizedImage, generateImageSrcSet } from '../../../utils/imageOptimization';

interface GenerationImageProps {
  generation: GenerationDto;
  size: 'small' | 'medium' | 'large';
  className?: string;
}

const GenerationImageComponent: React.FC<GenerationImageProps> = ({
  generation,
  size,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState<string>();
  const isInProgress = ['pending', 'processing'].includes(generation.status);

  // Get optimized image URLs based on size
  const imageSize = size === 'small' ? 'thumbnail' : size === 'medium' ? 'medium' : 'full';
  const optimizedImageUrl = useOptimizedImage(generation.imageUrl || '', imageSize);
  const imageSrcSet = generation.imageUrl ? generateImageSrcSet(generation.imageUrl) : '';

  // Generate blur placeholder for progressive loading
  useEffect(() => {
    if (generation.imageUrl && generation.status === 'completed') {
      // Create a tiny version for blur effect
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = 20;
        canvas.height = 20;
        ctx?.drawImage(img, 0, 0, 20, 20);
        try {
          setPlaceholder(canvas.toDataURL());
        } catch (error) {
          // Fallback if CORS issues
          setPlaceholder(undefined);
        }
      };
      
      img.onerror = () => {
        setPlaceholder(undefined);
      };
      
      // Use original URL for placeholder generation to avoid race condition with optimized URL
      img.src = generation.imageUrl;
    }
  }, [generation.imageUrl, generation.status]);

  const getStatusIcon = () => {
    switch (generation.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      processing: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
    };

    const config = variants[generation.status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {getStatusIcon()}
        <span className="ml-1 capitalize">{generation.status}</span>
      </Badge>
    );
  };

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-full aspect-square max-w-md'
  };

  const renderImageContent = () => {
    if (generation.status === 'completed' && generation.imageUrl && !imageError) {
      return (
        <div className="relative w-full h-full">
          {/* Blur placeholder */}
          {placeholder && !imageLoaded && (
            <img
              src={placeholder}
              alt="Loading..."
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300"
            />
          )}
          
          {/* Main image */}
          <img
            src={optimizedImageUrl}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            alt={generation.prompt}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          
          {/* Loading spinner overlay */}
          {!imageLoaded && !placeholder && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      );
    }

    if (isInProgress) {
      return (
        <div className="text-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-1" />
          <div className="text-xs text-gray-500">
            {generation.status === 'pending' ? 'Queued' : 'Generating...'}
          </div>
        </div>
      );
    }

    if (generation.status === 'failed') {
      return (
        <div className="text-center">
          <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <div className="text-xs text-red-600">Failed</div>
          {generation.errorMessage && (
            <div className="text-xs text-gray-500 mt-1 max-w-full truncate">
              {generation.errorMessage}
            </div>
          )}
        </div>
      );
    }

    return <ImageIcon className="w-6 h-6 text-gray-400" />;
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        {renderImageContent()}
      </div>

      {/* Status overlay */}
      <div className="absolute top-2 left-2">
        {getStatusBadge()}
      </div>

      {/* Progress indicator for processing */}
      {generation.status === 'processing' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

// Memoized component with custom comparison
export const GenerationImage = React.memo(GenerationImageComponent, (prevProps, nextProps) => {
  const prevGen = prevProps.generation;
  const nextGen = nextProps.generation;
  
  // Compare critical fields that affect image rendering
  if (
    prevGen.id !== nextGen.id ||
    prevGen.status !== nextGen.status ||
    prevGen.imageUrl !== nextGen.imageUrl ||
    prevGen.errorMessage !== nextGen.errorMessage ||
    prevProps.size !== nextProps.size ||
    prevProps.className !== nextProps.className
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render
}); 