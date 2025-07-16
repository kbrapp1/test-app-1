import { NextResponse } from 'next/server';

// Error handling utility
export const handleSupabaseError = (error: unknown, status = 500) => {
  console.error('Supabase Error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Database error';
  return NextResponse.json({ error: errorMessage }, { status });
};

// Authentication check utility - MOVED to db-auth.ts

// Generic database query function - MOVED to db-queries.ts

// Insert data utility - MOVED to db-queries.ts

// Delete data utility - MOVED to db-queries.ts

// Generate public URL for storage items - MOVED to db-storage.ts

// Upload file to storage - MOVED to db-storage.ts

// Remove file from storage - MOVED to db-storage.ts 