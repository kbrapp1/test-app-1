import { TtsPredictionDisplayDto } from '../../application/dto/TtsPredictionDto';

/**
 * Presentation layer types for TTS module following DDD principles.
 * These types define UI-specific data contracts and should not expose domain complexity.
 */

/**
 * Type alias for TTS items used in the presentation layer.
 * This provides a clear boundary between application DTOs and presentation concerns.
 */
export type TtsHistoryItem = TtsPredictionDisplayDto;

/**
 * Callback types for TTS history item actions.
 * These define the contracts for user interactions in the presentation layer.
 */
export type TtsHistoryItemActionCallback = (item: TtsHistoryItem) => void;
export type TtsHistoryItemAsyncActionCallback = (item: TtsHistoryItem) => Promise<boolean>;

/**
 * Props for TTS history related components.
 * Following DDD principle of keeping presentation layer concerns separate.
 */
export interface TtsHistoryActionCallbacks {
  onReplayItem: TtsHistoryItemActionCallback;
  onReloadInputFromItem: TtsHistoryItemActionCallback;
  onDeleteItem: TtsHistoryItemActionCallback;
  onViewInDamItem: TtsHistoryItemActionCallback;
  onSaveToDam: TtsHistoryItemAsyncActionCallback;
  onSaveAsToDam: TtsHistoryItemAsyncActionCallback;
}

/**
 * Audio player state for TTS history items.
 * Encapsulates audio playback concerns at the presentation layer.
 */
export interface TtsAudioPlayerState {
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
} 