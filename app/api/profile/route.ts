/**
 * Authenticated Next.js API route handlers for managing user profiles stored in Supabase.
 * Handles GET requests to retrieve the user's profile and PUT requests to update it,
 * using middleware for authentication and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User } from '@supabase/supabase-js';
import { queryData, insertData } from '@/lib/supabase/db-queries';
import { handleSupabaseError } from '@/lib/supabase/db';
import { withErrorHandling } from '@/lib/middleware/error';
import { NotFoundError, DatabaseError, ValidationError } from '@/lib/errors/base';

// Handler for GET requests - retrieves user profile
async function getHandler(
  req: NextRequest,
  user: User,
  supabase: any
) {
  const { data, error } = await queryData(
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
  supabase: any
) {
  const body = await req.json();
    
  const allowedFields = ['username', 'full_name', 'avatar_url', 'website', 'bio'];
  const profileData: Record<string, any> = {};
    
  allowedFields.forEach(field => {
    if (field in body) {
      profileData[field] = body[field];
    }
  });
    
  if (Object.keys(profileData).length === 0) {
    throw new ValidationError('No valid fields to update');
  }
    
  const { data, error } = await insertData(
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
export const GET = withErrorHandling(withAuth(getHandler));
export const PUT = withErrorHandling(withAuth(putHandler)); 