'use client';

import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { FolderNavigationDto } from '../../../application/use-cases/NavigateToFolderUseCase';

/**
 * FolderBreadcrumbs - Domain-Driven Navigation Component
 * 
 * This component demonstrates proper DDD presentation patterns:
 * - Uses domain DTOs (FolderNavigationDto) for type safety
 * - Handles folder navigation with business logic
 * - Provides accessible breadcrumb navigation
 * - Clean separation between UI and domain concerns
 */

interface FolderBreadcrumbsProps {
  navigation: FolderNavigationDto;
  onNavigateToFolder: (folderId: string | null) => void;
  loading?: boolean;
}

export const FolderBreadcrumbs: React.FC<FolderBreadcrumbsProps> = ({
  navigation,
  onNavigateToFolder,
  loading = false,
}) => {
  const handleBreadcrumbClick = (folderId: string | null, isClickable: boolean) => {
    if (!isClickable || loading) return;
    onNavigateToFolder(folderId);
  };

  const getBreadcrumbIcon = (folderId: string | null) => {
    return folderId === null ? (
      <Home className="w-4 h-4" />
    ) : (
      <Folder className="w-4 h-4" />
    );
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border">
      {/* Current Path Display */}
      <div className="flex items-center space-x-1">
        <Folder className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-gray-800">
          {navigation.currentFolder.path}
        </span>
      </div>

      {/* Separator */}
      <div className="text-gray-300">•</div>

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-1" aria-label="Folder navigation">
        {navigation.breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.id || 'root'}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            
            <button
              onClick={() => handleBreadcrumbClick(breadcrumb.id, breadcrumb.isClickable)}
              disabled={!breadcrumb.isClickable || loading}
              className={`
                flex items-center space-x-1 px-2 py-1 rounded transition-colors
                ${breadcrumb.isClickable && !loading
                  ? 'hover:bg-blue-100 hover:text-blue-700 cursor-pointer'
                  : 'cursor-default'
                }
                ${!breadcrumb.isClickable 
                  ? 'font-medium text-gray-800' 
                  : 'text-gray-600'
                }
              `}
              aria-current={!breadcrumb.isClickable ? 'page' : undefined}
            >
              {getBreadcrumbIcon(breadcrumb.id)}
              <span>{breadcrumb.name}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* Navigation Actions */}
      {navigation.canNavigateUp && (
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
          <button
            onClick={() => handleBreadcrumbClick(navigation.parentFolderId || null, true)}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
            title="Go to parent folder"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-sm">Up</span>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default FolderBreadcrumbs; 