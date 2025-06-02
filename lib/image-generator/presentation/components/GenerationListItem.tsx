'use client';

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { GenerationDto } from '../../application/dto';
import { GenerationActionButtons } from './GenerationActionButtons';
import { getStatusColor, getStatusText, formatDate, truncatePrompt } from '../utils/generationFormatters';

interface GenerationListItemProps {
  generation: GenerationDto;
  onImageClick: () => void;
  onEditClick: () => void;
  onCopyUrl: () => void;
  onDownloadImage: () => void;
}

export const GenerationListItem: React.FC<GenerationListItemProps> = ({
  generation,
  onImageClick,
  onEditClick,
  onCopyUrl,
  onDownloadImage,
}) => {
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
          {/* Thumbnail */}
          <div 
            className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onImageClick}
          >
            {generation.imageUrl ? (
              <img 
                src={generation.imageUrl} 
                alt={generation.prompt}
                className="w-full h-full object-cover"
              />
            ) : generation.status === 'failed' || generation.status === 'cancelled' ? (
              <div className="w-full h-full flex items-center justify-center bg-red-50">
                <X className="w-6 h-6 text-red-500" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
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
}; 