'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import { SavedSearch } from '../../../../domain/entities/SavedSearch';
import { CurrentSearchCriteria } from '../../../hooks/search/useSavedSearches';

interface SavedSearchListProps {
  title: string;
  icon: 'clock' | 'trending';
  searches: SavedSearch[];
  onExecuteSearch: (searchCriteria: CurrentSearchCriteria) => void;
  showUseCount?: boolean;
}

export function SavedSearchList({
  title,
  icon,
  searches,
  onExecuteSearch,
  showUseCount = false
}: SavedSearchListProps) {
  const IconComponent = icon === 'clock' ? Clock : TrendingUp;

  const handleSearchClick = (search: SavedSearch) => {
    onExecuteSearch(search.searchCriteria);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <IconComponent className="h-4 w-4" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="space-y-2">
        {searches.map((search) => (
          <div
            key={search.id}
            className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={() => handleSearchClick(search)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{search.name}</h4>
                {showUseCount && search.useCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {search.useCount} uses
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {search.getDisplaySummary()}
              </p>
              {search.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {search.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
