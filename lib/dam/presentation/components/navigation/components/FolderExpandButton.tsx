'use client';

import React from 'react';
import { ChevronRight, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type FolderNode } from '@/lib/store/folderStore';

interface FolderExpandButtonProps {
  folderNode: FolderNode;
  onToggleExpand: () => void;
}

/**
 * FolderExpandButton Component
 * Follows Single Responsibility Principle - handles folder expand/collapse button display and interaction
 */
export const FolderExpandButton: React.FC<FolderExpandButtonProps> = ({
  folderNode,
  onToggleExpand,
}) => {
  const renderIcon = () => {
    if (folderNode.isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (folderNode.hasError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (folderNode.isExpanded) {
      return <ChevronDown className="h-4 w-4" />;
    }
    
    return <ChevronRight className="h-4 w-4" />;
  };

  return (
    <Button 
      variant="ghost" 
      onClick={onToggleExpand}
      className="pl-2 pr-1 py-1 h-6 w-6 mr-1 flex items-center justify-center flex-shrink-0"
      disabled={folderNode.isLoading}
    >
      {renderIcon()}
    </Button>
  );
}; 
