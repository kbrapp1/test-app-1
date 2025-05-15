'use client';

import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button'; // No longer directly used
// import { Play, RefreshCcw, Trash2, Database as DatabaseIcon, Save, CopyPlus, ExternalLink } from 'lucide-react'; // Moved to subcomponents
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Moved to subcomponents
// import { PlayIcon, PauseIcon, ExternalLinkIcon, AlertTriangleIcon, CheckCircle2Icon, CircleSlashIcon, Loader2Icon, RefreshCcw as RefreshCcwIcon } from 'lucide-react'; // Moved to subcomponents
import type { Database } from '@/types/supabase';
// import { cn } from '@/lib/utils'; // No longer directly used
// import { WaveformAudioPlayer } from '@/components/ui/waveform-audio-player'; // WaveformAudioPlayer seems unused directly here now
import { TtsHistoryItemActions } from './TtsHistoryItemActions';
import { TtsHistoryItemInfo } from './TtsHistoryItemInfo';
import { TtsHistoryItemErrorDisplay } from './TtsHistoryItemErrorDisplay';
import { useTtsHistoryItemState } from './useTtsHistoryItemState'; // Import the new hook

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryItemProps {
  item: TtsPredictionRow; 
  onReplay: (item: TtsPredictionRow) => void;
  onReloadInput: (item: TtsPredictionRow) => void;
  onViewInDam: (item: TtsPredictionRow) => void;
  onDelete: (item: TtsPredictionRow) => void;
  onSaveToDam: (item: TtsPredictionRow) => Promise<boolean>;
  onSaveAsToDam: (item: TtsPredictionRow) => Promise<boolean>;
  isLikelyExpired?: boolean;
  hasActualPlaybackError?: boolean;
  actualPlaybackErrorMessage?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
  isProblematicFromDb?: boolean;
  dbProblematicMessage?: string | null;
}

export function TtsHistoryItem({ 
  item, 
  onReplay, 
  onReloadInput, 
  onViewInDam,
  onDelete,
  onSaveToDam,
  onSaveAsToDam, 
  isLikelyExpired, 
  hasActualPlaybackError, 
  actualPlaybackErrorMessage, 
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
  isProblematicFromDb,      
  dbProblematicMessage      
}: TtsHistoryItemProps) {
  // const [isDeleting, setIsDeleting] = useState(false); // isDeleting seems unused
  const [isSavingToDam, setIsSavingToDam] = useState(false);
  const [isSavingAsToDam, setIsSavingAsToDam] = useState(false);
  // const [showPlayer, setShowPlayer] = useState(false); // showPlayer seems unused
  // const [playerError, setPlayerError] = useState<string | null>(null); // playerError seems unused
  const [linkDownloadFailed, setLinkDownloadFailed] = useState(false);

  useEffect(() => {
    setLinkDownloadFailed(false);
  }, [item.id, item.outputUrl]);

  const {
    formattedDate,
    inputTextSnippet,
    voiceIdDisplay,
    statusDisplay,
    audioUrl, // Used in handlePlayPause
    isCurrentItemPlaying,
    isCurrentItemLoading,
    isLinkEffectivelyUnusable,
    unusableLinkMessage,
    playButtonTooltip,
    reloadInputTooltip,
    saveButtonTooltip,
    saveAsButtonTooltip,
    isEffectivelySaved,
  } = useTtsHistoryItemState({
    item,
    isLikelyExpired,
    hasActualPlaybackError,
    actualPlaybackErrorMessage,
    headlessPlayerCurrentlyPlayingUrl,
    isHeadlessPlayerPlaying,
    isHeadlessPlayerLoading,
    headlessPlayerError,
    isProblematicFromDb,
    dbProblematicMessage,
    isSavingToDam, // Pass local state to hook
    isSavingAsToDam, // Pass local state to hook
    linkDownloadFailed, // Pass local state to hook
  });

  const handlePlayPause = () => {
    if (audioUrl && !hasActualPlaybackError) { // audioUrl comes from the hook now
      onReplay(item); 
    }
  };

  const handleReloadInput = () => {
    onReloadInput(item);
  };

  const handleDelete = () => {
    onDelete(item);
  };

  const handleSave = async () => {
    if (!item.outputUrl || item.outputAssetId || isSavingToDam || isLikelyExpired || hasActualPlaybackError || linkDownloadFailed) return;
    setIsSavingToDam(true);
    setLinkDownloadFailed(false);
    const success = await onSaveToDam(item);
    if (!success) {
      setIsSavingToDam(false);
      setLinkDownloadFailed(true);
    }
  };

  const handleSaveAs = async () => {
    if (!item.outputUrl || isSavingAsToDam || isLikelyExpired || hasActualPlaybackError || linkDownloadFailed) return;
    setIsSavingAsToDam(true);
    setLinkDownloadFailed(false);
    const success = await onSaveAsToDam(item);
    setIsSavingAsToDam(false); 
    if (!success) {
      setLinkDownloadFailed(true);
    }
  };

  return (
    <div className="p-3 mb-2 border rounded-lg hover:shadow-md transition-shadow">
      <TtsHistoryItemInfo 
        item={item}
        statusDisplay={statusDisplay}
        formattedDate={formattedDate}
        inputTextSnippet={inputTextSnippet}
        voiceIdDisplay={voiceIdDisplay}
      />
      
      <TtsHistoryItemActions
        item={item}
        onPlayPause={handlePlayPause}
        onReloadInput={handleReloadInput}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onDelete={handleDelete}
        isSavingToDam={isSavingToDam}
        isSavingAsToDam={isSavingAsToDam}
        isCurrentItemLoading={isCurrentItemLoading}
        isCurrentItemPlaying={isCurrentItemPlaying}
        isLinkEffectivelyUnusable={isLinkEffectivelyUnusable}
        isEffectivelySaved={isEffectivelySaved}
        playButtonTooltip={playButtonTooltip}
        reloadInputTooltip={reloadInputTooltip}
        saveButtonTooltip={saveButtonTooltip}
        saveAsButtonTooltip={saveAsButtonTooltip}
      />

      <TtsHistoryItemErrorDisplay 
        statusDisplay={statusDisplay}
        errorMessage={item.errorMessage}
        isLinkEffectivelyUnusable={isLinkEffectivelyUnusable}
        unusableLinkMessage={unusableLinkMessage}
      />
    </div>
  );
} 