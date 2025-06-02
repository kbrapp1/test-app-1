'use client';

import React from 'react';
import { Sparkles, Timer } from 'lucide-react';
import { GenerationDto } from '../../application/dto';

interface GenerationInfoProps {
  generation: GenerationDto;
  className?: string;
}

export const GenerationInfo: React.FC<GenerationInfoProps> = ({
  generation,
  className = ''
}) => {
  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-gray-900 line-clamp-2">
        {generation.prompt}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {generation.width}x{generation.height}
        </div>
        {generation.generationTimeSeconds && (
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {formatTime(generation.generationTimeSeconds)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{formatCost(generation.costCents)}</span>
        <span className="text-gray-400">
          {new Date(generation.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}; 