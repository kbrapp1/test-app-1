import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadState {
  isUploading: boolean;
  files: UploadFile[];
  isDragOver: boolean;
}

export interface UseAssetUploadOptions {
  folderId?: string | null;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in bytes
}

export const useAssetUpload = (options: UseAssetUploadOptions = {}) => {
  const { folderId, onUploadComplete, maxFileSize = 50 * 1024 * 1024 } = options; // 50MB default
  const { toast } = useToast();

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    files: [],
    isDragOver: false,
  });

  // Supported file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/avi',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  const validateFiles = (files: File[]): File[] => {
    return files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name}: File type ${file.type} is not supported.`,
          variant: 'destructive',
        });
        return false;
      }
      
      if (file.size > maxFileSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name}: File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit.`,
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    });
  };

  const uploadFiles = async (files: File[]) => {
    const validFiles = validateFiles(files);
    
    if (validFiles.length === 0) {
      return;
    }

    // Initialize upload state
    const uploadFiles: UploadFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      files: uploadFiles,
    }));

    let successCount = 0;

    // Upload files sequentially with progress tracking
    for (let i = 0; i < uploadFiles.length; i++) {
      const fileUpload = uploadFiles[i];
      
      try {
        // Update status to uploading
        setUploadState(prev => ({
          ...prev,
          files: prev.files.map((f, index) => 
            index === i ? { ...f, status: 'uploading' } : f
          ),
        }));

        // Create FormData for upload
        const formData = new FormData();
        formData.append('files', fileUpload.file);
        if (folderId) {
          formData.append('folderId', folderId);
        }

        // Upload with progress simulation
        const response = await fetch('/api/dam/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          // Handle both string and object error formats
          const errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : errorData.error?.message || `Upload failed: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        // Simulate progress for visual feedback
        for (let progress = 10; progress <= 100; progress += 10) {
          setUploadState(prev => ({
            ...prev,
            files: prev.files.map((f, index) => 
              index === i ? { ...f, progress } : f
            ),
          }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Mark as completed
        setUploadState(prev => ({
          ...prev,
          files: prev.files.map((f, index) => 
            index === i ? { ...f, status: 'completed', progress: 100 } : f
          ),
        }));

        successCount++;

      } catch (error) {
        console.error(`Upload failed for ${fileUpload.file.name}:`, error);
        
        // Mark as error
        setUploadState(prev => ({
          ...prev,
          files: prev.files.map((f, index) => 
            index === i ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } : f
          ),
        }));
      }
    }

    // Complete upload process
    setUploadState(prev => ({ ...prev, isUploading: false }));
    
    // Show success message
    if (successCount > 0) {
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} of ${validFiles.length} file(s).`,
      });
      onUploadComplete?.();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadState.isDragOver) {
      setUploadState(prev => ({ ...prev, isDragOver: true }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag overlay if leaving the main container
    if (e.currentTarget === e.target) {
      setUploadState(prev => ({ ...prev, isDragOver: false }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const clearFiles = () => {
    setUploadState(prev => ({ ...prev, files: [] }));
  };

  const getFileAcceptTypes = () => {
    return allowedTypes.join(',');
  };

  return {
    uploadState,
    uploadFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
    getFileAcceptTypes,
  };
}; 
