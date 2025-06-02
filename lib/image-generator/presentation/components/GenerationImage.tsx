'use client';

import React, { useState } from 'react';
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
import { GenerationDto } from '../../application/dto';

interface GenerationImageProps {
  generation: GenerationDto;
  size: 'small' | 'medium' | 'large';
  className?: string;
}

export const GenerationImage: React.FC<GenerationImageProps> = ({
  generation,
  size,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const isInProgress = ['pending', 'processing'].includes(generation.status);

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
        <img
          src={generation.imageUrl}
          alt={generation.prompt}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
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