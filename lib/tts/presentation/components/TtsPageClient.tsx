'use client';
import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { TtsHistoryPanel, TtsInterface, type TtsFormInitializationData, SaveAsDialog, useHeadlessAudioPlayer, useTtsSaveAsDialog, saveTtsAudioToDam } from '@/lib/tts';
import { TtsHistoryItem } from '@/lib/tts/presentation/types/TtsPresentation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/lib/organization/application/hooks/useOrganizationContext';
import { TtsErrorBoundary } from './TtsErrorBoundary';

/**
 * TTS Page Client Component
 * 
 * AI INSTRUCTIONS:
 * - Uses organization context hook for automatic organization scoping
 * - SECURITY: All operations automatically scoped to active organization via server actions
 * - Server actions handle all validation with security-aware caching
 * - Handles TTS interface and history management within organization boundaries
 * - Follows DDD optimization patterns with error boundaries
 * - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS (React rules)
 */

interface TtsPageClientProps {
  // No props needed - server actions handle all validation and organization context
}

export function TtsPageClient({}: TtsPageClientProps = {}) {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // SECURITY: Get active organization context for all operations
  const { activeOrganizationId, isLoading: isLoadingOrganization } = useOrganizationContext();
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<TtsFormInitializationData | undefined>(undefined);
  const [shouldRefreshHistory, setShouldRefreshHistory] = useState<boolean>(false);

  const {
    playAudio: headlessPlayAudio,
    pauseAudio: headlessPauseAudio,
    resumeAudio: headlessResumeAudio,
    stopAudio: headlessStopAudio,
    isPlaying: isHeadlessPlayerPlaying,
    currentlyPlayingUrl: headlessPlayerUrl,
    isLoading: isHeadlessPlayerLoading,
    error: headlessPlayerError,
  } = useHeadlessAudioPlayer();

  const {
    isSaveAsDialogOpen,
    openSaveAsDialog,
    submitSaveAsDialog,
    defaultSaveAsName,
    setIsSaveAsDialogOpen,
  } = useTtsSaveAsDialog({
    onSaveComplete: () => setShouldRefreshHistory(true)
    // NOTE: useTtsSaveAsDialog should use useOrganizationContext() internally
  });

  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);

  const handleTtsGenerationComplete = useCallback(() => {
    setShouldRefreshHistory(true);
  }, []);

  const handleReloadInputFromItem = useCallback((item: TtsHistoryItem) => {
    if (item.inputText && item.voiceDisplayName) {
      setFormInitialValues({
        inputText: item.inputText,
        voiceId: item.voiceDisplayName, // Note: This might need adjustment based on how voiceId mapping works
        provider: item.providerDisplayName?.toLowerCase() || undefined,
        key: Date.now(),
        outputUrl: item.outputUrl,
        dbId: item.id,
      });
      setIsHistoryOpen(false);
    } else {
      console.warn('History item is missing inputText or voiceDisplayName', item);
    }
  }, []);

  const handleReplayItem = useCallback((item: TtsHistoryItem) => {
    if (!item.outputUrl) {
      console.warn('History item is missing outputUrl for replay', item);
      if (headlessPlayerUrl === item.outputUrl) {
        headlessStopAudio();
      }
      return;
    }
    if (headlessPlayerUrl === item.outputUrl) {
      if (isHeadlessPlayerPlaying) {
        headlessPauseAudio();
      } else {
        headlessResumeAudio();
      }
    } else {
      headlessPlayAudio(item.outputUrl);
    }
  }, [headlessPlayAudio, headlessPauseAudio, headlessResumeAudio, headlessStopAudio, isHeadlessPlayerPlaying, headlessPlayerUrl]);

  const handleSaveToDam = async (item: TtsHistoryItem): Promise<boolean> => {
    const predictionId = item.id;
    const audioUrl = item.outputUrl;
    if (!audioUrl) {
      toast.error('No audio output URL found for this item.');
      return false;
    }
    const assetName = item.inputText
      ? `${item.inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio`
      : `tts_audio_${new Date().toISOString()}`;

    const toastId = toast.loading("Saving to DAM...");
    try {
      // NOTE: saveTtsAudioToDam should use useOrganizationContext() internally for organization scoping
      const result = await saveTtsAudioToDam(audioUrl, assetName, predictionId, true);
      
      if (result.success && result.assetId) {
        toast.success(`Saved to DAM with ID: ${result.assetId}`, { id: toastId });
        setShouldRefreshHistory(true);
        return true;
      } else {
        toast.error(`Failed to save to DAM: ${result.error || 'Unknown error'}`, { id: toastId });
        return false;
      }
    } catch (error: any) {
      toast.error(`Error saving to DAM: ${error.message || 'Unknown error'}`, { id: toastId });
      return false;
    }
  };

  const handleSaveAsToDam = useCallback(async (item: TtsHistoryItem): Promise<boolean> => {
    openSaveAsDialog(item);
    return !!item.outputUrl;
  }, [openSaveAsDialog]);

  // SECURITY: Wait for organization context to load before rendering
  if (isLoadingOrganization) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    );
  }

  // SECURITY: Server actions handle all validation with organization context
  // No client-side validation needed since TTS operations are secured at server level

  return (
    <TtsErrorBoundary 
      fallbackTitle="TTS Service Error"
      onRetry={() => window.location.reload()}
    >
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">AI Playground: Text to Speech</h1>
          <Button variant="outline" size="icon" onClick={toggleHistoryPanel} className="ml-auto">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
        
        {/* TTS Interface wrapped with error boundary */}
        <TtsErrorBoundary fallbackTitle="TTS Interface Error">
          <TtsInterface
            key={formInitialValues?.key ?? 'default'}
            remountKey={formInitialValues?.key ?? 'default'}
            formInitialValues={formInitialValues}
            onGenerationComplete={handleTtsGenerationComplete}
          />
        </TtsErrorBoundary>

        {isHistoryOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={toggleHistoryPanel}
            aria-hidden="true"
          />
        )}

        {/* TTS History Panel wrapped with error boundary */}
        <TtsErrorBoundary fallbackTitle="TTS History Error">
          <TtsHistoryPanel
            isOpen={isHistoryOpen}
            onClose={toggleHistoryPanel}
            onReloadInputFromItem={handleReloadInputFromItem}
            onReplayItem={handleReplayItem}
            onViewInDamItem={() => {}}
            onDeleteItem={() => {}}
            onSaveToDam={handleSaveToDam}
            onSaveAsToDam={handleSaveAsToDam}
            headlessPlayerCurrentlyPlayingUrl={headlessPlayerUrl}
            isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
            isHeadlessPlayerLoading={isHeadlessPlayerLoading}
            headlessPlayerError={headlessPlayerError}
            shouldRefresh={shouldRefreshHistory}
            onRefreshComplete={() => setShouldRefreshHistory(false)}
          />
        </TtsErrorBoundary>

        {/* Save As Dialog wrapped with error boundary */}
        <TtsErrorBoundary fallbackTitle="Save Dialog Error">
          <SaveAsDialog
            isOpen={isSaveAsDialogOpen}
            onOpenChange={setIsSaveAsDialogOpen}
            onSubmit={submitSaveAsDialog}
            defaultAssetName={defaultSaveAsName}
          />
        </TtsErrorBoundary>
      </div>
    </TtsErrorBoundary>
  );
} 