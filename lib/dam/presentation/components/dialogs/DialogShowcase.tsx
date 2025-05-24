'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ConfirmationDialog, 
  DeleteAssetConfirmation, 
  DeleteFolderConfirmation 
} from './ConfirmationDialog';
import { AssetDetailsModal } from './AssetDetailsModal';

/**
 * DialogShowcase - Domain-Driven Dialog Demonstration
 * 
 * This component showcases the domain-driven dialog system:
 * - Generic confirmation dialogs
 * - Domain-specific asset/folder dialogs
 * - Asset management modal with full CRUD operations
 * - Clean separation of concerns
 * - Reusable dialog patterns
 */

export const DialogShowcase: React.FC = () => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [deleteAssetOpen, setDeleteAssetOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [assetDetailsOpen, setAssetDetailsOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // Mock asset ID for demonstration
  const mockAssetId = 'demo-asset-123';

  const handleAction = (action: string) => {
    setLastAction(`Executed: ${action}`);
    setTimeout(() => setLastAction(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Domain-Driven Dialog System
        </h2>
        <p className="text-gray-600">
          Demonstration of our comprehensive dialog system with domain-specific patterns.
        </p>
      </div>

      {/* Dialog Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Confirmation Dialogs</h3>
          
          <Button 
            onClick={() => setConfirmationOpen(true)}
            variant="outline"
            className="w-full justify-start"
          >
            📋 Generic Confirmation
          </Button>

          <Button 
            onClick={() => setDeleteAssetOpen(true)}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
          >
            🗑️ Delete Asset
          </Button>

          <Button 
            onClick={() => setDeleteFolderOpen(true)}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
          >
            📁 Delete Folder
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Asset Management</h3>
          
          <Button 
            onClick={() => setAssetDetailsOpen(true)}
            variant="outline"
            className="w-full justify-start"
          >
            🔍 Asset Details & Management
          </Button>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="text-blue-800 font-medium">Asset Details Modal Features:</p>
            <ul className="text-blue-700 mt-1 space-y-1 text-xs">
              <li>• Preview with multi-format support</li>
              <li>• Inline editing capabilities</li>
              <li>• Download functionality</li>
              <li>• Delete with confirmation</li>
              <li>• Domain capability checking</li>
              <li>• Real-time updates</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Domain-Driven Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800">Reusability</h4>
            <p className="text-gray-600">
              Dialogs use domain DTOs and can be reused across components
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Business Logic</h4>
            <p className="text-gray-600">
              All operations delegate to domain use cases
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Type Safety</h4>
            <p className="text-gray-600">
              Strong typing with domain entities throughout
            </p>
          </div>
        </div>
      </div>

      {/* Action Feedback */}
      {lastAction && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">✅ {lastAction}</p>
        </div>
      )}

      {/* Dialog Components */}
      <ConfirmationDialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        title="Confirm Action"
        description="This is a generic confirmation dialog that can be reused for any action requiring user confirmation."
        confirmText="Proceed"
        cancelText="Cancel"
        onConfirm={() => handleAction('Generic confirmation')}
      />

      <DeleteAssetConfirmation
        open={deleteAssetOpen}
        onOpenChange={setDeleteAssetOpen}
        assetName="example-file.jpg"
        onConfirm={() => handleAction('Asset deletion')}
      />

      <DeleteFolderConfirmation
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        folderName="My Documents"
        onConfirm={() => handleAction('Folder deletion')}
      />

      <AssetDetailsModal
        open={assetDetailsOpen}
        onOpenChange={setAssetDetailsOpen}
        assetId={mockAssetId}
        onAssetUpdated={() => handleAction('Asset updated')}
        onAssetDeleted={() => handleAction('Asset deleted')}
      />
    </div>
  );
};

export default DialogShowcase; 