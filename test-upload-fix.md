# Upload Error Fix

## Issue
The upload functionality was throwing `Error: [object Object]` due to improper error handling.

## Root Causes Found

1. **Frontend Error Handling**: The `useAssetUpload` hook was trying to use error objects as strings
2. **Missing Import**: `AssetQueryExecutor` was missing the crypto import
3. **Type Mismatch**: `UploadAssetUseCase` was passing `Asset` entity instead of `CreateAssetData` to repository

## Fixes Applied

### 1. Fixed Frontend Error Handling
In `lib/dam/presentation/hooks/useAssetUpload.ts`:
- Added proper error object handling to extract message from structured error responses
- Now handles both string and object error formats

### 2. Fixed Missing Import
In `lib/dam/infrastructure/persistence/supabase/services/AssetQueryExecutor.ts`:
- Added missing `crypto` import
- Fixed import syntax to use namespace import

### 3. Fixed Type Mismatch
In `lib/dam/application/use-cases/UploadAssetUseCase.ts`:
- Changed to pass `CreateAssetData` object instead of `Asset` entity to repository
- Removed unused `AssetFactory` import
- Fixed crypto import syntax

### 4. Improved Error Handling
- Added better error messages in `AssetQueryExecutor.executeSave()`
- Added cleanup logic in `UploadAssetUseCase` to remove uploaded files if database save fails

## Testing
- Development server is running on localhost:3000
- Upload functionality should now work properly with clear error messages 