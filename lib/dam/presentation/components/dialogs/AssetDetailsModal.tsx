'use client';

import React, { useState, useEffect } from 'react';
import {  Dialog,  DialogContent,  DialogHeader,  DialogTitle,  DialogDescription,} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Edit3, 
  Trash2, 
  FolderOpen, 
  Calendar, 
  FileType, 
  HardDrive, 
  Tag as TagIcon, 
  Loader2, 
  X as XIcon, 
  Eye, 
  Share2, 
  Copy, 
  Check,
  Info,
  Clock,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { DeleteAssetConfirmation } from './ConfirmationDialog';
import { AssetDetailsDto } from '../../../application/use-cases/GetAssetDetailsUseCase';
import { DomainTagEditor } from '../assets/DomainTagEditor';
import type { PlainTag } from '@/lib/actions/dam/tag.actions';
import { removeTagFromAsset, addTagToAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * AssetDetailsModal - Premium Asset Management Interface
 * 
 * Features a beautiful, modern design with:
 * - Stunning visual hierarchy and spacing
 * - Smooth animations and micro-interactions
 * - Intuitive tag management interface
 * - Professional preview system
 * - Elegant information display
 */

interface AssetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string | null;
  onAssetUpdated?: (asset: AssetDetailsDto) => void;
  onAssetDeleted?: (assetId: string) => void;
}

// Enhanced date formatting with relative time
const formatDate = (date: Date | string): string => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (error) {
    return 'Invalid date';
  }
};

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  open,
  onOpenChange,
  assetId,
  onAssetUpdated,
  onAssetDeleted,
}) => {
  const [asset, setAsset] = useState<AssetDetailsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load asset details when modal opens
  useEffect(() => {
    if (open && assetId) {
      loadAssetDetails();
    } else {
      // Reset state when modal closes
      setAsset(null);
      setEditMode(false);
      setError(null);
    }
  }, [open, assetId]);

  const loadAssetDetails = async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dam/asset/${assetId}?details=true`);
      if (!response.ok) {
        throw new Error('Failed to load asset details');
      }
      const assetData = await response.json();
      setAsset(assetData);
      setEditName(assetData.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalTagAdded = (newlyAddedTag: PlainTag, allCurrentTags: PlainTag[]) => {
    // Optimistically update the local asset state
    setAsset(currentAsset => {
      if (!currentAsset) return null;
      // Ensure newlyAddedTag is not already in the list (edge case from server)
      const tagExists = currentAsset.tags.some(tag => tag.id === newlyAddedTag.id);
      return {
        ...currentAsset,
        tags: tagExists ? currentAsset.tags : [...currentAsset.tags, newlyAddedTag],
      };
    });

    // Optionally, you might still want to re-fetch in the background to ensure consistency
    // or rely on a more sophisticated state management that handles this.
    // For now, we'll just do the optimistic update.
    // loadAssetDetails(); 

    toast.success('Tag added successfully', { 
      description: `"${newlyAddedTag.name}" has been added to this asset.`,
      duration: 3000
    });
  };

  const handleLocalRemoveTag = async (tagToRemove: PlainTag) => {
    if (!asset?.id || !tagToRemove?.id) {
        toast.error('Cannot remove tag', { description: 'Asset ID or Tag ID is missing.' });
        return;
    }
    setIsUpdatingTag(true);
    const formData = new FormData();
    formData.append('assetId', asset.id);
    formData.append('tagId', tagToRemove.id); 

    try {
      const result = await removeTagFromAsset(formData);
      if (result.success) {
        // Optimistically update the local asset state
        setAsset(currentAsset => {
          if (!currentAsset) return null;
          return {
            ...currentAsset,
            tags: currentAsset.tags.filter(tag => tag.id !== tagToRemove.id),
          };
        });
        // loadAssetDetails(); 
        toast.success('Tag removed', { 
          description: `"${tagToRemove.name}" has been removed from this asset.`,
          duration: 3000
        });
      } else {
        toast.error('Failed to remove tag', { description: result.error || 'Please try again.' });
      }
    } catch (e: any) {
      toast.error('Unexpected error', { description: e.message || 'Could not remove tag.' });
    }
    setIsUpdatingTag(false);
  };

  const handleSaveEdit = async () => {
    if (!asset || !editName.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/dam/asset/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update asset');
      }

      await loadAssetDetails();
      setEditMode(false);
      
      if (asset) {
        onAssetUpdated?.(asset);
      }
      
      toast.success('Asset renamed', { 
        description: `Asset has been renamed to "${editName.trim()}".`,
        duration: 3000
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset');
      toast.error('Failed to rename asset', { description: 'Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;

    try {
      const response = await fetch(`/api/dam/asset/${asset.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Failed to delete asset (${response.status})`;
        throw new Error(errorMessage);
      }

      onAssetDeleted?.(asset.id);
      onOpenChange(false);
      toast.success('Asset deleted', { 
        description: 'The asset has been permanently removed.',
        duration: 3000
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
      toast.error('Failed to delete asset', { description: 'Please try again.' });
    }
  };

  const handleDownload = async () => {
    if (!asset?.downloadUrl) return;

    try {
      const link = document.createElement('a');
      link.href = asset.downloadUrl;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started', { 
        description: `"${asset.name}" is downloading.`,
        duration: 3000
      });
    } catch (err) {
      setError('Failed to download asset');
      toast.error('Download failed', { description: 'Please try again.' });
    }
  };

  const handleCopyUrl = async () => {
    if (!asset?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(asset.publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('URL copied', { description: 'Asset URL has been copied to clipboard.' });
    } catch (err) {
      toast.error('Failed to copy URL', { description: 'Please try again.' });
    }
  };

    const getPreviewComponent = () => {    if (!asset || !asset.preview) {
      return (
        <Card className="h-96 border-dashed border-2 border-gray-200">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <FileType size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No preview available</p>
              <p className="text-sm">This file type cannot be previewed</p>
              
            </div>
          </CardContent>
        </Card>
      );
    }

        if (!asset.preview.canPreview) {      return (
        <Card className="h-96 border-dashed border-2 border-gray-200">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <FileType size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Preview not supported</p>
              <p className="text-sm">This file type cannot be previewed</p>
              
            </div>
          </CardContent>
        </Card>
      );
    }

        const previewContent = (() => {
      switch (asset.preview.previewType) {
                case 'image':          return asset.publicUrl && (
            <img
              src={asset.publicUrl}
              alt={asset.name}
              className="w-full h-full object-contain rounded-lg"
              style={{ maxHeight: '100%' }}
            />
          );
                case 'video':          return asset.publicUrl && (
            <video 
              controls 
              src={asset.publicUrl} 
              className="w-full h-full object-contain rounded-lg"
              style={{ maxHeight: '100%' }}
            >
              Your browser does not support the video tag.
            </video>
          );
                case 'audio':          return asset.publicUrl && (            <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />                </svg>              </div>              <div className="w-full max-w-lg">                <audio                   controls                   src={asset.publicUrl}                   className="w-full h-12 bg-white rounded-lg shadow-sm"                  style={{                    filter: 'invert(0)',                    backgroundColor: 'white',                    borderRadius: '0.5rem',                    padding: '0.25rem'                  }}                >                  Your browser does not support the audio element.                </audio>              </div>            </div>          );
                default:          return (
            <div className="text-center text-gray-400">
              <FileType size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Preview not supported</p>
              <p className="text-sm">This file type cannot be previewed</p>
            </div>
          );
      }
    })();

        const isAudioPreview = asset?.preview?.previewType === 'audio';    return (      <Card className="h-96 overflow-hidden group">        <CardContent className="h-full p-0 relative">          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">            {previewContent}          </div>          {/* Overlay for better UX - but not for audio to allow control interaction */}          {!isAudioPreview && (            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />          )}        </CardContent>      </Card>    );
  };

  // Enhanced detail row component
  const DetailRow: React.FC<{ 
    icon: React.ElementType; 
    label: string; 
    value: React.ReactNode;
    className?: string;
  }> = ({ icon: Icon, label, value, className }) => (
    <div className={cn("flex items-start space-x-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-150", className)}>
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
      </div>
    </div>
  );

  if (!open || !assetId) return null;

  // Always render one Dialog; switch content inside to avoid flicker
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {loading ? (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">Loading Asset Details</DialogTitle>
                <DialogDescription className="sr-only">
                  Please wait while we load the asset information and preview.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">Loading asset details...</p>
                  <p className="text-sm text-gray-500">Please wait while we fetch the information</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <DialogHeader className="px-8 py-6 border-b bg-white sticky top-0 z-10">
                {/* Always present DialogTitle for accessibility */}
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
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={updating}
                        placeholder="Asset name"
                      />
                    ) : (
                      null
                    )}
                    <p className="text-sm text-gray-500 mt-1 flex items-center">                  <FolderOpen className="h-4 w-4 mr-1" />                  {asset?.folderName || asset?.folderPath || 'Root'}                </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center space-x-2">
                    {asset && !editMode && (
                      <>
                        {asset.publicUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyUrl}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditMode(true)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {editMode && (
                      <>
                        <Button 
                          onClick={handleSaveEdit} 
                          size="sm" 
                          disabled={updating || !editName.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { 
                            setEditMode(false); 
                            setEditName(asset?.name || ''); 
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
              
              {/* Main content */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - Preview and primary actions */}
                <div className="lg:col-span-2 space-y-6">
                  {getPreviewComponent()}
                  
                  {/* Primary actions */}
                  <div className="flex flex-wrap gap-3">
                    {asset?.downloadUrl && (
                      <Button 
                        onClick={handleDownload} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    )}
                    {asset?.publicUrl && (
                      <Button variant="outline" onClick={handleCopyUrl}>
                        {copiedUrl ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                        {copiedUrl ? 'Copied!' : 'Share'}
                      </Button>
                    )}
                    {asset && (
                      <Button 
                        onClick={() => setDeleteConfirmOpen(true)} 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right column - Details and tags */}
                <div className="space-y-6">
                  {/* Asset information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Info className="mr-2 h-5 w-5 text-gray-500" />
                        Asset Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                      <DetailRow icon={FileType} label="Type" value={asset?.mimeType} />
                      <DetailRow icon={HardDrive} label="Size" value={asset?.humanReadableSize} />
                      <DetailRow icon={Calendar} label="Created" value={asset ? formatDate(asset.createdAt) : 'N/A'} />
                      {asset?.updatedAt && (
                        <DetailRow icon={Clock} label="Modified" value={formatDate(asset.updatedAt)} />
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Tags section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <TagIcon className="mr-2 h-5 w-5 text-gray-500" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current tags */}
                      {(asset?.tags && asset.tags.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                          {asset.tags.map((tag: PlainTag) => (
                            <Badge 
                              key={tag.id} 
                              variant="secondary" 
                              className="text-xs group/badge relative pr-8 py-1.5 hover:bg-gray-200 transition-colors"
                            >
                              {tag.name}
                              <button 
                                onClick={() => !isUpdatingTag && handleLocalRemoveTag(tag)}
                                disabled={isUpdatingTag}
                                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-0.5 hover:bg-red-100 disabled:opacity-50 transition-colors group-hover/badge:opacity-100 opacity-70"
                                aria-label={`Remove tag ${tag.name}`}
                              >
                                {isUpdatingTag ? 
                                  <Loader2 className="h-3 w-3 animate-spin" /> : 
                                  <XIcon className="h-3 w-3 text-gray-500 hover:text-red-600" />
                                }
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic py-2">No tags assigned yet</p>
                      )}
                      
                      {/* Tag editor */}
                      {asset && asset.organizationId && (
                        <div className="pt-2 border-t">
                          <DomainTagEditor 
                            assetId={asset.id} 
                            organizationId={asset.organizationId}
                            currentTags={asset.tags || []}
                            onTagAdded={handleLocalTagAdded} 
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Capabilities */}
                  {asset?.capabilities && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Layers className="mr-2 h-5 w-5 text-gray-500" />
                          Permissions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className={cn("p-2 rounded", asset.capabilities.canRename ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
                            <span className="font-medium">Rename:</span> {asset.capabilities.canRename ? 'Yes' : 'No'}
                          </div>
                          <div className={cn("p-2 rounded", asset.capabilities.canDelete ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
                            <span className="font-medium">Delete:</span> {asset.capabilities.canDelete ? 'Yes' : 'No'}
                          </div>
                          <div className={cn("p-2 rounded", asset.capabilities.canMove ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
                            <span className="font-medium">Move:</span> {asset.capabilities.canMove ? 'Yes' : 'No'}
                          </div>
                          <div className={cn("p-2 rounded", asset.capabilities.isEditable ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500")}>
                            <span className="font-medium">Edit:</span> {asset.capabilities.isEditable ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {asset && (
        <DeleteAssetConfirmation
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          assetName={asset.name}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default AssetDetailsModal; 