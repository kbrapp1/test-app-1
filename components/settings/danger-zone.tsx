'use client'; // AlertDialog uses hooks

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

// Placeholder component for Danger Zone settings (e.g., Delete Account)
export function DangerZone() {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // !!! IMPORTANT: Implement actual account deletion logic here !!!
      // This would typically involve calling a Supabase function or API endpoint
      // that handles the deletion securely on the server-side.
      // Example (conceptual):
      // const { error } = await supabase.rpc('delete_user_account');
      // if (error) throw error;

      // Simulate async operation for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({ title: "Account Deletion", description: "Account deletion process initiated (placeholder)." });
      // If successful, likely redirect or update UI state
      // router.push('/goodbye'); // Example redirect

    } catch (error: unknown) {
      console.error('Failed to delete account (placeholder):', error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete account. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-destructive rounded-md p-4 space-y-4">
      <div>
        <h2 className="text-lg font-medium text-destructive mb-1">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Actions in this section are irreversible. Please proceed with caution.
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {/* Action calls the delete handler */}
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Yes, delete account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
} 