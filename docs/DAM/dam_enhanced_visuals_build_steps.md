# DAM Enhanced Visuals & Interactivity - Build Steps

**Goal:** Improve the user experience of the Digital Asset Management (DAM) by adding richer visual cues and more interactive elements for folders and assets.

**Reference Components:**
*   `components/dam/FolderListItem.tsx`
*   `components/dam/AssetGridItem.tsx`
*   `components/dam/AssetGalleryClient.tsx`
*   Relevant API endpoints if item counts are fetched (`/api/dam` or new).

## Phase 1: Folder Item Counts

**Step 1: Determine Count Strategy**
*   [ ] **Decision:** Decide what to count (e.g., direct subfolders + direct assets, or just one type). For simplicity, start with direct subfolders and assets.
*   [ ] **API Design:** Determine if existing `/api/dam` endpoint can be augmented to return item counts per folder, or if a new lightweight endpoint is needed for this.
    *   Consider performance implications of calculating counts, especially for folders with many items.

**Step 2: API Implementation/Modification (if needed)**
*   [ ] **Backend:** If modifying `/api/dam`, update the Supabase query (likely in the RPC function `get_folder_contents_and_assets` or similar) to include counts for each folder returned.
*   [ ] **Backend:** If a new endpoint, create it to accept a folder ID and return its item count.
*   [ ] **Types:** Update `Folder` type in `types/dam.ts` to include optional count fields (e.g., `subfolderCount?: number; assetCount?: number;`).
*   [ ] **Testing:** Test the API endpoint directly to ensure it returns correct counts.

**Step 3: Display Counts in `FolderListItem.tsx`**
*   [ ] **File:** Modify `components/dam/FolderListItem.tsx`.
*   [ ] **Data Fetching:** Ensure `AssetGalleryClient.tsx` fetches these counts if they come with the main data load, or `FolderListItem.tsx` fetches them if done individually (less ideal for performance if many folders).
*   [ ] **UI:** Display the count(s) subtly within the folder chip (e.g., a small badge, or text like "(3 items)").
*   [ ] **Styling:** Style the count information to be clear but not overpowering.
*   [ ] **Testing:** Verify item counts are displayed correctly and update if items are added/removed (after a refresh).

## Phase 2: Enhanced Hover & Selection States

**Step 4: Subtle Hover Effects for Folders & Assets**
*   [ ] **File:** Modify `components/dam/FolderListItem.tsx` and `components/dam/AssetGridItem.tsx`.
*   [ ] **CSS/Styling:** Add subtle hover effects like a slight scale transform (`group-hover:scale-105`), a more pronounced shadow (`group-hover:shadow-md`), or a gentle background color transition.
    *   Ensure these effects are smooth and not jarring.
*   [ ] **Testing:** Verify hover effects on both folder items and asset grid items.

**Step 5: Visual Selection State (for future batch operations)**
*   [ ] **Decision:** Define how selection will work (e.g., click to select, shift-click for range, ctrl/cmd-click for individual). This step focuses on the *visual* state for a single selected item first.
*   [ ] **UI:** Design a clear visual indicator for selected items (e.g., a persistent border color change, a checkmark overlay, a slightly different background).
*   [ ] **State Management:** Implement state in `AssetGalleryClient.tsx` to track selected item IDs (both folders and assets).
*   [ ] **Code:** In `FolderListItem.tsx` and `AssetGridItem.tsx`:
    *   [ ] Add an `isSelected` prop.
    *   [ ] Conditionally apply selection styling based on this prop.
    *   [ ] Implement click handlers to toggle selection state (managed by parent).
*   [ ] **Testing:**
    *   Verify items can be visually marked as selected/deselected.
    *   (Functional multi-select testing would be part of a larger batch operations feature).

## Phase 3: "Empty Folder" Indication

**Step 6: Visual Cue for Empty Folders on Chips**
*   [ ] **File:** Modify `components/dam/FolderListItem.tsx`.
*   [ ] **Data:** This assumes item counts (from Phase 1) are available. An empty folder would have `subfolderCount === 0 && assetCount === 0`.
*   [ ] **UI:** If a folder is empty, apply a slightly different style or add a subtle visual cue (e.g., a specific icon, a slightly desaturated look, or specific text if space allows, though less ideal for a chip).
*   [ ] **Styling:** Ensure the empty state is distinguishable but not distracting.
*   [ ] **Testing:** Verify empty folders are visually distinct in the folder list.

## Phase 4: Integration & Refinement

**Step 7: Review Visual Consistency**
*   [ ] **Review:** Check all new visual cues (counts, hover, selection, empty states) for consistency in style, color, and feel across the DAM.
*   [ ] **Dark Mode:** Ensure all visual enhancements work well in dark mode.
*   [ ] **Testing:** Visually inspect in both light and dark modes.

**Step 8: Performance Check**
*   [ ] **Testing:** If item counts are fetched, especially for many folders, monitor initial load times and interaction responsiveness.
*   [ ] **Optimization:** Optimize API calls or frontend rendering for counts if performance issues are detected.

**(End of DAM Enhanced Visuals & Interactivity: The DAM interface provides richer feedback and a more polished interactive feel.)** 