import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { DatabaseError } from '@/lib/errors/base';
import { logger } from '@/lib/logging';

// Error handling utility
export const handleSupabaseError = (error: any, status = 500) => {
  console.error('Supabase Error:', error);
  return NextResponse.json({ error: error.message || 'Database error' }, { status });
};

// Authentication check utility - MOVED to db-auth.ts

// Generic database query function - MOVED to db-queries.ts

// Insert data utility - MOVED to db-queries.ts

// Delete data utility - MOVED to db-queries.ts

// Generate public URL for storage items - MOVED to db-storage.ts

// Upload file to storage - MOVED to db-storage.ts

// Remove file from storage - MOVED to db-storage.ts 