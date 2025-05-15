'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TtsHistoryPanelHeaderProps {
  onClose: () => void;
}

export function TtsHistoryPanelHeader({ onClose }: TtsHistoryPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b shrink-0">
      <h2 className="text-lg font-semibold">Generation History</h2>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close history panel">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 