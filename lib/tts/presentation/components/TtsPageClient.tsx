'use client';
import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { TtsHistoryPanel, TtsInterface, type TtsFormInitializationData, SaveAsDialog, useHeadlessAudioPlayer, useTtsSaveAsDialog, useTtsOperations } from '@/lib/tts';
import { TtsHistoryItem } from '@/lib/tts/presentation/types/TtsPresentation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTtsUnifiedContext } from '../hooks/useTtsUnifiedContext';
import { TtsErrorBoundary } from './TtsErrorBoundary';

interface TtsPageClientProps {
  // No props needed - server actions handle all validation and organization context
}

export function TtsPageClient({}: TtsPageClientProps = {}) {
  // CRITICAL: ALL HOOKS MUST BE CALLED FIRST - React's Rules of Hooks
  // OPTIMIZATION: Use unified context to reduce API calls from 3 to 1
  const { 
    organizationId: activeOrganizationId, 
    isLoading,
    isTtsEnabled,
    error,
    fromCache 
  } = useTtsUnifiedContext();
  
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

  // UNIFIED OPERATIONS: Use the TTS operations hook for all CRUD operations
  const {
    saveToDam,
    saveAudioToDam,
    isSavingToDam,
    saveError
  } = useTtsOperations({
    organizationId: activeOrganizationId,
    isHistoryOpen,
    headlessPlayerError,
    headlessPlayerCurrentlyPlayingUrl: headlessPlayerUrl,
    shouldRefreshHistory,
    onRefreshComplete: () => setShouldRefreshHistory(false),
  });

  const {
    isSaveAsDialogOpen,
    openSaveAsDialog,
    submitSaveAsDialog,
    defaultSaveAsName,
    setIsSaveAsDialogOpen,
  } = useTtsSaveAsDialog({
    onSaveComplete: () => setShouldRefreshHistory(true)
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
        voiceId: item.voiceDisplayName,
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

  const handleSaveToDam = useCallback(async (item: TtsHistoryItem): Promise<boolean> => {
    if (!item.outputUrl) {
      console.warn('History item is missing outputUrl for save to DAM', item);
      return false;
    }
    
    try {
      const assetName = item.inputText 
        ? `${item.inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio`
        : `tts_audio_${new Date().toISOString()}`;
      
      await saveToDam({
        audioUrl: item.outputUrl,
        assetName,
        predictionId: item.id,
        linkToPrediction: true
      });
      
      setShouldRefreshHistory(true);
      return true;
    } catch (error) {
      console.error('Save to DAM failed:', error);
      return false;
    }
  }, [saveToDam]);

  const handleSaveAsToDam = useCallback(async (item: TtsHistoryItem): Promise<boolean> => {
    openSaveAsDialog(item);
    return !!item.outputUrl;
  }, [openSaveAsDialog]);

  // OPTIMIZATION: Log cache performance in development
  if (fromCache && process.env.NODE_ENV === 'development') {
    console.log('[TTS_OPTIMIZATION] Using cached unified context - no API calls needed');
  }

  // Handle TTS feature access error
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold">TTS Access Error</h2>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle TTS feature disabled (business feature flag)
  if (!isTtsEnabled) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-yellow-600 mb-4">
            <h2 className="text-xl font-semibold">TTS Feature Disabled</h2>
            <p className="text-sm mt-2">Text-to-Speech is not enabled for your organization.</p>
          </div>
        </div>
      </div>
    );
  }

  // SECURITY: Wait for organization context to load before rendering
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-2">Optimized (1 API call)</p>
          )}
        </div>
      </div>
    );
  }

  // SECURITY: Server actions handle all validation with organization context
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

        {/* History Panel */}
        <TtsHistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onReloadInputFromItem={handleReloadInputFromItem}
          onReplayItem={handleReplayItem}
          onDeleteItem={() => {}}
          onViewInDamItem={() => {}}
          onSaveToDam={handleSaveToDam}
          onSaveAsToDam={handleSaveAsToDam}
          headlessPlayerCurrentlyPlayingUrl={headlessPlayerUrl}
          isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
          isHeadlessPlayerLoading={isHeadlessPlayerLoading}
          headlessPlayerError={headlessPlayerError}
          shouldRefresh={shouldRefreshHistory}
          onRefreshComplete={() => setShouldRefreshHistory(false)}
        />

        {/* Save As Dialog */}
        {isSaveAsDialogOpen && (
          <TtsErrorBoundary fallbackTitle="Save As Dialog Error">
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Save Audio to DAM</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="asset-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Name
                    </label>
                    <input
                      id="asset-name"
                      type="text"
                      defaultValue={defaultSaveAsName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter asset name..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsSaveAsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const input = document.getElementById('asset-name') as HTMLInputElement;
                        const assetName = input?.value || defaultSaveAsName;
                        submitSaveAsDialog(assetName);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TtsErrorBoundary>
        )}
      </div>
    </TtsErrorBoundary>
  );
} 