import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onClear?: () => void;
}

/**
 * ErrorDisplay Component
 * Single Responsibility: Display generation errors with clear action
 * Presentation Layer - Pure UI component for error presentation
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClear }) => (
  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/15 rounded-lg">
    <div className="flex items-start gap-2">
      <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-destructive mb-1">Generation Failed</p>
        <p className="text-xs text-destructive/80">{error}</p>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="text-destructive/60 hover:text-destructive text-sm"
        >
          ✕
        </button>
      )}
    </div>
  </div>
); 