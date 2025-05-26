'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, FileText, Folder, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: string[];
  selectedFolders: string[];
  onConfirm: () => Promise<void>;
}

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  selectedAssets,
  selectedFolders,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalItems = selectedAssets.length + selectedFolders.length;

  const handleConfirm = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      await onConfirm();

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete items');
      setProgress(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetState = () => {
    setIsDeleting(false);
    setProgress(0);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete {totalItems} Item{totalItems !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          {!isDeleting && !success && (
            <>
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-800">
                  This action cannot be undone. The selected items will be permanently deleted.
                </AlertDescription>
              </Alert>

              {/* Selected Items Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-900 mb-2">Items to Delete:</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  {selectedAssets.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded">
                      <FileText className="w-3 h-3" />
                      {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {selectedFolders.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded">
                      <Folder className="w-3 h-3" />
                      {selectedFolders.length} Folder{selectedFolders.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {selectedFolders.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    Note: Deleting folders will also delete all their contents.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Progress Indicator */}
          {isDeleting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                <span className="text-sm font-medium">Deleting items...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                Deleting {totalItems} item{totalItems !== 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {/* Success State */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully deleted {totalItems} item{totalItems !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || success}
            className="min-w-24"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : success ? (
              'Complete'
            ) : (
              `Delete ${totalItems} Item${totalItems !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 