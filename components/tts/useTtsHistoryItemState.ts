import { useMemo } from 'react';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

interface UseTtsHistoryItemStateProps {
  item: TtsPredictionRow;
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
  headlessPlayerError,
  isProblematicFromDb,
  dbProblematicMessage,
  isSavingToDam,
  isSavingAsToDam,
  linkDownloadFailed,
}: UseTtsHistoryItemStateProps) {

  const formattedDate = useMemo(() => item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A', [item.createdAt]);
  const inputTextSnippet = useMemo(() => item.inputText ? item.inputText.substring(0, 50) + (item.inputText.length > 50 ? '...' : '') : 'No input text', [item.inputText]);
  const voiceIdDisplay = useMemo(() => item.voiceId || 'N/A', [item.voiceId]);
  const statusDisplay = useMemo(() => item.status || 'unknown', [item.status]);
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