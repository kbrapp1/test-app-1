# DAM Advanced Navigation - Build Steps

**Goal:** Improve DAM navigation by integrating a persistent folder tree sidebar, adding an 'Up a Level' button, and potentially a root droppable zone for easier asset organization.

**Reference Components:**
*   Main application layout (for sidebar integration)
*   `components/dam/AssetGalleryClient.tsx`
*   `components/dam/dam-breadcrumbs.tsx`
*   `app/(protected)/dam/page.tsx` (and its layout `app/(protected)/dam/layout.tsx`)

## Phase 1: Persistent Folder Tree Sidebar

**Step 1: Design Sidebar Integration**
*   [ ] **Decision:** Determine how the folder tree sidebar will be displayed. Is it always visible on DAM pages, or toggleable? The screenshot suggests it's part of a main layout.
*   [ ] **Component Choice:** Decide whether to build a custom tree component or use a library. For a custom approach, recursive rendering of folder items will be needed.
*   [ ] **Data Fetching:** Plan how to fetch the entire folder hierarchy for the sidebar. This might be a new API endpoint or an enhancement to an existing one.

**Step 2: Create/Integrate Folder Tree Component**
*   [ ] **File:** Create a new component, e.g., `components/dam/sidebar/DamFolderTree.tsx`.
*   [ ] **Code:** Implement logic to fetch and render the folder hierarchy.
    *   Each folder node should be clickable to navigate the main DAM view to that folder.
    *   Indicate the currently active/selected folder in the tree.
    *   Allow expanding/collapsing of folder nodes.
*   [ ] **Styling:** Style the tree for clarity and ease of use.
*   [ ] **Integration:** Add this component to the appropriate layout file (e.g., `app/(protected)/dam/layout.tsx` or the main app layout if the sidebar is global).
*   [ ] **Testing:**
    *   Verify the folder tree displays correctly.
    *   Verify clicking folders in the tree updates the main DAM view (`AssetGalleryClient`).
    *   Verify the active folder is highlighted in the tree.

**Step 3: Synchronization with Main View**
*   [ ] **State Management:** Ensure that navigation in the main view (e.g., clicking a folder chip or breadcrumb) updates the highlighted/active folder in the sidebar tree.
*   [ ] **Prop Drilling / Context API:** Use appropriate state management (props, Zustand, or React Context) to keep the sidebar and main view synchronized regarding the current folder ID.
*   [ ] **Testing:** Navigate through folders using both the sidebar and the main view; ensure both stay in sync.

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