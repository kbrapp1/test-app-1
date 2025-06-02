'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GenerationDto } from '../../application/dto';
import { useGenerationPolling } from '../hooks';
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

export const GenerationCard: React.FC<GenerationCardProps> = ({
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