'use client';

import React from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadSectionProps {
  baseImageUrl: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBaseImage: () => void;
}

/**
 * ImageUploadSection Component
 * Single Responsibility: Manage image upload and display functionality
 */
export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  baseImageUrl,
  onFileUpload,
  onClearBaseImage,
}) => {
  return (
    <div>
      {baseImageUrl ? (
        <div className="relative">
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
            <img 
              src={baseImageUrl} 
              alt="Base image" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClearBaseImage}
              className="absolute top-2 right-2 bg-background rounded-full p-1 shadow-sm hover:shadow-md text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-24 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-border/60 transition-colors"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="text-center">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              Or drag and drop an image / browse
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}; 