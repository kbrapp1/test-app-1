import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AssetDetailsDto } from '../../../../application/use-cases/assets/GetAssetDetailsUseCase';

interface AssetDetailsHeaderProps {
  asset: AssetDetailsDto | null;
  editMode: boolean;
  editName: string;
  updating: boolean;
  copiedUrl: boolean;
  error: string | null;
  onEditModeChange: (editMode: boolean) => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCopyUrl: () => void;
}

export const AssetDetailsHeader: React.FC<AssetDetailsHeaderProps> = ({
  asset,
  editMode,
  editName,
  updating,
  copiedUrl,
  error,
  onEditModeChange,
  onEditNameChange,
  onSaveEdit,
  onCopyUrl,
}) => {
  return (
    <DialogHeader className="px-8 py-6 border-b bg-white sticky top-0 z-10">
      <DialogTitle
        className={editMode ? "sr-only" : "text-xl font-semibold text-gray-900 truncate"}
        title={asset?.name}
      >
        {asset?.name || 'Asset Details'}
      </DialogTitle>
      <DialogDescription className="sr-only">
        View and manage asset details, including preview, metadata, tags, and file information.
      </DialogDescription>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          {editMode ? (
            <Input 
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={updating}
              placeholder="Asset name"
            />
          ) : null}
          
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            {asset?.folderName || asset?.folderPath || 'Root'}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {asset && !editMode && (
            <>
              {asset.publicUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onCopyUrl}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedUrl ? "M5 13l4 4L19 7" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"} />
                  </svg>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditModeChange(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            </>
          )}
          {editMode && (
            <>
              <Button 
                onClick={onSaveEdit} 
                size="sm" 
                disabled={updating || !editName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updating && (
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { 
                  onEditModeChange(false); 
                  onEditNameChange(asset?.name || ''); 
                }} 
                disabled={updating}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}
    </DialogHeader>
  );
}; 
