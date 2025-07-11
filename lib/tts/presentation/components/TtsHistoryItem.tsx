'use client';

import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button'; // No longer directly used
// import { Play, RefreshCcw, Trash2, Database as DatabaseIcon, Save, CopyPlus, ExternalLink } from 'lucide-react'; // Moved to subcomponents
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Moved to subcomponents
// import { PlayIcon, PauseIcon, ExternalLinkIcon, AlertTriangleIcon, CheckCircle2Icon, CircleSlashIcon, Loader2Icon, RefreshCcw as RefreshCcwIcon } from 'lucide-react'; // Moved to subcomponents
import { TtsHistoryItem as TtsHistoryItemType, TtsAudioPlayerState } from '../types/TtsPresentation';
import { TtsHistoryItemActions } from './TtsHistoryItemActions';
import { TtsHistoryItemInfo } from './TtsHistoryItemInfo';
import { TtsHistoryItemErrorDisplay } from './TtsHistoryItemErrorDisplay';
import { useTtsHistoryItemState } from '../hooks/useTtsHistoryItemState';

export interface TtsHistoryItemProps extends TtsAudioPlayerState {
  item: TtsHistoryItemType; 
  onReplay: (item: TtsHistoryItemType) => void;
  onReloadInput: (item: TtsHistoryItemType) => void;
  onViewInDam: (item: TtsHistoryItemType) => void;
  onDelete: (item: TtsHistoryItemType) => void;
  onSaveToDam: (item: TtsHistoryItemType) => Promise<boolean>;
  onSaveAsToDam: (item: TtsHistoryItemType) => Promise<boolean>;
  isLikelyExpired?: boolean;
  hasActualPlaybackError?: boolean;
  actualPlaybackErrorMessage?: string | null;
  isProblematicFromDb?: boolean;
  dbProblematicMessage?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
}

export function TtsHistoryItem({ 
  item, 
  onReplay, 
  onReloadInput, 
  onViewInDam, // TODO: Implement View in DAM functionality
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
  // Temporarily reference onViewInDam to avoid unused variable warning
  // TODO: Remove when View in DAM functionality is implemented
  void onViewInDam; // Suppress unused variable warning
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