import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type QueryOptions = {
  matchColumn?: string;
  matchValue?: string | null;
  isNull?: string;
  userId?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

// Error handling utility
export const handleSupabaseError = (error: any, status = 500) => {
  console.error('Supabase Error:', error);
  return NextResponse.json({ error: error.message || 'Database error' }, { status });
};

// Authentication check utility
export const checkAuth = async (supabase: SupabaseClient) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { authenticated: false, user: null, error: userError };
  }
  
  return { authenticated: true, user, error: null };
};

// Generic database query function
export const queryData = async <T = any>(
  supabase: SupabaseClient,
  table: string,
  selectFields: string,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: any }> => {
  try {
    let query = supabase.from(table).select(selectFields);
    
    // Apply filters
    if (options.matchColumn && options.matchValue !== undefined) {
      query = query.eq(options.matchColumn, options.matchValue);
    }
    
    if (options.isNull) {
      query = query.is(options.isNull, null);
    }
    
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.ascending ?? true 
      });
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    return { data: data as T[] | null, error };
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
    return { data: null, error };
  }
};

// Insert data utility
export const insertData = async <T = any>(
  supabase: SupabaseClient,
  table: string,
  data: Record<string, any>
): Promise<{ data: T | null; error: any }> => {
  try {
    const { data: result, error } = await supabase.from(table).insert(data);
    return { data: result ? result[0] as T : null, error };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
};

// Delete data utility
export const deleteData = async (
  supabase: SupabaseClient,
  table: string,
  matchColumn: string,
  matchValue: string | number
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase.from(table).delete().eq(matchColumn, matchValue);
    return { success: !error, error };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { success: false, error };
  }
};

// Generate public URL for storage items
export const getPublicUrl = (
  supabase: SupabaseClient,
  bucket: string,
  path: string
): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '/placeholder.png';
};

// Upload file to storage
export const uploadFile = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string | null; error: any }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    return { path: data?.path || null, error };
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return { path: null, error };
  }
};

// Remove file from storage
export const removeFile = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    return { success: !error && !!data, error };
  } catch (error) {
    console.error(`Error removing from ${bucket}:`, error);
    return { success: false, error };
  }
}; 