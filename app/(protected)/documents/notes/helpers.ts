'use server';

import { createClient } from '@/lib/supabase/server';
import { ErrorCodes } from '@/lib/errors/constants';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { User, SupabaseClient } from '@supabase/supabase-js';

// Type for Server Action Response (consider moving to a shared types file if used elsewhere)
export interface ActionResult {
    success: boolean;
    message: string;
    code?: string;
}

// Internal interface for auth context
export interface AuthContext {
    supabase: SupabaseClient;
    user: User;
    activeOrgId: string;
}

// Helper to get authenticated Supabase client, user, and active org ID
export async function getAuthContext(): Promise<{ context: AuthContext | null, errorResult: ActionResult | null }> {
    const supabase = createClient();
    let user: User;
    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            console.error('Auth Error:', userError?.message || 'User not found');
            return { 
                context: null, 
                errorResult: { 
                    success: false, 
                    message: 'Authentication error. Please log in again.', 
                    code: ErrorCodes.UNAUTHORIZED 
                } 
            };
        }
        user = userData.user;
    } catch (error) {
        console.error('Unexpected Auth Error:', error);
        return { 
            context: null, 
            errorResult: { 
                success: false, 
                message: 'Could not verify authentication. Please try again.', 
                code: ErrorCodes.UNEXPECTED_ERROR 
            } 
        };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
        return { 
            context: null, 
            errorResult: {
                success: false,
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            } 
        };
    }

    return { context: { supabase, user, activeOrgId }, errorResult: null };
}

// Helper to handle database errors consistently
export async function handleDatabaseError(error: unknown, context: string): Promise<ActionResult> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Database Error (${context}):`, errorMessage);
    
    // Basic check for Supabase PostgrestError structure
    const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
    const message = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : '';

    const code = message.includes('timeout') 
        ? ErrorCodes.DATABASE_TIMEOUT 
        : errorCode === '23505' // Handle unique constraint violation
            ? ErrorCodes.DUPLICATE_ENTRY
            : ErrorCodes.DATABASE_ERROR;
            
    const userMessage = code === ErrorCodes.DUPLICATE_ENTRY
        ? 'A similar item already exists or conflicts with existing data.'
        : `Failed during ${context.toLowerCase()}. Please try again.`;
        
    return { success: false, message: userMessage, code: code };
} 