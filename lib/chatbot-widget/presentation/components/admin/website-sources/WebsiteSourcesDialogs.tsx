/**
 * Website Sources Dialogs Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle confirmation dialogs
 * - Keep under 250 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Delegate actions to parent component
 */

import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { WebsiteSourceDto } from '../../../../application/dto/ChatbotConfigDto';
import { WebsiteSourceFormData } from '../../../actions/websiteSourcesActions';

interface WebsiteSourcesDialogsProps {
  isDeletingSource: string | null;
  isConfirmingAdd: boolean;
  websiteSources: WebsiteSourceDto[];
  formData: WebsiteSourceFormData;
  actionLoading: boolean;
  onConfirmDelete: (sourceId: string) => void;
  onConfirmAdd: () => void;
  onCancelDelete: () => void;
  onCancelAdd: () => void;
}

export function WebsiteSourcesDialogs({ 
  isDeletingSource,
  isConfirmingAdd,
  websiteSources,
  formData,
  actionLoading,
  onConfirmDelete,
  onConfirmAdd,
  onCancelDelete,
  onCancelAdd
}: WebsiteSourcesDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      {isDeletingSource && (
        <AlertDialog open={!!isDeletingSource} onOpenChange={onCancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Confirm Website Source Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this website source?
              </AlertDialogDescription>
              <div className="space-y-3">
                {(() => {
                  const source = websiteSources.find(s => s.id === isDeletingSource);
                  return (
                    <>
                      {source && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-gray-600">{source.url}</div>
                          {source.description && (
                            <div className="text-sm text-gray-500 mt-1">{source.description}</div>
                          )}
                        </div>
                      )}
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Warning</span>
                        </div>
                        <ul className="text-sm text-red-700 mt-1 space-y-1">
                          <li>• All crawled content will be permanently removed</li>
                          <li>• Vector embeddings will be deleted from the knowledge base</li>
                          <li>• This action cannot be undone</li>
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onConfirmDelete(isDeletingSource)}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Website Source
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Add Confirmation Dialog */}
      {isConfirmingAdd && (
        <AlertDialog open={isConfirmingAdd} onOpenChange={onCancelAdd}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Confirm Website Source Addition
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add this website source?
              </AlertDialogDescription>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="font-medium">{formData.name}</div>
                  <div className="text-sm text-gray-600">{formData.url}</div>
                  {formData.description && (
                    <div className="text-sm text-gray-500 mt-1">{formData.description}</div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-gray-500">
                    <div>Max Pages: {formData.maxPages}</div>
                    <div>Max Depth: {formData.maxDepth}</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">What happens next?</span>
                  </div>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Website source will be saved to your configuration</li>
                    <li>• You can crawl it manually to extract content</li>
                    <li>• Content will be added to your chatbot&apos;s knowledge base</li>
                  </ul>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onConfirmAdd}
                className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Website Source
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
} 