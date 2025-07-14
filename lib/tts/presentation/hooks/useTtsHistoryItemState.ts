import { useMemo } from 'react';
import { TtsHistoryItem } from '../types/TtsPresentation';

interface UseTtsHistoryItemStateProps {
  item: TtsHistoryItem;
  isLikelyExpired?: boolean;
  hasActualPlaybackError?: boolean;
  actualPlaybackErrorMessage?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
  isProblematicFromDb?: boolean;
  dbProblematicMessage?: string | null;
  isSavingToDam: boolean;
  isSavingAsToDam: boolean;
  linkDownloadFailed: boolean;
}

export function useTtsHistoryItemState({
  item,
  isLikelyExpired,
  hasActualPlaybackError,
  actualPlaybackErrorMessage,
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError: _headlessPlayerError,
  isProblematicFromDb,
  dbProblematicMessage,
  isSavingToDam,
  isSavingAsToDam,
  linkDownloadFailed,
}: UseTtsHistoryItemStateProps) {

  const formattedDate = useMemo(() => new Date(item.createdAt).toLocaleDateString(), [item]);
  const inputTextSnippet = useMemo(() => item.inputTextSnippet, [item]);
  const voiceIdDisplay = useMemo(() => item.voiceDisplayName, [item]);
  const statusDisplay = useMemo(() => item.status, [item]);
  const audioUrl = useMemo(() => item.outputUrl, [item.outputUrl]);

  const isCurrentItemPlaying = useMemo(() => !!(headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerPlaying), [headlessPlayerCurrentlyPlayingUrl, audioUrl, isHeadlessPlayerPlaying]);
  const isCurrentItemLoading = useMemo(() => !!(headlessPlayerCurrentlyPlayingUrl === audioUrl && isHeadlessPlayerLoading), [headlessPlayerCurrentlyPlayingUrl, audioUrl, isHeadlessPlayerLoading]);

  const isLinkEffectivelyUnusable = useMemo(() => !!(
    !audioUrl ||
    isProblematicFromDb ||
    isLikelyExpired ||
    hasActualPlaybackError ||
    linkDownloadFailed
  ), [audioUrl, isProblematicFromDb, isLikelyExpired, hasActualPlaybackError, linkDownloadFailed]);

  const unusableLinkMessage = useMemo(() => {
    if (!audioUrl) return "Output not available.";
    if (isProblematicFromDb) return dbProblematicMessage || "Audio link flagged as problematic.";
    if (isLikelyExpired) return "Audio link likely expired.";
    if (hasActualPlaybackError && actualPlaybackErrorMessage) return actualPlaybackErrorMessage;
    if (linkDownloadFailed) return "Audio link is invalid or inaccessible for download/save.";
    return "Audio link is invalid or inaccessible."; // Default fallback
  }, [audioUrl, isProblematicFromDb, dbProblematicMessage, isLikelyExpired, hasActualPlaybackError, actualPlaybackErrorMessage, linkDownloadFailed]);

  const playButtonTooltip = useMemo(() => {
    if (!audioUrl) return "Output not available.";
    if (isCurrentItemLoading) return "Loading...";
    if (isCurrentItemPlaying) return "Pause";
    if (isLinkEffectivelyUnusable) return unusableLinkMessage;
    return "Play";
  }, [audioUrl, isCurrentItemLoading, isCurrentItemPlaying, isLinkEffectivelyUnusable, unusableLinkMessage]);

  const reloadInputTooltip = useMemo(() => {
    if (isLinkEffectivelyUnusable && !audioUrl) return "Output not available."; 
    if (isLinkEffectivelyUnusable) return unusableLinkMessage;
    return "Reload Input";
  }, [isLinkEffectivelyUnusable, audioUrl, unusableLinkMessage]);

  const saveButtonTooltip = useMemo(() => {
    if (!item.outputUrl) return "Output not available.";
    if (isSavingToDam && !item.outputAssetId) return "Saving...";
    if (item.outputAssetId) return "Item is saved to DAM. Use 'Save As' to create a new copy.";
    if (isLinkEffectivelyUnusable) return unusableLinkMessage;
    return "Save to DAM";
  }, [item.outputUrl, item.outputAssetId, isSavingToDam, isLinkEffectivelyUnusable, unusableLinkMessage]);

  const saveAsButtonTooltip = useMemo(() => {
    if (!item.outputUrl) return "Output not available.";
    if (isSavingAsToDam) return "Saving as new...";
    if (isLinkEffectivelyUnusable) return unusableLinkMessage;
    return "Save as a new asset in DAM";
  }, [item.outputUrl, isSavingAsToDam, isLinkEffectivelyUnusable, unusableLinkMessage]);
  
  const isEffectivelySaved = useMemo(() => !!item.outputAssetId && !isSavingToDam, [item.outputAssetId, isSavingToDam]);

  return {
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
  };
} 