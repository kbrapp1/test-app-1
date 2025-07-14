import React from 'react';
import Link from 'next/link';
import { DamBreadcrumbs, type BreadcrumbItemData } from '../../navigation';

export interface WorkspaceHeaderProps {
  gallerySearchTerm: string;
  currentFolderId: string | null;
  breadcrumbPath: BreadcrumbItemData[];
  breadcrumbLoading?: boolean;
}

/**
 * WorkspaceHeader - Domain-Focused Workspace Header
 * 
 * Manages the header area of the DAM workspace:
 * - Shows search results status and clear search action
 * - Displays folder breadcrumb navigation when browsing
 * - Provides contextual navigation between search and browse modes
 * 
 * Domain responsibility: workspace navigation context display
 */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  gallerySearchTerm,
  currentFolderId,
  breadcrumbPath,
  breadcrumbLoading = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-grow min-w-0">
        {gallerySearchTerm && gallerySearchTerm.trim() !== '' ? (
          <div className="text-sm text-muted-foreground">
            Showing search results for &ldquo;<strong>{gallerySearchTerm}</strong>&rdquo;. 
            <Link 
              href={`/dam${currentFolderId ? '?folderId='+currentFolderId : ''}`} 
              className="text-primary hover:underline ml-1"
            >
              Clear search
            </Link>
          </div>
        ) : (
          <div className="relative">
            <DamBreadcrumbs path={breadcrumbPath} />
            {breadcrumbLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 
 
