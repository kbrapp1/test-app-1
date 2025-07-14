import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { AssetDetailsDto } from '../../../../application/use-cases/assets/GetAssetDetailsUseCase';

interface AssetPreviewSectionProps {
  asset: AssetDetailsDto | null;
}

export const AssetPreviewSection: React.FC<AssetPreviewSectionProps> = ({ asset }) => {
  if (!asset || !asset.preview) {
    return (
      <Card className="h-96 border-dashed border-2 border-gray-200">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <svg className="mx-auto mb-4 opacity-50" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No preview available</p>
            <p className="text-sm">This file type cannot be previewed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!asset.preview.canPreview) {
    return (
      <Card className="h-96 border-dashed border-2 border-gray-200">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <svg className="mx-auto mb-4 opacity-50" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Preview not supported</p>
            <p className="text-sm">This file type cannot be previewed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderPreviewContent = () => {
    switch (asset.preview?.previewType) {
      case 'image':
        return asset.publicUrl && (
          <Image
            src={asset.publicUrl}
            alt={asset.name}
            width={800}
            height={600}
            className="w-full h-full object-contain rounded-lg"
            style={{ maxHeight: '100%' }}
          />
        );
      case 'video':
        return asset.publicUrl && (
          <video 
            controls 
            src={asset.publicUrl} 
            className="w-full h-full object-contain rounded-lg"
            style={{ maxHeight: '100%' }}
          >
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return asset.publicUrl && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-full max-w-lg">
              <audio
                controls
                src={asset.publicUrl}
                className="w-full h-12 bg-white rounded-lg shadow-sm"
                style={{
                  filter: 'invert(0)',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  padding: '0.25rem'
                }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-400">
            <svg className="mx-auto mb-4 opacity-50" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Preview not supported</p>
            <p className="text-sm">This file type cannot be previewed</p>
          </div>
        );
    }
  };

  const isAudioPreview = asset?.preview?.previewType === 'audio';
  
  return (
    <Card className="h-96 overflow-hidden group">
      <CardContent className="h-full p-0 relative">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
          {renderPreviewContent()}
        </div>
        {/* Overlay for better UX - but not for audio to allow control interaction */}
        {!isAudioPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
}; 
