'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Trash2, Download, Eye } from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';

interface GenerationActionButtonsProps {
  generation: GenerationDto;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export const GenerationActionButtons: React.FC<GenerationActionButtonsProps> = ({
  generation,
  onView,
  onEdit,
  onCopy,
  onDownload,
}) => {
  const hasImage = !!generation.imageUrl;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-8 w-8 p-0"
        disabled={!hasImage}
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 w-8 p-0"
        disabled={!hasImage}
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="h-8 w-8 p-0"
        disabled={!hasImage}
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="h-8 w-8 p-0"
        disabled={!hasImage}
      >
        <Download className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        disabled
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}; 