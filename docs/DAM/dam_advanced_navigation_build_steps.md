# DAM Advanced Navigation - Build Steps

**Goal:** Improve DAM navigation by integrating a persistent folder tree sidebar, adding an 'Up a Level' button, and potentially a root droppable zone for easier asset organization.

**Reference Components:**
*   Main application layout (for sidebar integration)
*   `components/dam/AssetGalleryClient.tsx`
*   `components/dam/dam-breadcrumbs.tsx`
*   `app/(protected)/dam/page.tsx` (and its layout `app/(protected)/dam/layout.tsx`)

## Phase 1: Persistent Folder Tree Sidebar

**Step 1: Design Sidebar Integration**
*   [x] **Decision:** Determine how the folder tree sidebar will be displayed. It's integrated in the DAM layout as a persistent sidebar.
*   [x] **Component Choice:** A custom recursive tree (`FolderSidebar` and `FolderItem`) is implemented using Zustand store and hooks.
*   [x] **Data Fetching:** Root folders fetched in layout; children fetched lazily in `FolderItem` via `useFolderFetch` and store.

**Step 2: Create/Integrate Folder Tree Component**
*   [x] **File:** `FolderSidebar` and `FolderItem` exist under `components/dam/`, no `DamFolderTree` file name needed.
*   [x] **Code:** Recursive rendering in `FolderItem` with expand/collapse, active highlight, and navigation links.
*   [x] **Styling:** Styled with padding, icons, hover and active states for clarity.
*   [x] **Integration:** Added to `app/(protected)/dam/layout.tsx` as a persistent sidebar.
*   [x] **Testing:** Unit tests in `folder-sidebar.test.tsx` and `FolderItem` tests cover display and navigation.

**Step 3: Synchronization with Main View**
*   [x] **State Management:** `FolderSidebar` derives `currentFolderId` from URL params, folder store highlights active node automatically.
*   [x] **Prop Drilling / Context API:** Synchronization via Zustand store and URL searchParams; no extra context layers needed.
*   [x] **Testing:** Manual and unit tests ensure breadcrumbs, folder clicks, and sidebar remain in sync.

**Step 4: Drag-and-Drop to Sidebar Folders (Advanced)**
*   [ ] **DND:** Make folder nodes in the `DamFolderTree.tsx` droppable targets for assets.
*   [ ] **Logic:** Extend `handleDragEnd` in `AssetGalleryClient.tsx` (or a shared DND handler) to support dragging assets from the main grid onto folders in the sidebar tree.
*   [ ] **Feedback:** Provide visual feedback when dragging over and dropping onto sidebar folders.
*   [ ] **Testing:** Test dragging assets from the asset grid to various folders in the sidebar.

## Phase 2: "Up a Level" Navigation

**Step 5: Add "Up a Level" Button**
*   [ ] **File:** Modify `app/(protected)/dam/page.tsx` or `components/dam/dam-breadcrumbs.tsx`.
*   [ ] **UI:** Add an "Up" button (e.g., using an arrow icon) near the breadcrumbs or main controls when viewing a subfolder.
*   [ ] **Logic:** The button should navigate to the parent of the `currentFolderId`.
    *   The parent folder ID might need to be fetched if not already available (e.g., as part of breadcrumb data or current folder details).
*   [ ] **Visibility:** The button should be hidden or disabled when at the root level.
*   [ ] **Testing:**
    *   Verify the "Up" button appears in subfolders and navigates correctly.
    *   Verify it's hidden/disabled at the root.

## Phase 3: Root Droppable Zone (Optional)

**Step 6: Implement Root Droppable Zone**
*   [ ] **UI Element:** Designate an area (e.g., the breadcrumb area when at root, or a specific static element) as a droppable zone for moving assets to the root (i.e., setting their `folder_id` to `null`).
*   [ ] **File:** Likely modify `AssetGalleryClient.tsx` to include this droppable zone if it's within its DND context, or `app/(protected)/dam/page.tsx` if it's higher up.
*   [ ] **DND:** Use `useDroppable` for this zone.
*   [ ] **Logic:** Update `handleDragEnd` to recognize this root drop target and call `moveAsset(assetId, null)`.
*   [ ] **Testing:** Test dragging assets from within folders to this root droppable zone.

## Phase 4: Integration and Testing

**Step 7: Test All Navigation Features Together**
*   [ ] **Holistic Testing:** Ensure sidebar navigation, breadcrumb navigation, folder chip navigation, and the "Up" button all work cohesively.
*   [ ] **DND Integrity:** Test all DND interactions (asset to folder chip, asset to sidebar folder, asset to root zone) thoroughly.
*   [ ] **Edge Cases:** Test with deeply nested folders, empty folders, etc.
*   [ ] **Testing:** Verify that the URL updates correctly with `folderId` query parameter for all navigation methods.

**(End of DAM Advanced Navigation: DAM navigation is more flexible and powerful with an integrated folder tree and improved navigational aids.)** 