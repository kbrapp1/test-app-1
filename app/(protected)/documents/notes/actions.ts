'use server';

import { revalidatePath } from 'next/cache';
import { ErrorCodes } from '@/lib/errors/constants';
import { checkFeatureAccess } from '@/lib/shared/access-control';
import { Permission } from '@/lib/auth/roles';
import { hasPermission } from '@/lib/auth/authorization';

// Import helpers from the new file
import { getAuthContext, handleDatabaseError, ActionResult } from './helpers';

// Server Action for adding notes 
export async function addNote(prevState: unknown, formData: FormData): Promise<ActionResult> {
    try {
        // AI: Check feature access with permissions
        const accessResult = await checkFeatureAccess('notes', {
            requireAuth: true,
            requireOrganization: true,
            customValidation: async (user) => {
                return hasPermission(user, Permission.CREATE_NOTE);
            }
        });
        
        if (!accessResult.hasAccess) {
            return {
                success: false,
                message: accessResult.error || 'Access denied',
                code: ErrorCodes.UNAUTHORIZED
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        return {
            success: false,
            message: errorMessage,
            code: ErrorCodes.UNAUTHORIZED
        };
    }

    const title = formData.get('title')?.toString();
    const content = formData.get('content')?.toString();
    const defaultColor = 'bg-yellow-200';

    if (!title) {
        return { 
            success: false, 
            message: 'Note title cannot be empty.', 
            code: ErrorCodes.VALIDATION_ERROR 
        };
    }

    const { context, errorResult } = await getAuthContext();
    if (errorResult) return errorResult;
    // Non-null assertion because errorResult is checked
    // We get supabase, user, activeOrgId directly from the context now
    const { supabase, user, activeOrgId } = context!;

    try {
        // Get the highest current position
        const { data: maxPosData, error: maxPosError } = await supabase
            .from('notes')
            .select('position')
            .eq('user_id', user.id)
            .eq('organization_id', activeOrgId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (maxPosError) {
            return handleDatabaseError(maxPosError, 'Note Preparation');
        }
        const nextPosition = (maxPosData?.position ?? -1) + 1;

        // Insert the new note
        const { error: insertError } = await supabase
            .from('notes')
            .insert({
                title: title,
                content: content,
                user_id: user.id,
                organization_id: activeOrgId,
                position: nextPosition,
                color_class: defaultColor
            });

        if (insertError) {
             return handleDatabaseError(insertError, 'Note Saving');
        }
    } catch (dbError) {
        // Catch unexpected errors during DB operations
        return handleDatabaseError(dbError, 'Note Saving (Unexpected)');
    }

    revalidatePath('/documents/notes');
    return { success: true, message: 'Note added successfully.' };
}

// Server Action for deleting notes
export async function deleteNote(prevState: unknown, formData: FormData): Promise<ActionResult> {
    try {
        // AI: Check feature access with permissions
        const accessResult = await checkFeatureAccess('notes', {
            requireAuth: true,
            requireOrganization: true,
            customValidation: async (user) => {
                return hasPermission(user, Permission.DELETE_NOTE);
            }
        });
        
        if (!accessResult.hasAccess) {
            return {
                success: false,
                message: accessResult.error || 'Access denied',
                code: ErrorCodes.UNAUTHORIZED
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        return {
            success: false,
            message: errorMessage,
            code: ErrorCodes.UNAUTHORIZED
        };
    }

    const noteId = formData.get('note_id')?.toString();

    if (!noteId) {
        return { success: false, message: 'Note ID missing.', code: ErrorCodes.VALIDATION_ERROR };
    }

    const { context, errorResult } = await getAuthContext();
    if (errorResult) return errorResult;
    const { supabase, user, activeOrgId } = context!; 

    try {
        const { error: deleteError } = await supabase
            .from('notes')
            .delete()
            .match({ id: noteId, user_id: user.id, organization_id: activeOrgId });

        if (deleteError) {
            return handleDatabaseError(deleteError, 'Note Deletion');
        }
    } catch (dbError) {
         return handleDatabaseError(dbError, 'Note Deletion (Unexpected)');
    }

    revalidatePath('/documents/notes'); 
    return { success: true, message: 'Note deleted.' };
}

// Server Action for editing notes
export async function editNote(prevState: unknown, formData: FormData): Promise<ActionResult> {
    try {
        // AI: Check feature access with permissions
        const accessResult = await checkFeatureAccess('notes', {
            requireAuth: true,
            requireOrganization: true,
            customValidation: async (user) => {
                return hasPermission(user, Permission.UPDATE_NOTE);
            }
        });
        
        if (!accessResult.hasAccess) {
            return {
                success: false,
                message: accessResult.error || 'Access denied',
                code: ErrorCodes.UNAUTHORIZED
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        return {
            success: false,
            message: errorMessage,
            code: ErrorCodes.UNAUTHORIZED
        };
    }

    const noteId = formData.get('note_id')?.toString();
    const newTitle = formData.get('title')?.toString();
    const newContent = formData.get('content')?.toString();
    const newColorClass = formData.get('color_class')?.toString();

    // Basic Validation
    if (!noteId) return { success: false, message: 'Note ID missing.', code: ErrorCodes.VALIDATION_ERROR };
    if (!newTitle) return { success: false, message: 'Note title cannot be empty.', code: ErrorCodes.VALIDATION_ERROR };
    if (newContent === null || newContent === undefined) return { success: false, message: 'Note content missing.', code: ErrorCodes.VALIDATION_ERROR };
    if (!newColorClass) return { success: false, message: 'Color selection missing.', code: ErrorCodes.VALIDATION_ERROR };

    const { context, errorResult } = await getAuthContext();
    if (errorResult) return errorResult;
    const { supabase, user, activeOrgId } = context!;

    try {
        const { error: updateError } = await supabase
            .from('notes')
            .update({
                title: newTitle,
                content: newContent,
                color_class: newColorClass 
                // updated_at handled by trigger
            })
            .match({ id: noteId, user_id: user.id, organization_id: activeOrgId });

        if (updateError) {
            return handleDatabaseError(updateError, 'Note Update');
        }
    } catch (dbError) {
         return handleDatabaseError(dbError, 'Note Update (Unexpected)');
    }

    revalidatePath('/documents/notes');
    return { success: true, message: 'Note updated successfully.' };
}

// Server Action to update note order
export async function updateNoteOrder(orderedNoteIds: string[]): Promise<ActionResult> {
    try {
        // AI: Check feature access with permissions
        const accessResult = await checkFeatureAccess('notes', {
            requireAuth: true,
            requireOrganization: true,
            customValidation: async (user) => {
                return hasPermission(user, Permission.UPDATE_NOTE);
            }
        });
        
        if (!accessResult.hasAccess) {
            return {
                success: false,
                message: accessResult.error || 'Access denied',
                code: ErrorCodes.UNAUTHORIZED
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Access denied';
        return {
            success: false,
            message: errorMessage,
            code: ErrorCodes.UNAUTHORIZED
        };
    }

    if (!Array.isArray(orderedNoteIds)) {
        return { success: false, message: 'Invalid order data.', code: ErrorCodes.VALIDATION_ERROR };
    }
    
    const { context, errorResult } = await getAuthContext();
    if (errorResult) return errorResult;
    const { supabase, user, activeOrgId } = context!;

    // Create an array of objects for the upsert operation
    const updates = orderedNoteIds.map((id, index) => ({
        id: id,
        user_id: user.id, // Include user_id for RLS
        organization_id: activeOrgId,
        position: index   // Set position based on array index
    }));

    try {
        // Use upsert which acts like update here since we provide existing IDs
        const { error } = await supabase
            .from('notes')
            .upsert(updates, { onConflict: 'id' }); // Update based on ID match

        if (error) {
            return handleDatabaseError(error, 'Note Order Update');
        }

        revalidatePath('/documents/notes'); 
        return { success: true, message: 'Note order updated.' };
    } catch (error) {
        return handleDatabaseError(error, 'Note Order Update (Unexpected)');
    }
} 