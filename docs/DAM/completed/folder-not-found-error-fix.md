# Folder Not Found Error Fix

## Problem Description

Users were encountering the error `Error: Folder with ID [folder-id] not found` when:
- Accessing bookmarked URLs with deleted folder IDs
- Using browser history to navigate to folders that no longer exist
- Following shared links to folders that have been removed

The error was causing the entire page to crash instead of gracefully handling the missing folder.

## Root Cause

The issue occurred in the `NavigateToFolderUseCase` when:
1. A folder ID was provided in the URL
2. The folder was not found in the database (deleted or moved)
3. The use case threw a generic `Error` instead of a domain-specific error
4. The error was not properly caught and handled by the server action

## Solution Implementation

### 1. Domain Error Handling

**Updated `NavigateToFolderUseCase.ts`:**
- Added proper domain error imports (`NotFoundError`, `ValidationError`)
- Changed generic `Error` to `NotFoundError` for missing folders
- Added input validation for organization ID

```typescript
// Before
throw new Error(`Folder with ID ${folderId} not found`);

// After  
throw new NotFoundError(`Folder with ID ${folderId} not found`);
```

### 2. Server Action Error Handling

**Enhanced `navigation.actions.ts`:**
- Added `NotFoundError` import and handling
- Implemented automatic redirect to root when folder not found
- Added fallback error detection for generic error messages
- Returns redirect instructions instead of throwing errors

```typescript
// Handle folder not found - redirect to root
if (error instanceof NotFoundError && folderId) {
  console.warn(`Folder ${folderId} not found, redirecting to root`);
  return { 
    breadcrumbs: [{ id: null, name: 'Root', href: '/dam' }],
    shouldRedirect: true,
    redirectTo: '/dam'
  };
}
```

### 3. Page-Level Redirect Handling

**Updated `app/(protected)/dam/page.tsx`:**
- Added `redirect` import from Next.js
- Implemented server-side redirect when folder not found
- Graceful fallback to root folder

```typescript
// Handle folder not found - redirect to root
if (navigationResult.shouldRedirect && navigationResult.redirectTo) {
  redirect(navigationResult.redirectTo);
}
```

### 4. Repository Improvements

**Enhanced `SupabaseFolderRepository.ts`:**
- Added input validation for empty IDs
- Improved logging for debugging
- Better error context in log messages

### 5. Client-Side Error Boundaries

**Created `DamErrorBoundary.tsx`:**
- React error boundary for catching JavaScript errors
- User-friendly error messages
- Retry and navigation options
- Development mode error details

**Created `FolderNotFoundHandler.tsx`:**
- Specific component for folder not found scenarios
- Automatic redirect with countdown
- Manual navigation options

## User Experience Improvements

### Before Fix
- Page crashed with technical error message
- Users stuck on error page
- No recovery options
- Poor user experience

### After Fix
- Automatic redirect to root folder
- User-friendly error messages
- Multiple recovery options (retry, go home)
- Graceful degradation
- Proper logging for debugging

## Error Flow

1. **User accesses deleted folder URL** → `/dam?folderId=deleted-folder-id`
2. **Server action detects missing folder** → `NavigateToFolderUseCase` throws `NotFoundError`
3. **Error caught by action** → Returns redirect instruction
4. **Page handles redirect** → Automatically redirects to `/dam`
5. **User lands on root folder** → Clean experience, no error visible

## Fallback Mechanisms

1. **Primary**: Server-side redirect via `navigation.actions.ts`
2. **Secondary**: Client-side error boundary via `DamErrorBoundary`
3. **Tertiary**: Repository-level validation and logging
4. **Quaternary**: Manual navigation options in error UI

## Testing

The fix handles these scenarios:
- Direct URL access to deleted folders
- Bookmarked URLs with invalid folder IDs
- Browser history navigation to removed folders
- Shared links to non-existent folders
- Network errors during folder lookup

## Benefits

- **Improved UX**: No more crashes, smooth recovery
- **Better SEO**: Proper redirects instead of error pages
- **Debugging**: Enhanced logging for troubleshooting
- **Maintainability**: Domain-driven error handling
- **Resilience**: Multiple fallback mechanisms

## Files Modified

- `lib/dam/application/use-cases/NavigateToFolderUseCase.ts`
- `lib/dam/application/actions/navigation.actions.ts`
- `app/(protected)/dam/page.tsx`
- `lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository.ts`
- `lib/dam/presentation/components/error/DamErrorBoundary.tsx` (new)
- `lib/dam/presentation/components/error/FolderNotFoundHandler.tsx` (new)
- `lib/dam/presentation/components/error/index.ts` (new)
- `lib/dam/presentation/components/workspace/DamWorkspaceView.tsx`

## Architecture Compliance

The fix follows DDD principles:
- Domain errors (`NotFoundError`) instead of generic errors
- Proper error handling in application layer
- Clean separation of concerns
- User-friendly presentation layer
- Robust infrastructure layer 