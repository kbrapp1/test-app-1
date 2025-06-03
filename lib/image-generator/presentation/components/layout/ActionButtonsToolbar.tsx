'use client';

// Action Buttons Toolbar - DDD Presentation Layer
// Single Responsibility: Handle action buttons for generated images
// Following DDD principles with focused UI component responsibility

import React from 'react';

interface ActionButtonsToolbarProps {
  hasImage: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onSaveToDAM: () => void;
  onShare: () => void;
  onClear: () => void;
  onDelete: () => void;
}

/**
 * Action Buttons Toolbar Component
 * Provides action buttons for generated images with proper separation of concerns
 */
export const ActionButtonsToolbar: React.FC<ActionButtonsToolbarProps> = ({
  hasImage,
  onEdit,
  onDownload,
  onSaveToDAM,
  onShare,
  onClear,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-start px-4 py-1">
      <div className="flex items-center gap-2">
        {hasImage && (
          <>
            <ActionButton
              onClick={onEdit}
              title="Edit this image"
              variant="default"
            >
              <EditIcon />
            </ActionButton>
            
            <ActionButton
              onClick={onDownload}
              title="Download image"
              variant="default"
            >
              <DownloadIcon />
            </ActionButton>
            
            <ActionButton
              onClick={onSaveToDAM}
              title="Save to DAM"
              variant="default"
            >
              <SaveIcon />
            </ActionButton>
            
            <ActionButton
              onClick={onShare}
              title="Share image"
              variant="default"
            >
              <ShareIcon />
            </ActionButton>
            
            <div className="h-4 w-px bg-gray-200 mx-1" />
            
            <ActionButton
              onClick={onClear}
              title="Clear image"
              variant="destructive"
            >
              <ClearIcon />
            </ActionButton>
            
            <ActionButton
              onClick={onDelete}
              title="Delete generation permanently"
              variant="destructive"
            >
              <DeleteIcon />
            </ActionButton>
          </>
        )}
        
        {!hasImage && (
          <div className="text-xs text-gray-400 italic pl-2">
            Generate an image to see actions
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Action Button Component
 * Reusable button component with consistent styling
 */
const ActionButton: React.FC<{
  onClick: () => void;
  title: string;
  variant: 'default' | 'destructive';
  children: React.ReactNode;
}> = ({ onClick, title, variant, children }) => {
  const baseClasses = "p-2 border rounded-md transition-colors";
  
  const variantClasses = variant === 'destructive'
    ? "text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
      title={title}
    >
      {children}
    </button>
  );
};

// Icon Components for better maintainability and reusability
const EditIcon = () => (
  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
); 