'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadHandler {
  uploadState: {
    isUploading: boolean;
    files: UploadFile[];
    uploadedFiles: UploadFile[];
    isDragOver: boolean;
  };
  uploadFiles: (files: File[]) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  getFileAcceptTypes: () => string;
}

interface UploadProgressProps {
  upload: UploadHandler;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ upload }) => {
  if (upload.uploadState.files.length === 0) {
    return null;
  }

  const progressItems = upload.uploadState.files.map((fileUpload: UploadFile, index: number) => (
    <div key={`${fileUpload.file.name}-${index}`} className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{fileUpload.file.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {Math.round(fileUpload.file.size / 1024)}KB
            </span>
            {fileUpload.status === 'error' && !upload.uploadState.isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => upload.removeFile(index)}
                className="h-6 px-2 text-xs"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={fileUpload.progress} className="flex-1 h-2" />
          <Badge variant={
            fileUpload.status === 'completed' ? 'default' :
            fileUpload.status === 'error' ? 'destructive' :
            fileUpload.status === 'uploading' ? 'secondary' : 'outline'
          }>
            {fileUpload.status === 'completed' ? 'Done' :
             fileUpload.status === 'error' ? 'Error' :
             fileUpload.status === 'uploading' ? 'Uploading' : 'Pending'}
          </Badge>
        </div>
        {fileUpload.error && (
          <p className="text-xs text-red-600 mt-1">{fileUpload.error}</p>
        )}
      </div>
    </div>
  ));

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Uploading Files ({upload.uploadState.uploadedFiles?.length || 0})
        </h3>
        {!upload.uploadState.isUploading && (
          <Button variant="ghost" size="sm" onClick={upload.clearFiles}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {progressItems}
      </div>
    </div>
  );
}; 
