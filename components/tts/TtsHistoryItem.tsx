'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RefreshCcw, Trash2, Database as DatabaseIcon, Save, CopyPlus, ExternalLink } from 'lucide-react'; // Added Save and CopyPlus icons
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayIcon, PauseIcon, ExternalLinkIcon, AlertTriangleIcon, CheckCircle2Icon, CircleSlashIcon, Loader2Icon, RefreshCcw as RefreshCcwIcon } from 'lucide-react';
// import type { TtsPrediction } from '@/types/supabase-custom'; // Assuming a TtsPrediction type
import type { Database } from '@/types/supabase'; // Standard Supabase types
import { cn } from '@/lib/utils';
import { WaveformAudioPlayer } from '@/components/ui/waveform-audio-player';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryItemProps {
  item: TtsPredictionRow; 
  onReplay: (item: TtsPredictionRow) => void;
  onReloadInput: (item: TtsPredictionRow) => void;
  onViewInDam: (item: TtsPredictionRow) => void; 
  onDelete: (item: TtsPredictionRow) => void;
  onSaveToDam: (item: TtsPredictionRow) => Promise<boolean>; // Modified to return Promise<boolean>
  onSaveAsToDam: (item: TtsPredictionRow) => Promise<boolean>; // New prop for Save As
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
  onSaveToDam,
  onSaveAsToDam, // New prop
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
}: TtsHistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false); // Example local state for delete operation
  const [isSavingToDam, setIsSavingToDam] = useState(false); // Local loading state for DAM save
  const [isSavingAsToDam, setIsSavingAsToDam] = useState(false); // New state for Save As
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
  const inputTextSnippet = item.inputText ? item.inputText.substring(0, 50) + (item.inputText.length > 50 ? '...' : '') : 'No input text';
  const voiceIdDisplay = item.voiceId || 'N/A';
  const statusDisplay = item.status || 'unknown';

  const audioUrl = item.outputUrl;
  const isCurrentItemPlaying = headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerPlaying;
  const isCurrentItemLoading = headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerLoading;

  const handleDeleteClick = async () => {
    // ... existing code ...
    return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const handlePlayPause = () => {
    if (audioUrl) {
      onReplay(item);
      setShowPlayer(true);
      setPlayerError(null); 
    }
  };

  const handleReloadInput = () => {
    onReloadInput(item);
  };

  const handleDelete = () => {
    onDelete(item);
  };

  const handleSave = async () => {
    if (!item.outputUrl || item.outputAssetId || isSavingToDam) return;
    setIsSavingToDam(true);
    const success = await onSaveToDam(item);
    if (!success) { // Only reset if save failed; rely on prop update for success
      setIsSavingToDam(false);
    }
    // If successful, isSavingToDam remains true until item.outputAssetId is updated via props,
    // which will then disable the button based on item.outputAssetId
  };

  const handleSaveAs = async () => {
    if (!item.outputUrl || isSavingAsToDam) return;
    setIsSavingAsToDam(true);
    const success = await onSaveAsToDam(item);
    // Reset state regardless of success for "Save As" as it doesn't change item.outputAssetId
    setIsSavingAsToDam(false); 
  };

  const saveButtonTooltip = !item.outputUrl
    ? "Output not available."
    : isSavingToDam && !item.outputAssetId
    ? "Saving..."
    : item.outputAssetId
    ? "Item is saved to DAM. Use 'Save As' to create a new copy."
    : "Save to DAM";

  const saveAsButtonTooltip = !item.outputUrl
    ? "Output not available."
    : isSavingAsToDam
    ? "Saving as new..."
    : "Save as a new asset in DAM";

  const isEffectivelySaved = !!item.outputAssetId && !isSavingToDam;

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild> 
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePlayPause} 
                disabled={!audioUrl || isCurrentItemLoading}
              >
                {isCurrentItemLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : (isCurrentItemPlaying ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />)}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isCurrentItemLoading ? "Loading..." : isCurrentItemPlaying ? "Pause" : "Play"}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleReloadInput}
              >
                <RefreshCcwIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Reload Input</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={isEffectivelySaved || !item.outputUrl || isSavingToDam ? 0 : undefined}>
                <Button
                  variant={isEffectivelySaved ? "default" : "outline"} 
                  size="icon" 
                  onClick={handleSave}
                  disabled={!item.outputUrl || isSavingToDam || isEffectivelySaved}
                  className={cn(isEffectivelySaved && "cursor-default")}
                >
                  {(isSavingToDam && !item.outputAssetId) ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{saveButtonTooltip}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!item.outputUrl || isSavingAsToDam ? 0 : undefined}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSaveAs}
                  disabled={!item.outputUrl || isSavingAsToDam}
                >
                  {isSavingAsToDam ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{saveAsButtonTooltip}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Delete</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {statusDisplay === 'failed' && item.errorMessage && (
        <p className="mt-2 text-xs text-red-600">Error: {item.errorMessage}</p>
      )}
    </div>
  );
} 