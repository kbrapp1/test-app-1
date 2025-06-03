'use client';

import React, { useMemo } from 'react';
import { Sparkles, Timer } from 'lucide-react';
import { GenerationDto } from '../../application/dto';

interface GenerationInfoProps {
  generation: GenerationDto;
  className?: string;
}

const GenerationInfoComponent: React.FC<GenerationInfoProps> = ({
  generation,
  className = ''
}) => {
  // Memoize expensive formatting operations
  const formattedTime = useMemo(() => {
    if (!generation.generationTimeSeconds) return 'Unknown';
    const seconds = generation.generationTimeSeconds;
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }, [generation.generationTimeSeconds]);

  const formattedCost = useMemo(() => {
    return `$${(generation.costCents / 100).toFixed(2)}`;
  }, [generation.costCents]);

  const formattedCreatedTime = useMemo(() => {
    return new Date(generation.createdAt).toLocaleTimeString();
  }, [generation.createdAt]);

  const dimensions = useMemo(() => {
    return `${generation.width}x${generation.height}`;
  }, [generation.width, generation.height]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-gray-900 line-clamp-2">
        {generation.prompt}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {dimensions}
        </div>
        {generation.generationTimeSeconds && (
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {formattedTime}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{formattedCost}</span>
        <span className="text-gray-400">
          {formattedCreatedTime}
        </span>
      </div>
    </div>
  );
};

// Memoized component with custom comparison
export const GenerationInfo = React.memo(GenerationInfoComponent, (prevProps, nextProps) => {
  const prevGen = prevProps.generation;
  const nextGen = nextProps.generation;
  
  // Compare fields that affect the info display
  if (
    prevGen.id !== nextGen.id ||
    prevGen.prompt !== nextGen.prompt ||
    prevGen.width !== nextGen.width ||
    prevGen.height !== nextGen.height ||
    prevGen.generationTimeSeconds !== nextGen.generationTimeSeconds ||
    prevGen.costCents !== nextGen.costCents ||
    prevGen.createdAt !== nextGen.createdAt ||
    prevProps.className !== nextProps.className
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render
}); 