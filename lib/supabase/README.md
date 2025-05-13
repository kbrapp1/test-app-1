# Supabase Utility Functions

This directory contains utility functions for interacting with Supabase services in a consistent and reusable way.

## Available Files

1. `server.ts` - Creates a Supabase server client with cookie handling for server components and API routes
2. `client.ts` - Creates a Supabase browser client for client components
3. `db.ts` - Provides utility functions for common database and storage operations
4. `auth-middleware.ts` - Higher-order function for adding authentication to API routes

## Using the Utilities

### Authentication

```typescript
import { createClient } from '@/lib/supabase/server';
import { checkAuth } from '@/lib/supabase/db-auth';

// In an API route or server component
const supabase = createClient();
const { authenticated, user, error } = await checkAuth(supabase);

if (!authenticated) {
  // Handle unauthenticated user
}
```

### Authentication Middleware

```typescript
import { withAuth } from '@/lib/supabase/auth-middleware';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';

// Define your handler function that requires authentication
async function yourHandler(req: NextRequest, user: User, supabase: any) {
  // Your authenticated API route logic here
  // The user and supabase client are automatically provided
  
  return NextResponse.json({ data: 'Your data' });
}

// For regular authenticated routes
export const GET = withAuth(yourHandler);

// For routes requiring specific roles
export const POST = withAuth(yourHandler, { 
  requiredRole: 'admin',
  unauthorizedMessage: 'Admin access required'
});

// For public routes that still need the Supabase client
export const DELETE = withAuth(yourHandler, { requireAuth: false });
```

This pattern handles:
- Creating the Supabase client
- Verifying user authentication
- Role-based access control
- Standardized error responses
- Passing the authenticated user to your handler

### Database Operations

```typescript
import { createClient } from '@/lib/supabase/server';
import { queryData, insertData, deleteData } from '@/lib/supabase/db-queries';

// Query data with filters
const { data: folders, error } = await queryData(
  supabase,
  'folders',
  'id, name, parent_folder_id',
  {
    matchColumn: 'parent_folder_id',  // Optional filter column
    matchValue: 'some-id',            // Optional filter value
    isNull: 'parent_folder_id',       // Optional IS NULL filter
    userId: user.id,                  // Optional user_id filter
    orderBy: 'name',                  // Optional order by column
    ascending: true,                  // Optional order direction
    limit: 10                         // Optional limit
  }
);

// Insert data
const { data: newRecord, error: insertError } = await insertData(
  supabase,
  'table_name',
  {
    user_id: user.id,
    name: 'New Item',
    // ... other fields
  }
);

// Delete data
const { success, error: deleteError } = await deleteData(
  supabase,
  'table_name',
  'id',
  recordId
);
```

### Storage Operations

```typescript
import { createClient } from '@/lib/supabase/server';
import { uploadFile, removeFile, getPublicUrl } from '@/lib/supabase/db-storage';

// Upload a file
const { path, error: uploadError } = await uploadFile(
  supabase,
  'bucket_name',
  'path/file.png',
  fileObject
);

// Remove a file
const { success, error: removeError } = await removeFile(
  supabase,
  'bucket_name',
  'path/file.png'
);

// Get public URL for a file
const url = getPublicUrl(supabase, 'bucket_name', 'path/file.png');
```

### Error Handling

```typescript
import { handleSupabaseError } from '@/lib/supabase/db';
import { NextResponse } from 'next/server';

// In an API route
export async function GET() {
  const { data, error } = await queryData(/* ... */);
  
  if (error) {
    return handleSupabaseError(error);
    // Returns a NextResponse with JSON error and appropriate status code
  }
  
  return NextResponse.json(data);
}
```

## Best Practices

1. Always use these utilities instead of direct Supabase calls to ensure consistent error handling and query patterns
2. Check authentication before performing database operations
3. Provide meaningful error messages when handling errors
4. Use proper type definitions with the generic parameters in queryData and insertData 

## Testing Considerations

When testing routes that use the authentication middleware, you'll need to properly mock the middleware. Here's an approach:

```typescript
// Mock the authentication middleware
vi.mock('@/lib/supabase/auth-middleware', () => {
  return {
    withAuth: (handler: any) => {
      return async (req: any) => {
        // For authentication test
        if (req.headers.get('x-test-auth') === 'fail') {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        // Otherwise call the handler with mocked user and client
        const mockUser = { id: 'test-user-id' } as User;
        return handler(req, mockUser, getMockSupabase());
      }
    }
  };
});

// Then in your tests:
it('should handle authentication failure', async () => {
  const headers = new Headers();
  headers.set('x-test-auth', 'fail');
  
  const request = new Request('https://example.com/api/your-route', { 
    headers 
  }) as unknown as NextRequest;
  
  const response = await YOUR_HANDLER(request);
  expect(response.status).toBe(401);
});
```

**Note about current tests:** Several tests in the API routes have been modified to work with the auth middleware, but some complex tests have been skipped and need updating in the future. 