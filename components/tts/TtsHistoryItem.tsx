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
  isLikelyExpired?: boolean; // New prop
  hasActualPlaybackError?: boolean; // New prop
  actualPlaybackErrorMessage?: string | null; // New prop
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
  isProblematicFromDb?: boolean; // New prop for DB flag
  dbProblematicMessage?: string | null; // New prop for DB error message
}

export function TtsHistoryItem({ 
  item, 
  onReplay, 
  onReloadInput, 
  onViewInDam, 
  onDelete,
  onSaveToDam,
  onSaveAsToDam, // New prop
  isLikelyExpired, // Destructure new prop
  hasActualPlaybackError, // New prop, specific to this item
  actualPlaybackErrorMessage, // New prop
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
  isProblematicFromDb,      // Destructure new prop
  dbProblematicMessage      // Destructure new prop
}: TtsHistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false); // Example local state for delete operation
  const [isSavingToDam, setIsSavingToDam] = useState(false); // Local loading state for DAM save
  const [isSavingAsToDam, setIsSavingAsToDam] = useState(false); // New state for Save As
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [linkDownloadFailed, setLinkDownloadFailed] = useState(false); // New state specific to download issues

  // Reset linkDownloadFailed if item changes
  useEffect(() => {
    setLinkDownloadFailed(false);
  }, [item.id, item.outputUrl]);

  const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
  const inputTextSnippet = item.inputText ? item.inputText.substring(0, 50) + (item.inputText.length > 50 ? '...' : '') : 'No input text';
  const voiceIdDisplay = item.voiceId || 'N/A';
  const statusDisplay = item.status || 'unknown';

  const audioUrl = item.outputUrl;
  const isCurrentItemPlaying = headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerPlaying;
  const isCurrentItemLoading = headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerLoading;

  const handleDeleteClick = async () => {
    // TODO: Implement actual delete logic if needed, potentially involving a confirmation
    // For now, just calls the onDelete prop passed from parent.
    // setIsDeleting(true);
    // try {
    //   await onDelete(item);
    //   // No need to setIsDeleting(false) if item is removed from list by parent
    // } catch (error) {
    //   console.error("Error deleting item:", error);
    //   setIsDeleting(false);
    // }
    console.log("Delete clicked for item:", item.id);
  };

  const getStatusIndicator = () => {
    if (item.outputAssetId) {
      return <CheckCircle2Icon className="h-5 w-5 text-green-500" />;
    } else if (isLikelyExpired || hasActualPlaybackError) {
      return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
    } else if (statusDisplay === 'processing' || statusDisplay === 'starting') {
      return <Loader2Icon className="h-5 w-5 animate-spin text-blue-500" />;
    }
    // Default or other statuses if needed
    return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
  };

  const handlePlayPause = () => {
    if (audioUrl && !hasActualPlaybackError) { // Check hasActualPlaybackError
      onReplay(item); 
    }
  };

  const handleReloadInput = () => {
    onReloadInput(item);
  };

  const handleDelete = () => {
    // Delete can still proceed even if link is expired
    onDelete(item);
  };

  const handleSave = async () => {
    if (!item.outputUrl || item.outputAssetId || isSavingToDam || isLikelyExpired || hasActualPlaybackError || linkDownloadFailed) return;
    setIsSavingToDam(true);
    setLinkDownloadFailed(false); // Reset before attempt
    const success = await onSaveToDam(item);
    if (!success) {
      setIsSavingToDam(false);
      setLinkDownloadFailed(true); // Set if download during save failed
    }
    // If successful, isSavingToDam state is handled by parent through item.outputAssetId prop change
  };

  const handleSaveAs = async () => {
    if (!item.outputUrl || isSavingAsToDam || isLikelyExpired || hasActualPlaybackError || linkDownloadFailed) return;
    setIsSavingAsToDam(true);
    setLinkDownloadFailed(false); // Reset before attempt
    const success = await onSaveAsToDam(item);
    setIsSavingAsToDam(false); 
    if (!success) {
      setLinkDownloadFailed(true); // Set if download during save as failed
    }
  };

  // Unified logic for unusable link
  const isLinkEffectivelyUnusable = !!(
    !audioUrl || // Added direct check for no audioUrl first
    isProblematicFromDb || 
    isLikelyExpired || 
    hasActualPlaybackError || 
    linkDownloadFailed
  );
  
  let unusableLinkMessage = "Audio link is invalid or inaccessible."; // Default message

  if (!audioUrl) {
    unusableLinkMessage = "Output not available.";
  } else if (isProblematicFromDb) {
    unusableLinkMessage = dbProblematicMessage || "Audio link flagged as problematic.";
  } else if (isLikelyExpired) {
    unusableLinkMessage = "Audio link likely expired.";
  } else if (hasActualPlaybackError && actualPlaybackErrorMessage) {
    unusableLinkMessage = actualPlaybackErrorMessage;
  } else if (linkDownloadFailed) {
    unusableLinkMessage = "Audio link is invalid or inaccessible for download/save.";
  }

  const saveButtonTooltip = !item.outputUrl
    ? "Output not available."
    : isSavingToDam && !item.outputAssetId
    ? "Saving..."
    : item.outputAssetId
    ? "Item is saved to DAM. Use 'Save As' to create a new copy."
    : isLinkEffectivelyUnusable // Check this after specific save states
    ? unusableLinkMessage
    : "Save to DAM";

  const saveAsButtonTooltip = !item.outputUrl
    ? "Output not available."
    : isSavingAsToDam
    ? "Saving as new..."
    : isLinkEffectivelyUnusable // Check this after specific save as states
    ? unusableLinkMessage
    : "Save as a new asset in DAM";

  const playButtonTooltip = !audioUrl
    ? "Output not available."
    : isCurrentItemLoading 
    ? "Loading..." 
    : isCurrentItemPlaying 
    ? "Pause" 
    : isLinkEffectivelyUnusable
    ? unusableLinkMessage
    : "Play";
  
  const reloadInputTooltip = isLinkEffectivelyUnusable && !item.outputUrl 
    ? "Output not available."
    : isLinkEffectivelyUnusable
    ? unusableLinkMessage
    : "Reload Input";

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
                data-testid="tts-history-item-play"
                variant="ghost" 
                size="icon" 
                onClick={handlePlayPause} 
                disabled={!audioUrl || isCurrentItemLoading || (isLinkEffectivelyUnusable && !!audioUrl)}
                aria-label={playButtonTooltip}
              >
                {isCurrentItemLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : (isCurrentItemPlaying ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />)}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{playButtonTooltip}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                data-testid="tts-history-item-reload"
                variant="ghost" 
                size="icon" 
                onClick={handleReloadInput}
                aria-label={reloadInputTooltip}
              >
                <RefreshCcwIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{reloadInputTooltip}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={isEffectivelySaved || !item.outputUrl || isSavingToDam || (isLinkEffectivelyUnusable && !!audioUrl) ? 0 : undefined}>
                <Button
                  data-testid="tts-history-item-save"
                  variant={isEffectivelySaved ? "default" : "outline"} 
                  size="icon" 
                  onClick={handleSave}
                  disabled={!item.outputUrl || isSavingToDam || isEffectivelySaved || (isLinkEffectivelyUnusable && !!audioUrl)}
                  className={cn(isEffectivelySaved && "cursor-default")}
                  aria-label={saveButtonTooltip}
                >
                  {(isSavingToDam && !item.outputAssetId) ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{saveButtonTooltip}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!item.outputUrl || isSavingAsToDam || (isLinkEffectivelyUnusable && !!audioUrl) ? 0 : undefined}>
                <Button
                  data-testid="tts-history-item-save-as"
                  variant="outline"
                  size="icon"
                  onClick={handleSaveAs}
                  disabled={!item.outputUrl || isSavingAsToDam || (isLinkEffectivelyUnusable && !!audioUrl)}
                  aria-label={saveAsButtonTooltip}
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
                data-testid="tts-history-item-delete"
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label="Delete item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Delete</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {statusDisplay === 'failed' && item.errorMessage ? (
        <p className="mt-2 text-xs text-red-600">Error: {item.errorMessage}</p>
      ) : isLinkEffectivelyUnusable ? (
        <p className="mt-2 text-xs text-red-500 flex items-center">
          <AlertTriangleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
          {unusableLinkMessage}
        </p>
      ) : null}
    </div>
  );
} 