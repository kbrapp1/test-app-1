'use client';

import { AssetGalleryClient } from '@/lib/dam/presentation/components/gallery/AssetGalleryClient';
import { Navigation, Upload } from 'lucide-react';

/**
 * DAM Domain Test Page
 * 
 * This page demonstrates the complete domain-driven DAM architecture:
 * - Server-side rendering with domain use cases (AssetGallery)
 * - Client-side data fetching with domain hooks (AssetGalleryClient)
 * - Grid/List view with interactive controls (AssetGrid)
 * - High-performance virtualization for large datasets (VirtualizedAssetGrid)
 * - Domain-driven dialog system (ConfirmationDialog, etc.)
 * - Clean Architecture: Presentation → Application → Domain
 */

export default function TestDomainPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Navigation className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">DAM Test Domain</h1>
          <div className="flex items-center gap-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <Upload className="w-4 h-4" />
            Upload System Enabled
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 New Features Available:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Drag & Drop Upload:</strong> Drag files anywhere on this page to upload</li>
            <li>• <strong>Progress Tracking:</strong> Real-time upload progress with error handling</li>
            <li>• <strong>File Validation:</strong> Support for images, documents, audio, video (max 50MB)</li>
            <li>• <strong>Smart Organization:</strong> Files upload to the current folder you're viewing</li>
            <li>• <strong>Context Integration:</strong> Upload integrates with our folder navigation system</li>
          </ul>
        </div>
      </div>

      <AssetGalleryClient
        currentFolderId={null} // Start at root
        viewMode="grid"
        enableNavigation={true} // Enable folder navigation with upload
      />
    </div>
  );
} 