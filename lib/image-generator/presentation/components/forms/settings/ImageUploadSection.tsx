'use client';

import React from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { getAspectRatioClasses } from '../../../utils/aspectRatioUtils';

interface ImageUploadSectionProps {
  baseImageUrl: string | null;
  aspectRatio: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBaseImage: () => void;
  isStorageUrl?: boolean;
  isUploading?: boolean;
  inputId?: string; // NEW: Custom input ID for multiple upload areas
}

/**
 * ImageUploadSection Component
 * Single Responsibility: Manage image upload and display functionality
 */
export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  baseImageUrl,
  aspectRatio,
  onFileUpload,
  onClearBaseImage,
  isStorageUrl = true,
  isUploading = false,
  inputId = 'file-upload',
}) => {
  const containerClasses = getAspectRatioClasses(aspectRatio);
  return (
    <div>
      {baseImageUrl ? (
        <div className="relative">
          <div className={`w-full ${containerClasses} bg-muted rounded-lg overflow-hidden`}>
            <Image 
              src={baseImageUrl} 
              alt="Base image" 
              width={400}
              height={300}
              className="w-full h-full object-cover object-top"
            />
            <button
              onClick={onClearBaseImage}
              className="absolute top-2 right-2 bg-background rounded-full p-1 shadow-sm hover:shadow-md text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {isUploading && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                Uploading...
              </span>
            )}
            {!isStorageUrl && !isUploading && baseImageUrl && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                Preview Only - needs upload for generation
              </span>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-24 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-border/60 transition-colors"
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <div className="text-center">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              Or drag and drop an image / browse
            </p>
          </div>
          <input
            id={inputId}
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