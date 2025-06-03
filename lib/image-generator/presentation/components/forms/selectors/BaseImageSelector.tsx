'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Folder, X } from 'lucide-react';

interface BaseImageSelectorProps {
  baseImageUrl: string | null;
  damAssetId: string | null;
  generationType: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onDamSelect?: () => void;
  className?: string;
}

/**
 * Component for base image selection and upload
 * Single Responsibility: Image input management
 */
export const BaseImageSelector: React.FC<BaseImageSelectorProps> = ({
  baseImageUrl,
  damAssetId,
  generationType,
  onFileUpload,
  onClearImage,
  onDamSelect,
  className = ''
}) => {
  const isRequired = generationType !== 'text-to-image';

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Base Image {isRequired && <span className="text-red-500">*</span>}
      </label>

      {baseImageUrl ? (
        <div className="relative">
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={baseImageUrl} 
              alt="Base image" 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onClearImage}
              className="absolute top-2 right-2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <Badge variant="secondary" className="mt-2">
            {damAssetId ? 'From DAM' : 'Uploaded'}
          </Badge>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onDamSelect}
                className="flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                From DAM
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              Upload an image or select from your Digital Asset Management library
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