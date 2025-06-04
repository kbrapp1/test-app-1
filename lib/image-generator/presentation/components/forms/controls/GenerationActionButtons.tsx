'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Trash2, Download, Eye, ImageIcon } from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';
import { useDeleteGeneration } from '../../../hooks';

interface GenerationActionButtonsProps {
  generation: GenerationDto;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onMakeBaseImage?: () => void;
}

export const GenerationActionButtons: React.FC<GenerationActionButtonsProps> = ({
  generation,
  onView,
  onEdit,
  onCopy,
  onDownload,
  onMakeBaseImage,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteGeneration = useDeleteGeneration();
  const hasImage = !!generation.imageUrl;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGeneration.mutateAsync(generation.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error handling is now done in the hook via toast notifications
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleMakeBaseImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMakeBaseImage) {
      onMakeBaseImage();
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="flex items-center gap-1 p-2 bg-red-50 rounded border border-red-200">
        <span className="text-xs text-red-700 mr-2">Delete this generation?</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteConfirm}
          disabled={deleteGeneration.isPending}
          className="h-6 px-2 text-xs"
        >
          {deleteGeneration.isPending ? 'Deleting...' : 'Yes'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteCancel}
          className="h-6 px-2 text-xs"
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMakeBaseImage}
        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
        disabled={!hasImage}
        title="Make base image"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
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
        onClick={handleDeleteClick}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        disabled={deleteGeneration.isPending}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}; 