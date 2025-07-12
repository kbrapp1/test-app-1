'use client';

import React, { useState, useEffect } from 'react';
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
  void onViewInDam;
  
  const [isSavingToDam, setIsSavingToDam] = useState(false);
  const [isSavingAsToDam, setIsSavingAsToDam] = useState(false);
  const [linkDownloadFailed, setLinkDownloadFailed] = useState(false);

  useEffect(() => {
    setLinkDownloadFailed(false);
  }, [item.id, item.outputUrl]);

  const {
    formattedDate,
    inputTextSnippet,
    voiceIdDisplay,
    statusDisplay,
    audioUrl,
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
    isSavingToDam,
    isSavingAsToDam,
    linkDownloadFailed,
  });

  const handlePlayPause = () => {
    if (audioUrl && !hasActualPlaybackError) {
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
    <div className="border rounded-lg p-4 bg-card">
      <TtsHistoryItemInfo 
        item={item}
        formattedDate={formattedDate}
        inputTextSnippet={inputTextSnippet}
        voiceIdDisplay={voiceIdDisplay}
        statusDisplay={statusDisplay}
      />
      
      <TtsHistoryItemErrorDisplay 
        statusDisplay={statusDisplay}
        errorMessage={item.errorMessage}
        isLinkEffectivelyUnusable={isLinkEffectivelyUnusable}
        unusableLinkMessage={unusableLinkMessage}
      />
      
      <TtsHistoryItemActions
        item={item}
        isCurrentItemPlaying={isCurrentItemPlaying}
        isCurrentItemLoading={isCurrentItemLoading}
        isLinkEffectivelyUnusable={isLinkEffectivelyUnusable}
        playButtonTooltip={playButtonTooltip}
        reloadInputTooltip={reloadInputTooltip}
        saveButtonTooltip={saveButtonTooltip}
        saveAsButtonTooltip={saveAsButtonTooltip}
        isEffectivelySaved={isEffectivelySaved}
        isSavingToDam={isSavingToDam}
        isSavingAsToDam={isSavingAsToDam}
        onPlayPause={handlePlayPause}
        onReloadInput={handleReloadInput}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onDelete={handleDelete}
      />
    </div>
  );
} 