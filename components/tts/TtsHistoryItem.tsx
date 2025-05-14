'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RefreshCcw, Trash2, Database as DatabaseIcon } from 'lucide-react'; // Aliased Database icon
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayIcon, PauseIcon, ExternalLinkIcon, AlertTriangleIcon, CheckCircle2Icon, CircleSlashIcon, Loader2Icon } from 'lucide-react';
// import type { TtsPrediction } from '@/types/supabase-custom'; // Assuming a TtsPrediction type
import type { Database } from '@/types/supabase'; // Standard Supabase types

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryItemProps {
  item: TtsPredictionRow; 
  onReplay: (item: TtsPredictionRow) => void;
  onReloadInput: (item: TtsPredictionRow) => void;
  onViewInDam: (item: TtsPredictionRow) => void; 
  onDelete: (item: TtsPredictionRow) => void;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
}

export function TtsHistoryItem({ 
  item, 
  onReplay, 
  onReloadInput, 
  onViewInDam, 
  onDelete,
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
}: TtsHistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false); // Example local state for delete operation

  const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
  const inputTextSnippet = item.inputText ? item.inputText.substring(0, 50) + (item.inputText.length > 50 ? '...' : '') : 'No input text';
  const voiceIdDisplay = item.voiceId || 'N/A';
  const statusDisplay = item.status || 'unknown';

  const handleDeleteClick = async () => {
    // ... existing code ...
    return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const isThisItemTargetedByHeadlessPlayer = headlessPlayerCurrentlyPlayingUrl === item.outputUrl;
  const isThisItemLoading = isThisItemTargetedByHeadlessPlayer && isHeadlessPlayerLoading;
  const isThisItemPlaying = isThisItemTargetedByHeadlessPlayer && isHeadlessPlayerPlaying;
  const isThisItemPaused = isThisItemTargetedByHeadlessPlayer && !isHeadlessPlayerPlaying && !isHeadlessPlayerLoading && !headlessPlayerError;
  const isThisItemInError = isThisItemTargetedByHeadlessPlayer && headlessPlayerError && !isHeadlessPlayerLoading && !isHeadlessPlayerPlaying;

  // Determine Replay button icon and action
  let replayButtonIcon;
  let replayButtonText;
  let replayButtonTooltip;
  let replayButtonDisabled = !item.outputUrl || isDeleting;

  if (isThisItemInError) {
    replayButtonIcon = <AlertTriangleIcon className="h-4 w-4 mr-2 text-destructive" />;
    replayButtonText = "Error";
    replayButtonTooltip = headlessPlayerError || "Playback failed";
    // Keep button clickable to retry, onReplay should clear the error in the hook implicitly by starting new play attempt
  } else if (isThisItemLoading) {
    replayButtonIcon = <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />;
    replayButtonText = "Loading...";
    replayButtonTooltip = "Audio is loading";
  } else if (isThisItemPlaying) {
    replayButtonIcon = <PauseIcon className="h-4 w-4 mr-2" />;
    replayButtonText = "Pause";
    replayButtonTooltip = "Pause Replay";
  } else if (isThisItemPaused) {
    replayButtonIcon = <PlayIcon className="h-4 w-4 mr-2" />;
    replayButtonText = "Resume";
    replayButtonTooltip = "Resume Replay";
  } else {
    replayButtonIcon = <PlayIcon className="h-4 w-4 mr-2" />;
    replayButtonText = "Replay";
    replayButtonTooltip = "Replay Audio";
  }

  return (
    <div className="p-3 mb-2 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          statusDisplay === 'succeeded' ? 'bg-green-100 text-green-700' :
          statusDisplay === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {statusDisplay}
        </span>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      <p className="text-sm text-gray-800 mb-1 truncate" title={item.inputText || ''}>
        {inputTextSnippet}
      </p>
      <p className="text-xs text-gray-600 mb-3">Voice: {voiceIdDisplay}</p>
      
      <div className="flex space-x-2 flex-wrap gap-y-2">
        <Tooltip>
          <TooltipTrigger asChild> 
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onReplay(item)} 
              disabled={replayButtonDisabled}
              className="min-w-[7rem] justify-center"
            >
              {replayButtonIcon}
              {replayButtonText}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{replayButtonTooltip}</p></TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" onClick={() => onReloadInput(item)} title="Reload Input">
          <RefreshCcw className="w-4 h-4 mr-1" /> Reload
        </Button>
        {item.outputAssetId && (
            <Button variant="outline" size="sm" onClick={() => onViewInDam(item)} title="View in DAM">
                <DatabaseIcon className="w-4 h-4 mr-1" /> DAM
            </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(item)} 
          title="Delete"
          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
      {statusDisplay === 'failed' && item.errorMessage && (
        <p className="mt-2 text-xs text-red-600">Error: {item.errorMessage}</p>
      )}
    </div>
  );
} 