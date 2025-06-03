'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GenerationDto } from '../../../../application/dto';
import { useGenerationPolling } from '../../../hooks';
import { GenerationImage } from './GenerationImage';
import { GenerationInfo } from './GenerationInfo';
import { GenerationActions } from './GenerationActions';

interface GenerationCardProps {
  generation: GenerationDto;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
  className?: string;
}

const GenerationCardComponent: React.FC<GenerationCardProps> = ({
  generation,
  showActions = false,
  size = 'medium',
  onClick,
  onEditImage,
  className = ''
}) => {
  // Polling for in-progress generations
  const isInProgress = ['pending', 'processing'].includes(generation.status);
  useGenerationPolling(generation.id, isInProgress);

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const cardClasses = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4'
  };

  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-md cursor-pointer border-gray-200/60 ${className}`}
      onClick={onClick}
    >
      <CardContent className={cardClasses[size]}>
        <div className="space-y-3">
          <GenerationImage 
            generation={generation} 
            size={size}
          />

          <GenerationInfo generation={generation} />

          {showActions && (
            <GenerationActions 
              generation={generation}
              onStopPropagation={handleStopPropagation}
              onEditImage={onEditImage}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Memoized component with custom comparison for optimal performance
export const GenerationCard = React.memo(GenerationCardComponent, (prevProps, nextProps) => {
  // Compare generation data that affects rendering
  const prevGen = prevProps.generation;
  const nextGen = nextProps.generation;
  
  // Check critical generation fields that affect display
  if (
    prevGen.id !== nextGen.id ||
    prevGen.status !== nextGen.status ||
    prevGen.imageUrl !== nextGen.imageUrl ||
    prevGen.prompt !== nextGen.prompt ||
    prevGen.updatedAt !== nextGen.updatedAt ||
    prevGen.errorMessage !== nextGen.errorMessage
  ) {
    return false; // Re-render
  }
  
  // Compare other props
  if (
    prevProps.showActions !== nextProps.showActions ||
    prevProps.size !== nextProps.size ||
    prevProps.className !== nextProps.className ||
    prevProps.onClick !== nextProps.onClick ||
    prevProps.onEditImage !== nextProps.onEditImage
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render, props are effectively the same
}); 