'use client';

import React from 'react';
import { useAssetUpload } from '../../hooks/useAssetUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Domain-Based Asset Uploader Component
 * 
 * This component demonstrates modern DDD presentation patterns:
 * - Uses domain presentation hooks
 * - Focused upload experience for dedicated upload page
 * - Comprehensive file management and progress tracking
 * - Clean error handling and user feedback
 */

interface AssetUploaderProps {
  currentFolderId?: string | null;
  onUploadComplete?: () => void;
  className?: string;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({
  currentFolderId,
  onUploadComplete,
  className,
}) => {
  const upload = useAssetUpload({
    folderId: currentFolderId,
    onUploadComplete,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      upload.uploadFiles(Array.from(files));
    }
    // Reset input to allow selecting the same files again
    e.target.value = '';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          upload.uploadState.isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
        onDragOver={upload.handleDragOver}
        onDragLeave={upload.handleDragLeave}
        onDrop={upload.handleDrop}
      >
        {upload.uploadState.isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Drop files to upload</h3>
              <p className="text-blue-700">
                Release to upload to {currentFolderId ? 'this folder' : 'root folder'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Upload className="w-16 h-16 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your assets
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop files here, or click to browse and select files
            </p>
            <p className="text-sm text-gray-500">
              Supports images, documents, audio, video and more. Max file size: 50MB
            </p>
          </div>

          {/* File Input */}
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept={upload.getFileAcceptTypes()}
              className="hidden"
              id="file-upload"
              disabled={upload.uploadState.isUploading}
            />
            <label htmlFor="file-upload">
              <Button
                asChild
                size="lg"
                disabled={upload.uploadState.isUploading}
                className="cursor-pointer"
              >
                <span>
                  <Upload className="w-5 h-5 mr-2" />
                  {upload.uploadState.isUploading ? 'Uploading...' : 'Browse Files'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Upload Progress Section */}
      {upload.uploadState.files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">
                Upload Progress ({upload.uploadState.files.length} files)
              </h3>
            </div>
            {!upload.uploadState.isUploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={upload.clearFiles}
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {upload.uploadState.files.map((fileUpload, index) => (
              <div 
                key={`${fileUpload.file.name}-${index}`} 
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(fileUpload.status)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {fileUpload.file.name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {Math.round(fileUpload.file.size / 1024)}KB
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <Progress value={fileUpload.progress} className="h-2" />
                  
                  {/* Error Message */}
                  {fileUpload.error && (
                    <p className="text-xs text-red-600 mt-1">{fileUpload.error}</p>
                  )}
                </div>

                {/* Status Badge */}
                <Badge 
                  className={cn('flex-shrink-0', getStatusColor(fileUpload.status))}
                  variant="outline"
                >
                  {fileUpload.status === 'completed' ? 'Complete' :
                   fileUpload.status === 'error' ? 'Failed' :
                   fileUpload.status === 'uploading' ? 'Uploading' : 'Pending'}
                </Badge>

                {/* Remove Button */}
                {fileUpload.status === 'error' && !upload.uploadState.isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => upload.removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Overall Progress Summary */}
          {upload.uploadState.isUploading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Uploading files... Please don't close this page.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>
          <strong>Supported formats:</strong> Images (JPEG, PNG, GIF, WebP, SVG), 
          Documents (PDF, TXT, MD, CSV), Audio (MP3, WAV, OGG), 
          Video (MP4, WebM, MOV), Office files
        </p>
        <p>
          Uploading to: {currentFolderId ? 'Selected Folder' : 'Root Library'}
        </p>
      </div>
    </div>
  );
};

export default AssetUploader; 