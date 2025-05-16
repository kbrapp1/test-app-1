# DAM Performance & UX at Scale - Build Steps

**Goal:** Ensure the DAM performs well and maintains a good user experience, especially when dealing with a large number of folders and assets. This involves optimizing data loading, rendering, and expanding optimistic updates.

**Reference Components:**
*   `components/dam/AssetGalleryClient.tsx`
*   `components/dam/AssetGrid.tsx` (already uses virtualization for assets)
*   `components/dam/FolderListItem.tsx`
*   `/api/dam` endpoint and related Supabase functions.
*   Server actions in `lib/actions/dam/`.

## Phase 1: Optimizing Folder Data & Rendering

**Step 1: Lazy Loading for Folder Item Counts (If Implemented)**
*   **Context:** This assumes Folder Item Counts from `dam_enhanced_visuals_build_steps.md` are implemented and potentially causing performance issues.
*   [ ] **Problem Assessment:** Profile initial load time of `AssetGalleryClient.tsx` when many folders are present and item counts are fetched eagerly.
*   [ ] **Strategy:** If performance is impacted:
    *   [ ] Option A: Fetch initial folder data without counts. Then, for folders visible in the viewport, fetch their counts individually or in small batches.
    *   [ ] Option B: Optimize the backend query to calculate counts more efficiently, perhaps with summary tables or optimized SQL.
*   [ ] **Implementation:** Modify data fetching in `AssetGalleryClient.tsx` or `FolderListItem.tsx` based on the chosen strategy.
*   [ ] **Testing:** Compare performance before and after. Ensure counts still load correctly.

**Step 2: Virtualization for Folder List (If Many Folders at One Level)**
*   **Context:** If a single directory level can contain hundreds or thousands of subfolders, rendering them all with `flex-wrap` can lead to performance degradation.
*   [ ] **Problem Assessment:** Test DAM performance with a large number of folders in a single directory view.
*   [ ] **Strategy:** If slow, implement virtualization for the folder list similar to how `AssetGrid.tsx` uses `react-window` (or `TanStack Virtual`) for assets.
    *   This would involve calculating row/column layouts for the folder chips if they are to remain in a grid-like `flex-wrap` appearance but virtualized, or switch to a simple virtualized list for very high numbers.
*   [ ] **File:** Modify the folder rendering section in `AssetGalleryClient.tsx`.
*   [ ] **Implementation:** Integrate a virtualization library for the `folders.map(...)` part.
    *   Adjust `FolderListItem.tsx` if necessary to work smoothly with the virtualization library (e.g., passing style props).
*   [ ] **Testing:** Verify performance improvement with a large number of folders. Ensure all folders are accessible and DND still works if applicable to virtualized items.

## Phase 2: Expanding Optimistic Updates

**Step 3: Optimistic Updates for Folder Creation**
*   [ ] **Context:** Currently, after creating a folder, the UI likely waits for `onDataChange` to show the new folder.
*   [ ] **Action:** `createFolder` in `lib/actions/dam/folder.actions.ts`.
*   [ ] **Strategy:** When `createFolder` is called (e.g., from a "New Folder" dialog):
    *   [ ] On successful *initiation* (before server confirms success but after client-side validation), optimistically add a placeholder new folder to the `allItems` state in `AssetGalleryClient.tsx`.
    *   [ ] The server action should return the created folder data.
    *   [ ] On server success, replace the placeholder with the actual folder data (or simply let `onDataChange` handle the final state).
    *   [ ] On server failure, remove the placeholder and show an error toast.
*   [ ] **Implementation:** Modify the UI component that triggers folder creation and `AssetGalleryClient.tsx`.
*   [ ] **Testing:** Verify new folders appear instantly (optimistically) and are then confirmed/updated or removed on error.

**Step 4: Optimistic Updates for Rename (Folders & Assets)**
*   [ ] **Context:** Similar to creation, renaming might currently rely on `onDataChange`.
*   [ ] **Actions:** `updateFolder` and a potential new `updateAssetMetadata` (for renaming assets) action.
*   [ ] **Strategy:** When a rename dialog is submitted:
    *   [ ] Optimistically update the `name` property of the item in the `allItems` state in `AssetGalleryClient.tsx`.
    *   [ ] On server success, the optimistic state is correct (or let `onDataChange` confirm).
    *   [ ] On server failure, revert the name in `allItems` and show an error.
*   [ ] **Implementation:** Modify rename dialog submission logic and `AssetGalleryClient.tsx`.
*   [ ] **Testing:** Verify items rename instantly in the UI.

**Step 5: Optimistic Updates for Deletion (Refine for Folders)**
*   [ ] **Context:** Asset deletion in `AssetGridItem.tsx` (via `AssetThumbnail`) might already have some optimistic behavior. Folder deletion (`deleteFolder` action) is newer.
*   [ ] **Strategy:** For folder deletion (via context menu in `FolderListItem.tsx`):
    *   [ ] On delete confirmation, optimistically filter out the folder from `allItems` in `AssetGalleryClient.tsx` (similar to how `optimisticallyHiddenItemId` works for moved assets, but make it a permanent filter for delete).
    *   [ ] On server success, the optimistic state is correct.
    *   [ ] On server failure, add the folder back to `allItems` (if possible, or at least trigger `onDataChange`) and show an error.
*   [ ] **Implementation:** Modify folder deletion logic in `FolderListItem.tsx` (handler) and `AssetGalleryClient.tsx` (state update).
*   [ ] **Testing:** Verify folders disappear instantly on delete confirmation.

## Phase 3: Backend Performance & General UX

**Step 6: Review and Optimize Backend Queries**
*   [ ] **Database:** Analyze expensive queries related to DAM operations, especially `get_folder_contents_and_assets` (or its equivalent) when filters, sorting, and counts are applied.
*   [ ] **Supabase:** Use `EXPLAIN ANALYZE` in Supabase SQL editor to understand query plans.
*   [ ] **Indexing:** Ensure proper database indexes are in place for all frequently queried and filtered columns (`folder_id`, `organization_id`, `user_id`, `name`, `mime_type`, `created_at`, `size`).
*   [ ] **Testing:** Monitor query performance via Supabase dashboard or logging, especially under load.

**Step 7: Consistent Loading/Empty/Error States**
*   [ ] **Review:** Ensure all parts of the DAM UI (`AssetGalleryClient`, `AssetGrid`, folder list) have consistent and clear loading spinners, empty state messages (e.g., "No folders here", "No assets match your search"), and error displays.
*   [ ] **Implementation:** Refine components as needed to provide this consistent feedback.
*   [ ] **Testing:** Manually trigger these states (e.g., by temporarily breaking API, searching for non-existent items, viewing empty folders).

**(End of DAM Performance & UX at Scale: The DAM remains responsive and user-friendly even with large datasets, due to optimized data handling and expanded optimistic updates.)** 