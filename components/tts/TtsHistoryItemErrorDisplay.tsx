import React from 'react';
import { AlertTriangleIcon } from 'lucide-react';

export interface TtsHistoryItemErrorDisplayProps {
  statusDisplay: string;
  errorMessage?: string | null;
  isLinkEffectivelyUnusable: boolean;
  unusableLinkMessage: string;
}

export function TtsHistoryItemErrorDisplay({
  statusDisplay,
  errorMessage,
  isLinkEffectivelyUnusable,
  unusableLinkMessage,
}: TtsHistoryItemErrorDisplayProps) {
  if (statusDisplay === 'failed' && errorMessage) {
    return <p className="mt-2 text-xs text-red-600">Error: {errorMessage}</p>;
  }
  if (isLinkEffectivelyUnusable) {
    return (
      <p className="mt-2 text-xs text-red-500 flex items-center">
        <AlertTriangleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
        {unusableLinkMessage}
      </p>
    );
  }
  return null;
} 