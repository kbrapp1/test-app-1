/**
 * Authenticated Next.js API route handlers for managing user profiles stored in Supabase.
 * Handles GET requests to retrieve the user's profile and PUT requests to update it,
 * using middleware for authentication and error handling.
 * 
 * AI INSTRUCTIONS:
 * - Profiles are USER-SCOPED, not organization-scoped
 * - Use SystemQueryOptions for user profile operations
 * - User profiles exist across organizations (same user, multiple orgs)
 * - Follow golden-rule security patterns for different data scopes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { queryDataSystem, insertDataSystem } from '@/lib/supabase/db-queries';
import { withErrorHandling } from '@/lib/middleware/error';
import { NotFoundError, DatabaseError, ValidationError } from '@/lib/errors/base';

// AI: Define interface for profile data with explicit types
interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  bio?: string;
}

// Handler for GET requests - retrieves user profile
async function getHandler(
  req: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  // AI: Use system query for user-scoped data (profiles are not organization-scoped)
  const { data, error } = await queryDataSystem(
    supabase,
    'profiles',
    'id, username, full_name, avatar_url, website, bio',
    {
      matchColumn: 'id',
      matchValue: user.id
    }
  );

  if (error) {
    throw new DatabaseError(error.message || 'Failed to query profile');
  }

  if (!data || data.length === 0) {
    throw new NotFoundError('Profile not found');
  }

  return NextResponse.json(data[0]);
}

// Handler for PUT requests - updates user profile
async function putHandler(
  req: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  const body = await req.json();
    
  const allowedFields: (keyof ProfileUpdateData)[] = ['username', 'full_name', 'avatar_url', 'website', 'bio'];
  const profileData: ProfileUpdateData = {};
    
  allowedFields.forEach(field => {
    if (field in body) {
      profileData[field] = body[field];
    }
  });
    
  if (Object.keys(profileData).length === 0) {
    throw new ValidationError('No valid fields to update');
  }
    
  // AI: Use system insert for user-scoped data (profiles are not organization-scoped)
  const { data, error } = await insertDataSystem(
    supabase,
    'profiles',
    {
      id: user.id,
      ...profileData,
      updated_at: new Date().toISOString()
    }
  );

  if (error) {
    throw new DatabaseError(error.message || 'Failed to update profile');
  }

  return NextResponse.json({
    message: 'Profile updated successfully',
    data
  });
}

// Wrap the authenticated handler with the error handler
export const GET = withErrorHandling(withAuth(getHandler as any) as any);
export const PUT = withErrorHandling(withAuth(putHandler as any) as any); 