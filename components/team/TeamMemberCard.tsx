/**
 * Team Member Card Component
 * 
 * AI INSTRUCTIONS:
 * - Displays team member with hover image effect
 * - Shows edit/delete actions based on permissions
 * - Fail-secure rendering (hide actions if no permission)
 * - Single responsibility: display and basic actions
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { TeamMember } from '@/types/team';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { useTeamMemberPermissions } from '@/lib/shared/access-control/hooks/usePermissions';
import { deleteTeamMember } from '@/lib/auth';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // AI: Check permissions for actions
  const { canUpdate, canDelete, isLoading } = useTeamMemberPermissions();
  
  // AI: Show actions if user has any management permissions
  const hasAnyActions = canUpdate || canDelete;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTeamMember(member.id);
      if (result.success) {
        toast.success('Team member deleted successfully');
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || 'Failed to delete team member');
      }
    } catch (_error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // AI: Placeholder for edit functionality
    toast.info('Edit functionality coming soon');
  };

  return (
    <div className="relative group">
      <div className="w-full overflow-hidden rounded-tr-[4rem]">
        <AspectRatio ratio={1} className="group relative bg-muted">
          <Image
            src={member.primary_image_url}
            alt={`Photo of ${member.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 object-cover object-top transition-all duration-500 ease-in-out grayscale group-hover:grayscale-0"
            priority={true}
          />
          <Image
            src={member.secondary_image_url}
            alt={`Hover photo of ${member.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 object-cover object-top transition-opacity duration-500 ease-in-out grayscale group-hover:grayscale-0 opacity-0 group-hover:opacity-100"
            priority={true} 
          />
          
          {/* AI: Actions overlay - only show if user has permissions */}
          {!isLoading && hasAnyActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdate && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </AspectRatio>
      </div>
      
      <div className="pt-3">
        <h3 className="text-lg font-bold uppercase tracking-wide">{member.name}</h3>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{member.title}</p>
      </div>

      {/* AI: Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {member.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 