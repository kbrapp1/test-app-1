import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from './server';
import { checkAuth } from './db';

export type AuthenticatedHandler = (
  req: NextRequest,
  user: User,
  supabase: SupabaseClient
) => Promise<NextResponse>;

export type AuthOptions = {
  requireAuth: boolean;
  requiredRole?: string;
  unauthorizedMessage?: string;
};

const defaultOptions: AuthOptions = {
  requireAuth: true,
  unauthorizedMessage: 'Authentication required',
};

/**
 * Higher-order function that wraps an API route handler with authentication
 * 
 * @param handler The handler function to wrap
 * @param options Authentication options
 * @returns A wrapped handler with authentication
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: Partial<AuthOptions> = {}
) {
  const opts = { ...defaultOptions, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    // Create Supabase client
    const supabase = createClient();

    // Skip auth check if not required
    if (!opts.requireAuth) {
      return handler(req, null as unknown as User, supabase);
    }

    // Verify authentication
    const { authenticated, user, error } = await checkAuth(supabase);

    // Handle authentication failure
    if (!authenticated || !user) {
      console.warn('Authentication failed:', error?.message || 'No user found');
      return NextResponse.json(
        { error: opts.unauthorizedMessage }, 
        { status: 401 }
      );
    }

    // Check for required role if specified
    if (opts.requiredRole && user.app_metadata?.role !== opts.requiredRole) {
      console.warn(`User ${user.id} lacks required role: ${opts.requiredRole}`);
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Call the handler with authenticated user
    return handler(req, user, supabase);
  };
} 