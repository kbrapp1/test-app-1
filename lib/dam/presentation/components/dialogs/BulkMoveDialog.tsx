'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderTreeRenderer } from './components/FolderTreeRenderer';
import { useFolderPicker } from './hooks/useFolderPicker';
import { Folder, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface BulkMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: string[];
  selectedFolders: string[];
  currentFolderId?: string | null;
  onConfirm: (targetFolderId: string | null) => Promise<void>;
}

export const BulkMoveDialog: React.FC<BulkMoveDialogProps> = ({
  isOpen,
  onClose,
  selectedAssets,
  selectedFolders,
  currentFolderId,
  onConfirm
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Use folder picker hook for folder tree state
  const {
    selectedFolderId: selectedTargetFolderId,
    isInitiallyLoading,
    rootFolders,
    setSelectedFolderId: setSelectedTargetFolderId,
    handleToggleExpand,
  } = useFolderPicker({ isOpen });

  const totalItems = selectedAssets.length + selectedFolders.length;

  const handleConfirm = async () => {
    if (isMoving) return;

    setIsMoving(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await onConfirm(selectedTargetFolderId || null);

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move items');
      setProgress(0);
    } finally {
      setIsMoving(false);
    }
  };

  const resetState = () => {
    setSelectedTargetFolderId(null);
    setIsMoving(false);
    setProgress(0);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (isMoving) return;
    onClose();
    resetState();
  };

  const canMove = selectedTargetFolderId !== currentFolderId && !isMoving;
  const targetFolderName = selectedTargetFolderId === null ? 'Root Folder' : 'Selected Folder';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            Move {totalItems} Item{totalItems !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Selected Items Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-sm text-gray-900 mb-2">Items to Move:</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {selectedAssets.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded">
                  <FileText className="w-3 h-3" />
                  {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedFolders.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  <Folder className="w-3 h-3" />
                  {selectedFolders.length} Folder{selectedFolders.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Destination Folder Picker */}
          {!isMoving && !success && (
            <div className="flex-1 overflow-hidden">
              <h3 className="font-medium text-sm text-gray-900 mb-2">Choose Destination:</h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <FolderTreeRenderer
                  rootFolders={rootFolders}
                  isInitiallyLoading={isInitiallyLoading}
                  selectedFolderId={selectedTargetFolderId}
                  currentAssetFolderId={currentFolderId}
                  onSelect={setSelectedTargetFolderId}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
              {selectedTargetFolderId !== null && selectedTargetFolderId !== undefined && (
                <p className="text-sm text-gray-600 mt-2">
                  Moving to: <span className="font-medium">{targetFolderName}</span>
                </p>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {isMoving && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Moving items...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                Moving {totalItems} item{totalItems !== 1 ? 's' : ''} to {targetFolderName}
              </p>
            </div>
          )}

          {/* Success State */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully moved {totalItems} item{totalItems !== 1 ? 's' : ''} to {targetFolderName}
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canMove || success}
            className="min-w-24"
          >
            {isMoving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Moving...
              </>
            ) : success ? (
              'Complete'
            ) : (
              `Move ${totalItems} Item${totalItems !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 