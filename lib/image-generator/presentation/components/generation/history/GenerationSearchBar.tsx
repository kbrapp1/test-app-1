'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface GenerationSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export const GenerationSearchBar: React.FC<GenerationSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Search history..."
}) => {
  return (
    <div className="p-4 border-b border-gray-200/60">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-gray-50 border-0"
        />
      </div>
    </div>
  );
}; 