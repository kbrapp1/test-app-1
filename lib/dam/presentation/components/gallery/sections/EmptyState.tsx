'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { NewFolderDialog } from '../../dialogs/NewFolderDialog';

interface EmptyStateProps {
  searchTerm?: string;
  activeFolderId: string | null;
  enableNavigation: boolean;
  upload: any;
  onRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchTerm,
  activeFolderId,
  enableNavigation,
  upload,
  onRefresh,
}) => {
  if (searchTerm) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-600 mb-2">No results found for "{searchTerm}"</p>
        <p className="text-sm text-gray-500">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
      <div className="space-y-6">
        <div>
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {activeFolderId ? 'This folder is empty' : 'No assets yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {activeFolderId 
              ? 'Upload files or create folders to organize your content'
              : 'Start by uploading your first assets or creating folders'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div>
            <input
              type="file"
              multiple
              accept={upload.getFileAcceptTypes()}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  upload.uploadFiles(Array.from(e.target.files));
                  e.target.value = '';
                }
              }}
              className="hidden"
              id="upload-input"
            />
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <label htmlFor="upload-input" className="cursor-pointer">
                <Upload className="w-5 h-5 mr-2" />
                Upload Files
              </label>
            </Button>
          </div>

          {enableNavigation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">or</span>
              <Button variant="outline">
                New Folder
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <p>💡 <strong>Tip:</strong> You can also drag and drop files anywhere on this page</p>
          <p>Supported formats: Images, PDFs, Text files, Audio, Video (max 50MB)</p>
        </div>
      </div>
    </div>
  );
}; 
