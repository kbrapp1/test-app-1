'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TtsHistoryPanelSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClearSearch: () => void;
}

export function TtsHistoryPanelSearch({ 
  searchQuery, 
  onSearchQueryChange,
  onClearSearch 
}: TtsHistoryPanelSearchProps) {
  return (
    <div className="p-4 border-b shrink-0">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search history..."
          className="pl-8 pr-10"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          aria-label="Search TTS history"
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClearSearch}
            aria-label="Clear search query"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 