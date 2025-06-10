import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  AssetManagementContract,
  AssetReference 
} from '../../application/contracts/AssetManagementContract';
import { DamAssetManagementAdapter } from '../../infrastructure/adapters/DamAssetManagementAdapter';

interface UseTtsDamIntegrationProps {
  onTextLoaded?: (text: string, assetId: string) => void; // Callback after text is loaded
  assetManagement?: AssetManagementContract; // Allow dependency injection for testing
}

export function useTtsDamIntegration({ 
  onTextLoaded, 
  assetManagement = new DamAssetManagementAdapter() 
}: UseTtsDamIntegrationProps = {}) {
  const { toast } = useToast();
  const [isDamModalOpen, setIsDamModalOpen] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isSavingText, setIsSavingText] = useState(false);
  const [isSavingToDam, setIsSavingToDam] = useState(false);
  const [isLoadingDownloadUrl, setIsLoadingDownloadUrl] = useState(false);

  const [sourceAssetId, setSourceAssetId] = useState<string | null>(null);
  const [originalLoadedText, setOriginalLoadedText] = useState<string | null>(null);
  const [outputAssetId, setOutputAssetId] = useState<string | null>(null); // Asset ID of the saved audio
  const [damErrorMessage, setDamErrorMessage] = useState<string | null>(null);

  // --- Text Loading --- 
  const loadTextFromAsset = useCallback(async (asset: AssetReference) => {
    setIsDamModalOpen(false);
    setIsLoadingText(true);
    setDamErrorMessage(null);
    setSourceAssetId(null);
    setOriginalLoadedText(null);
    setOutputAssetId(null); // Reset output if loading new text

    try {
      const result = await assetManagement.loadTextContent(asset.id);
      if (result.success && result.content) {
        setSourceAssetId(asset.id);
        setOriginalLoadedText(result.content);
        toast({ title: 'Content Loaded', description: `Loaded content from ${asset.name || 'asset'}.` });
        // Call the callback to update the form in the main component
        onTextLoaded?.(result.content, asset.id);
      } else {
        const errorMsg = result.error || 'Failed to load asset content.';
        setDamErrorMessage(errorMsg);
        toast({ title: 'Error Loading Text', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred while loading content.';
      setDamErrorMessage(errorMsg);
      toast({ title: 'Error Loading Text', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoadingText(false);
    }
  }, [toast, onTextLoaded, assetManagement]);

  // --- Text Saving --- 
  const saveTextToAsset = useCallback(async (currentText: string) => {
    if (!sourceAssetId || isSavingText) return;
    setIsSavingText(true);
    setDamErrorMessage(null);
    try {
      const result = await assetManagement.updateTextContent(sourceAssetId, currentText);
      if (result.success) {
        setOriginalLoadedText(currentText); // Update original text on successful save
        toast({ title: 'Success', description: 'Text asset updated successfully.' });
      } else {
        const errorMsg = result.error || 'Could not update text asset.';
        setDamErrorMessage(errorMsg);
        toast({ title: 'Save Failed', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred while saving.';
      setDamErrorMessage(errorMsg);
      toast({ title: 'Error Saving Text', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsSavingText(false);
    }
  }, [sourceAssetId, isSavingText, toast, assetManagement]);

  const saveTextAsNewAsset = useCallback(async (currentText: string, desiredName: string) => {
    if (!currentText || isSavingText) return;
    setIsSavingText(true);
    setDamErrorMessage(null);
    try {
      const result = await assetManagement.saveTextAsNewAsset(currentText, desiredName);
      if (result.success && result.assetId) {
        setSourceAssetId(result.assetId); // Set the new asset as the source
        setOriginalLoadedText(currentText); // Update original text
        toast({ title: 'Success', description: `Text saved as new asset: ${desiredName}` });
      } else {
        const errorMsg = result.error || 'Could not save text as new asset.';
        setDamErrorMessage(errorMsg);
        toast({ title: 'Save As Failed', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred during Save As.';
      setDamErrorMessage(errorMsg);
      toast({ title: 'Error Saving Text As', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsSavingText(false);
    }
  }, [isSavingText, toast, assetManagement]);

  // --- Audio Saving --- 
  const saveAudioToDam = useCallback(async (audioFileUrl: string, ttsPredictId: string | null) => {
    if (!audioFileUrl || !ttsPredictId) {
      toast({ title: 'Save Error', description: 'Missing audio URL or prediction ID.', variant: 'destructive' });
      return;
    }
    if (outputAssetId) {
      toast({ title: 'Info', description: 'Audio already saved to library.' });
      return;
    }

    setIsSavingToDam(true);
    setDamErrorMessage(null);
    const assetName = `Generated Speech - ${new Date().toISOString().split('T')[0]}.mp3`; // Example name

    try {
      const result = await assetManagement.saveAudioAsset({
        audioUrl: audioFileUrl,
        desiredName: assetName,
        contentType: 'audio/mpeg',
        metadata: {
          sourceType: 'tts_generation',
          ttsPredictionId: ttsPredictId,
        }
      });
      
      if (result.success && result.assetId) {
        setOutputAssetId(result.assetId);
        toast({ title: 'Success', description: 'Audio saved to DAM library.' });
      } else {
        const errorMsg = result.error || 'Failed to save audio to DAM.';
        setDamErrorMessage(errorMsg);
        toast({ title: 'Save Failed', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred while saving audio.';
      setDamErrorMessage(errorMsg);
      toast({ title: 'Error Saving Audio', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsSavingToDam(false);
    }
  }, [outputAssetId, toast, assetManagement]);

  // --- Download URL --- 
  const getDownloadUrl = useCallback(async (fallbackUrl: string | null): Promise<{ url: string | null, filename: string }> => {
    let urlToDownload: string | null = null;
    let filename = `generated-speech-${new Date().toISOString().slice(0, 10)}.mp3`; // Default
    setIsLoadingDownloadUrl(true);
    setDamErrorMessage(null);

    try {
      if (outputAssetId) {
        const result = await assetManagement.getAssetDownloadUrl(outputAssetId);
        if (result.success && result.downloadUrl) {
          urlToDownload = result.downloadUrl;
          filename = result.filename || filename;
        } else {
          throw new Error(result.error || 'Failed to get download URL for saved asset.');
        }
      } else if (fallbackUrl) {
        urlToDownload = fallbackUrl;
      } else {
        throw new Error('No audio available to download.');
      }
      return { url: urlToDownload, filename };
    } catch (error: any) {
      const errorMsg = error.message || 'Could not determine download URL.';
      setDamErrorMessage(errorMsg);
      toast({ title: 'Download Failed', description: errorMsg, variant: 'destructive' });
      return { url: null, filename };
    } finally {
      setIsLoadingDownloadUrl(false);
    }
  }, [outputAssetId, toast, assetManagement]);

  // Combined loading state for any DAM text operation
  const isTextActionLoading = isLoadingText || isSavingText;
  // Combined loading state for any DAM audio save/download operation
  const isAudioActionLoading = isSavingToDam || isLoadingDownloadUrl;

  return {
    isDamModalOpen,
    setIsDamModalOpen,
    isTextActionLoading,
    isAudioActionLoading,
    sourceAssetId,
    originalLoadedText,
    outputAssetId,
    damErrorMessage,
    loadTextFromAsset,
    saveTextToAsset,
    saveTextAsNewAsset,
    saveAudioToDam,
    getDownloadUrl,
  };
} 