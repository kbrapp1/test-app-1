import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayIcon, PauseIcon, Loader2Icon, RefreshCcwIcon, Save, CopyPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryItemActionsProps {
  item: TtsPredictionRow;
  onPlayPause: () => void;
  onReloadInput: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
  isSavingToDam: boolean;
  isSavingAsToDam: boolean;
  isCurrentItemLoading: boolean;
  isCurrentItemPlaying: boolean;
  isLinkEffectivelyUnusable: boolean;
  isEffectivelySaved: boolean;
  playButtonTooltip: string;
  reloadInputTooltip: string;
  saveButtonTooltip: string;
  saveAsButtonTooltip: string;
}

export function TtsHistoryItemActions({
  item,
  onPlayPause,
  onReloadInput,
  onSave,
  onSaveAs,
  onDelete,
  isSavingToDam,
  isSavingAsToDam,
  isCurrentItemLoading,
  isCurrentItemPlaying,
  isLinkEffectivelyUnusable,
  isEffectivelySaved,
  playButtonTooltip,
  reloadInputTooltip,
  saveButtonTooltip,
  saveAsButtonTooltip,
}: TtsHistoryItemActionsProps) {
  return (
    <div className="flex space-x-2 flex-wrap gap-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="tts-history-item-play"
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              disabled={!item.outputUrl || isCurrentItemLoading || (isLinkEffectivelyUnusable && !!item.outputUrl)}
              aria-label={playButtonTooltip}
            >
              {isCurrentItemLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : (isCurrentItemPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />)}
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
              onClick={onReloadInput}
              aria-label={reloadInputTooltip}
            >
              <RefreshCcwIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{reloadInputTooltip}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={isEffectivelySaved || !item.outputUrl || isSavingToDam || (isLinkEffectivelyUnusable && !!item.outputUrl) ? 0 : undefined}>
              <Button
                data-testid="tts-history-item-save"
                variant={isEffectivelySaved ? "default" : "outline"}
                size="icon"
                onClick={onSave}
                disabled={!item.outputUrl || isSavingToDam || isEffectivelySaved || (isLinkEffectivelyUnusable && !!item.outputUrl)}
                className={cn(isEffectivelySaved && "cursor-default")}
                aria-label={saveButtonTooltip}
              >
                {(isSavingToDam && !item.outputAssetId) ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent><p>{saveButtonTooltip}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={!item.outputUrl || isSavingAsToDam || (isLinkEffectivelyUnusable && !!item.outputUrl) ? 0 : undefined}>
              <Button
                data-testid="tts-history-item-save-as"
                variant="outline"
                size="icon"
                onClick={onSaveAs}
                disabled={!item.outputUrl || isSavingAsToDam || (isLinkEffectivelyUnusable && !!item.outputUrl)}
                aria-label={saveAsButtonTooltip}
              >
                {isSavingAsToDam ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent><p>{saveAsButtonTooltip}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="tts-history-item-delete"
              variant="ghost"
              size="icon"
              onClick={onDelete}
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
  );
} 