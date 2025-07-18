import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';

// Storage key for persisting file upload state
const FILE_UPLOAD_STORAGE_KEY = 'image-generator-file-upload';

interface PersistedFileUploadState {
  baseImageUrl: string | null;
  isStorageUrl: boolean;
  timestamp: number;
}

// Helper to get persisted file upload state
const getPersistedFileUploadState = (): Partial<PersistedFileUploadState> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(FILE_UPLOAD_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as PersistedFileUploadState;
    
    // Check if data is not too old (24 hours)
    const isStale = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    if (isStale) {
      sessionStorage.removeItem(FILE_UPLOAD_STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    sessionStorage.removeItem(FILE_UPLOAD_STORAGE_KEY);
    return null;
  }
};

// Helper to save file upload state
const savePersistedFileUploadState = (state: Omit<PersistedFileUploadState, 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const dataToSave: PersistedFileUploadState = {
      ...state,
      timestamp: Date.now()
    };
    sessionStorage.setItem(FILE_UPLOAD_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {
    // Storage full or disabled, ignore silently
  }
};



export interface UseFileUploadReturn {
  baseImage: File | null;
  baseImageUrl: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearBaseImage: () => void;
  setBaseImageUrl: (url: string) => void;
  isUploading: boolean;
  isStorageUrl: boolean; // Track if the URL is from storage (not base64)
  // NEW: Second image support
  secondImage: File | null;
  secondImageUrl: string | null;
  handleSecondFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearSecondImage: () => void;
  setSecondImageUrl: (url: string) => void;
  isSecondImageUploading: boolean;
  isSecondImageStorageUrl: boolean;
}

export const useFileUpload = (): UseFileUploadReturn => {
  // Initialize from persisted state
  const persistedState = getPersistedFileUploadState();
  
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrlInternal] = useState<string | null>(
    persistedState?.baseImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isStorageUrl, setIsStorageUrlInternal] = useState(
    persistedState?.isStorageUrl || false
  );
  // NEW: Second image state
  const [secondImage, setSecondImage] = useState<File | null>(null);
  const [secondImageUrl, setSecondImageUrlInternal] = useState<string | null>(null);
  const [isSecondImageUploading, setIsSecondImageUploading] = useState(false);
  const [isSecondImageStorageUrl, setIsSecondImageStorageUrlInternal] = useState(false);
  const supabase = createClient();
  const { activeOrganizationId } = useOrganization();

  // Wrapper functions that persist state
  const setBaseImageUrl = useCallback((url: string | null) => {
    setBaseImageUrlInternal(url);
  }, []);

  const setIsStorageUrl = useCallback((value: boolean) => {
    setIsStorageUrlInternal(value);
  }, []);

  // Effect to persist file upload state changes
  useEffect(() => {
    const stateToSave = {
      baseImageUrl,
      isStorageUrl
    };
    
    savePersistedFileUploadState(stateToSave);
  }, [baseImageUrl, isStorageUrl]);

  // Safety mechanism: Auto-reset stuck uploading state for storage URLs
  useEffect(() => {
    if (isUploading && baseImageUrl && (baseImageUrl.startsWith('http://') || baseImageUrl.startsWith('https://'))) {
      // If we have a proper HTTP URL but are still showing uploading, reset the state
      const timeoutId = setTimeout(() => {
        setIsUploading(false);
      }, 1000); // Give 1 second for normal state updates

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isUploading, baseImageUrl]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    setBaseImage(file);

    try {
      // Create base64 preview for immediate feedback
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      setBaseImageUrl(dataUrl);
      setIsStorageUrl(false); // This is just a preview, not from storage

      // Attempt storage upload if organization context is available
      if (activeOrganizationId) {
        try {
          // Generate unique filename for the temporary upload
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          // Include organization ID in path as required by storage policies
          const filePath = `${activeOrganizationId}/temp-uploads/${fileName}`;

          // Upload to Supabase Storage in existing assets bucket
          const { data, error } = await supabase.storage
            .from('assets')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!error && data) {
            // Get public URL for the uploaded image and replace base64
            const { data: { publicUrl } } = supabase.storage
              .from('assets')
              .getPublicUrl(data.path);

            setBaseImageUrl(publicUrl);
            setIsStorageUrl(true); // This is now a proper storage URL
          }
        } catch {
          // Silently fall back to base64 - no need to log error
        }
      }
    } catch {
      // Handle any errors in the process
    } finally {
      // Always reset uploading state, regardless of success/failure
      setIsUploading(false);
    }
  }, [supabase, activeOrganizationId, setBaseImageUrl, setIsStorageUrl]);

  const clearBaseImage = useCallback(() => {
    setBaseImage(null);
    setBaseImageUrl(null);
    setIsUploading(false);
    setIsStorageUrl(false);
    
    // Reset file input to allow re-uploading the same file
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [setBaseImageUrl, setIsStorageUrl]);

  const setBaseImageUrlDirect = useCallback((url: string) => {
    // Validate URL format before setting
    if (!url) {
      console.warn('Empty URL provided to setBaseImageUrlDirect');
      return;
    }

    // Ensure we have a proper URL
    const isValidHttpUrl = url.startsWith('http://') || url.startsWith('https://');
    const isDataUrl = url.startsWith('data:');
    
    if (!isValidHttpUrl && !isDataUrl) {
      console.warn('Invalid URL format provided to setBaseImageUrlDirect:', url);
      return;
    }

    setBaseImageUrl(url);
    setBaseImage(null); // Clear file object when setting URL directly
    setIsUploading(false); // Always reset uploading state when setting URL directly
    setIsStorageUrl(isValidHttpUrl); // Only HTTP/HTTPS URLs are considered storage URLs
    
    // Reset file input when setting URL directly (e.g., from "Make Base Image")
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [setBaseImageUrl, setIsStorageUrl]);

  // NEW: Second image wrapper functions and handlers
  const setSecondImageUrl = useCallback((url: string | null) => {
    setSecondImageUrlInternal(url);
  }, []);

  const setIsSecondImageStorageUrl = useCallback((value: boolean) => {
    setIsSecondImageStorageUrlInternal(value);
  }, []);

  const handleSecondFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsSecondImageUploading(true);
    setSecondImage(file);

    try {
      // Create base64 preview for immediate feedback
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      setSecondImageUrl(dataUrl);
      setIsSecondImageStorageUrl(false); // This is just a preview, not from storage

      // Attempt storage upload if organization context is available
      if (activeOrganizationId) {
        try {
          // Generate unique filename for the temporary upload
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          // Include organization ID in path as required by storage policies
          const filePath = `${activeOrganizationId}/temp-uploads/second-${fileName}`;

          // Upload to Supabase Storage in existing assets bucket
          const { data, error } = await supabase.storage
            .from('assets')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!error && data) {
            // Get public URL for the uploaded image and replace base64
            const { data: { publicUrl } } = supabase.storage
              .from('assets')
              .getPublicUrl(data.path);

            setSecondImageUrl(publicUrl);
            setIsSecondImageStorageUrl(true); // This is now a proper storage URL
          }
        } catch {
          // Silently fall back to base64 - no need to log error
        }
      }
    } catch {
      // Handle any errors in the process
    } finally {
      // Always reset uploading state, regardless of success/failure
      setIsSecondImageUploading(false);
    }
  }, [supabase, activeOrganizationId, setSecondImageUrl, setIsSecondImageStorageUrl]);

  const clearSecondImage = useCallback(() => {
    setSecondImage(null);
    setSecondImageUrl(null);
    setIsSecondImageUploading(false);
    setIsSecondImageStorageUrl(false);
    
    // Reset file input to allow re-uploading the same file
    const fileInput = document.getElementById('second-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [setSecondImageUrl, setIsSecondImageStorageUrl]);

  const setSecondImageUrlDirect = useCallback((url: string) => {
    // Validate URL format before setting
    if (!url) {
      console.warn('Empty URL provided to setSecondImageUrlDirect');
      return;
    }

    // Ensure we have a proper URL
    const isValidHttpUrl = url.startsWith('http://') || url.startsWith('https://');
    const isDataUrl = url.startsWith('data:');
    
    if (!isValidHttpUrl && !isDataUrl) {
      console.warn('Invalid URL format provided to setSecondImageUrlDirect:', url);
      return;
    }

    setSecondImageUrl(url);
    setSecondImage(null); // Clear file object when setting URL directly
    setIsSecondImageUploading(false); // Always reset uploading state when setting URL directly
    setIsSecondImageStorageUrl(isValidHttpUrl); // Only HTTP/HTTPS URLs are considered storage URLs
    
    // Reset file input when setting URL directly
    const fileInput = document.getElementById('second-file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [setSecondImageUrl, setIsSecondImageStorageUrl]);

  return {
    baseImage,
    baseImageUrl,
    handleFileUpload,
    clearBaseImage,
    setBaseImageUrl: setBaseImageUrlDirect,
    isUploading,
    isStorageUrl,
    // NEW: Second image properties
    secondImage,
    secondImageUrl,
    handleSecondFileUpload,
    clearSecondImage,
    setSecondImageUrl: setSecondImageUrlDirect,
    isSecondImageUploading,
    isSecondImageStorageUrl,
  };
}; 