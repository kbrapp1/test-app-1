# DAM Actions Test Plan - Build Steps

**Goal:** Add comprehensive tests for the newly modularized DAM action code and related UI components, covering both success and error paths.

**Reference:** Based on the repository's DAM refactor and test coverage recommendations.

## Phase 1: Folder Actions Unit Tests

**Step 1: createFolder**
*   [ ] **Validation:** Empty `name` or whitespace → returns `{ success: false, error: 'Folder name cannot be empty.' }`.
*   [ ] **Auth Guard:** `getActiveOrganizationId()` returns `null` → returns error.
*   [ ] **Supabase Insert Error:** Mock `.from('folders').insert()` to throw → returns that error.
*   [ ] **Success Path:** Mock insert returns new row → returns `{ success: true, folder }`, calls `revalidatePath('/dam')`.

**Step 2: updateFolder**
*   [ ] **Validation:** Missing `folderId` in `FormData` → returns error.
*   [ ] **Validation:** Empty `name` → returns validation error.
*   [ ] **Supabase Update Error:** Mock `.update()` to throw → returns that error.
*   [ ] **Success Path:** Mock update returns updated row → returns `{ success: true, folder }`, calls `revalidatePath('/dam')`.

**Step 3: deleteFolder**
*   [ ] **Validation:** Invalid or missing `folderId` → returns error.
*   [ ] **Supabase Delete Error:** Mock `.delete()` to throw → returns that error.
*   [ ] **Success Path:** Mock delete returns count → returns `{ success: true, folderId, parentFolderId }`, calls `revalidatePath('/dam')`.

## Phase 2: Asset Actions Unit Tests

**Step 4: moveAsset**
*   [ ] **Validation:** Missing `assetId` → returns error.
*   [ ] **Not Found:** Target folder `.single()` returns empty → returns 'not found' error.
*   [ ] **Update Error:** Mock `.update()` to throw → returns that error.
*   [ ] **Success Paths:**
    *   Move into folder → returns `{ success: true }`, calls `revalidatePath('/dam')`.
    *   Move to root (null) → returns `{ success: true }`.

**Step 5: deleteAsset**
*   [ ] **Delete Error:** Mock `.delete()` to throw → returns error.
*   [ ] **Success Path:** Mock delete returns count → returns `{ success: true }`, calls revalidation.

**Step 6: listTextAssets**
*   [ ] **Select Error:** Mock `.select()` to throw → returns `[]` or error (pick behavior).
*   [ ] **MIME Filter:** Returns only text assets matching `DAM_TEXT_MIME_TYPES`.
*   [ ] **Empty Results:** `.select()` returns empty array → returns `[]`.

**Step 7: getAssetContent**
*   [ ] **Not Found:** Mock `.single()` returns empty → returns error.
*   [ ] **Wrong MIME:** Asset MIME not in text list → returns validation error.
*   [ ] **Success Path:** Mock select returns content → returns `{ content, name }`.

**Step 8: updateAssetText**
*   [ ] **Validation:** Empty `content` → returns error.
*   [ ] **Update Error:** Mock `.update()` to throw → returns error.
*   [ ] **Success Path:** Mock update returns count → returns `{ success: true }`, calls revalidation.

**Step 9: saveAsNewTextAsset**
*   [ ] **Validation:** Empty `desiredName` → returns error.
*   [ ] **Auth Error:** Mock `auth.getUser()` error → returns error.
*   [ ] **RPC/Insert Error:** Mock `rpc` or `insert` to throw/no result → returns error + cleanup storage.
*   [ ] **Storage Upload Error:** Mock `.storage.from().upload()` to throw → returns error.
*   [ ] **Success Path:** Mock user, upload, insert → returns `{ success: true, data: { newAssetId } }`, calls revalidation.

**Step 10: getAssetDownloadUrl**
*   [ ] **Public URL Error:** Mock `.storage.from().getPublicUrl()` to throw → returns error.
*   [ ] **Success Path:** Returns `{ success: true, url }`.

## Phase 3: UI Component Integration Tests

**Step 11: NewFolderDialog**
*   [ ] Empty name → shows validation message, no server call.
*   [ ] Successful creation → calls `createFolder`, shows success toast.
*   [ ] Creation error → shows error toast.

**Step 12: RenameFolderDialog**
*   [ ] Empty name → validation error.
*   [ ] Success → calls `updateFolder`, success toast.
*   [ ] Error → error toast.

**Step 13: DeleteFolderDialog**
*   [ ] Confirmation triggers `deleteFolder`.
*   [ ] Success → success toast and navigation.
*   [ ] Failure → error toast.

**Step 14: FolderSidebar**
*   [ ] Successful fetch of children → displays child items.
*   [ ] Fetch error → displays fallback error UI.

**Step 15: AssetSelectorModal**
*   [ ] Loading state.
*   [ ] Empty state when no assets.
*   [ ] Error state on fetch failure.

**Step 16: AssetGrid / AssetGallery**
*   [ ] Move button triggers `moveAsset` and updates UI.
*   [ ] Delete button triggers `deleteAsset` and removes item.

**Step 17: AssetUploader**
*   [ ] Uploading state and progress.
*   [ ] Successful upload refreshes list.
*   [ ] Upload error shows message.

## Phase 4: API Route Tests

**Step 18: GET `/api/dam`**
*   [ ] Mock service layer → returns expected JSON shape.
*   [ ] Error response → returns proper HTTP status and message.

**Step 19: POST `/api/dam/upload`**
*   [ ] Successful file upload → returns new asset metadata.
*   [ ] Invalid file type/size → returns validation error.

## Phase 5: Execution & Cleanup

*   [ ] Run `pnpm test` and address failures.
*   [ ] Remove any placeholder or skipped tests once real tests exist.

**(End of DAM Actions Test Plan)** 