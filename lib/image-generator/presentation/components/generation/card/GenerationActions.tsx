'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Download, 
  Save, 
  Eye, 
  Copy, 
  X,
  CheckCircle,
  Edit3,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';
import { useCancelGeneration, useSaveGenerationToDAM } from '../../../hooks';

interface GenerationActionsProps {
  generation: GenerationDto;
  onStopPropagation: (e: React.MouseEvent) => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
  className?: string;
}

const GenerationActionsComponent: React.FC<GenerationActionsProps> = ({
  generation,
  onStopPropagation,
  onEditImage,
  className = ''
}) => {
  const cancelGeneration = useCancelGeneration();
  const saveToDAM = useSaveGenerationToDAM();
  
  const isInProgress = ['pending', 'processing'].includes(generation.status);
  const canEdit = generation.status === 'completed' && generation.imageUrl;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCancel = useCallback(async (e: React.MouseEvent) => {
    onStopPropagation(e);
    if (isInProgress) {
      try {
        await cancelGeneration.mutateAsync(generation.id);
      } catch (error) {
        console.error('Failed to cancel generation:', error);
      }
    }
  }, [onStopPropagation, isInProgress, cancelGeneration, generation.id]);

  const handleSaveToDAM = useCallback(async (e: React.MouseEvent) => {
    onStopPropagation(e);
    if (generation.status === 'completed' && !generation.savedToDAM) {
      try {
        await saveToDAM.mutateAsync(generation.id);
      } catch (error) {
        console.error('Failed to save to DAM:', error);
      }
    }
  }, [onStopPropagation, generation.status, generation.savedToDAM, generation.id, saveToDAM]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    onStopPropagation(e);
    if (generation.imageUrl) {
      const link = document.createElement('a');
      link.href = generation.imageUrl;
      link.download = `generated-image-${generation.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [onStopPropagation, generation.imageUrl, generation.id]);

  const handleCopyPrompt = useCallback((e: React.MouseEvent) => {
    onStopPropagation(e);
    navigator.clipboard.writeText(generation.prompt);
  }, [onStopPropagation, generation.prompt]);

  const handleEditImage = useCallback((e: React.MouseEvent) => {
    onStopPropagation(e);
    if (canEdit && onEditImage && generation.imageUrl) {
      onEditImage(generation.imageUrl, generation.prompt);
    }
  }, [onStopPropagation, canEdit, onEditImage, generation.imageUrl, generation.prompt]);

  const getEditTypeIcon = () => {
    switch (generation.editType) {
      case 'image-editing':
        return <Edit3 className="w-3 h-3 text-purple-500" />;
      case 'style-transfer':
        return <Palette className="w-3 h-3 text-pink-500" />;
      case 'background-swap':
        return <ImageIcon className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderPrimaryActions = () => {
    if (isInProgress) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={cancelGeneration.isPending}
          className="flex-1 h-8 text-xs"
        >
          <X className="w-3 h-3 mr-1 text-red-500" />
          Cancel
        </Button>
      );
    }

    if (generation.status === 'completed') {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 h-8 text-xs"
          >
            <Download className="w-3 h-3 mr-1 text-blue-500" />
            Download
          </Button>
          
          {canEdit && onEditImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditImage}
              className="flex-1 h-8 text-xs text-purple-600 hover:text-purple-700"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
          
          {!generation.savedToDAM ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToDAM}
              disabled={saveToDAM.isPending}
              className="flex-1 h-8 text-xs"
            >
              <Save className="w-3 h-3 mr-1 text-green-500" />
              Save to DAM
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
        </>
      );
    }

    return (
      <div className="flex-1 text-center text-xs text-gray-500">
        Generation {generation.status}
      </div>
    );
  };

  const renderDropdownMenu = () => {
    if (generation.status !== 'completed') return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => { onStopPropagation(e); /* View details */ }}>
            <Eye className="w-4 h-4 mr-2 text-gray-500" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyPrompt}>
            <Copy className="w-4 h-4 mr-2 text-gray-500" />
            Copy Prompt
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canEdit && onEditImage && (
            <>
              <DropdownMenuItem onClick={handleEditImage} className="text-purple-600">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit This Image
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleDownload} className="text-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
          {!generation.savedToDAM && (
            <DropdownMenuItem onClick={handleSaveToDAM} className="text-green-600">
              <Save className="w-4 h-4 mr-2" />
              Save to DAM
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className={`flex items-center gap-2 pt-2 border-t border-gray-100/60 ${className}`}>
      {/* Generation Type Badge */}
      {generation.editType !== 'text-to-image' && (
        <Badge variant="outline" className="text-xs">
          {getEditTypeIcon()}
          <span className="ml-1 capitalize">
            {generation.editType.replace('-', ' ')}
          </span>
        </Badge>
      )}
      
      <div className="flex-1 flex items-center gap-2">
        {renderPrimaryActions()}
      </div>
      
      {renderDropdownMenu()}
    </div>
  );
};

// Memoized component with custom comparison for optimal performance
export const GenerationActions = React.memo(GenerationActionsComponent, (prevProps, nextProps) => {
  const prevGen = prevProps.generation;
  const nextGen = nextProps.generation;
  
  // Compare critical generation fields that affect actions
  if (
    prevGen.id !== nextGen.id ||
    prevGen.status !== nextGen.status ||
    prevGen.imageUrl !== nextGen.imageUrl ||
    prevGen.savedToDAM !== nextGen.savedToDAM ||
    prevGen.editType !== nextGen.editType ||
    prevGen.prompt !== nextGen.prompt
  ) {
    return false; // Re-render
  }
  
  // Compare other props
  if (
    prevProps.onStopPropagation !== nextProps.onStopPropagation ||
    prevProps.onEditImage !== nextProps.onEditImage ||
    prevProps.className !== nextProps.className
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render, props are effectively the same
});

GenerationActions.displayName = 'GenerationActions'; 