# DAM Search, Filtering, and Sorting - Build Steps

**Goal:** Enhance the DAM by providing users with advanced search filters, attribute-based filtering, and sorting capabilities for both folders and assets, with a user experience similar to Google Drive filters.

**Reference Components:**
*   `app/(protected)/dam/page.tsx` (for search input and filter controls)
*   `components/dam/AssetGalleryClient.tsx` (for applying filters/sort to data fetching & display)
*   `/api/dam` endpoint (needs to be updated to handle new filter/sort parameters)
*   Supabase RPC function `get_folder_contents_and_assets` (or similar, needs modification).

## Phase 1: Advanced Search Filters (Backend & API)

**Step 1: Define Filterable Attributes & UX (Inspired by Google Drive)**
*   [x] **Decision:** Identify attributes to filter by, aligning with GDrive's approach.
    *   **Common for Assets & Folders:**
        *   **Type:**
            *   Predefined categories: "Folders", "Images" (e.g., `image/*`), "Videos" (e.g., `video/*`), "Documents" (e.g., `application/pdf`, `application/msword`, `text/*`), "Audio" (e.g., `audio/*`), "Archives" (e.g., `application/zip`).
            *   Database fields: `assets.mime_type` for asset types; a way to distinguish folders.
            *   UX: Single-select dropdown (like GDrive's "Type").
        *   **Creation Date** (corresponds to GDrive's "Modified" filter concept):
            *   Options: "Anytime" (default), "Today", "Last 7 days", "Last 30 days", "This year", "Last year", "Custom date range".
            *   Database fields: `assets.created_at`, `folders.created_at`.
            *   UX: Dropdown with predefined ranges and a "Custom date range" option that reveals date pickers.
        *   **Owner / Uploaded By** (corresponds to GDrive's "People" filter):
            *   Filter by the user who created/owns the asset or folder.
            *   Database fields: `assets.user_id`, `folders.user_id`. Link to `profiles.full_name` for display.
            *   UX: Dropdown populated with organization members' full names.
    *   **Assets Only:**
        *   **File Size:**
            *   Options: "Any size" (default), "< 1MB", "1MB - 10MB", "10MB - 100MB", "> 100MB", "Custom range".
            *   Database field: `assets.size`.
            *   UX: Dropdown with predefined ranges; "Custom range" reveals min/max input fields.
*   [X] **UX Design - Filter Bar & Active Filters:**
    *   [x] **Decision:** Initial placement of global search bar has been moved to `SiteHeader`. Filter-specific controls will still be primarily in `app/(protected)/dam/page.tsx`.
    *   [x] Plan for a filter bar, possibly below the main search input area on `app/(protected)/dam/page.tsx`.
    *   [X] Display active filters clearly. (Initial idea of separate "pills/chips" was revised; active state is now shown on the main filter buttons themselves, which also allow individual clearing. See Step 3 for details.)
    *   [X] Include a "Clear all filters" button. (Implementation detailed in Step 4: Clear Filters Functionality)

**Step 2: Update API and Database Query**
*   [x] **API:** Modify `/api/dam` endpoint to accept new query parameters for these filters:
    *   `type` (string, e.g., 'folder', 'image', 'video', 'document', 'audio', 'archive')
    *   `creationDateOption` (string, e.g., 'anytime', 'today', 'last7days', 'last30days', 'thisYear', 'lastYear', 'custom')
    *   `dateStart` (string, `YYYY-MM-DD`, if `creationDateOption` is 'custom')
    *   `dateEnd` (string, `YYYY-MM-DD`, if `creationDateOption` is 'custom')
    *   `ownerId` (string, `uuid` of the user)
    *   `sizeOption` (string, e.g., 'any', 'small', 'medium', 'large', 'custom')
    *   `sizeMin` (integer, bytes, if `sizeOption` is 'custom')
    *   `sizeMax` (integer, bytes, if `sizeOption` is 'custom')
*   [x] **File:** Initial structural changes made. `SiteHeader.tsx` now houses global search and DAM view mode toggles. `app/(protected)/dam/page.tsx` and `components/dam/DamPageClientView.tsx` have been adjusted.
*   [X] **UI Components (inspired by Google Drive):**
    *   [x] Implement a filter bar that houses dropdown buttons for "Type", "Creation Date", "Owner", and "Size" (for assets). (Note: Search bar and View Mode toggles are now in `SiteHeader`)
    *   [x] **Type Filter:** `DropdownMenu` with options: "Any Type", "Folders", "Images", "Videos", "Documents", "Audio", "Archives".
    *   [x] **Creation Date Filter:** `DropdownMenu` with options: "Anytime", "Today", "Last 7 days", "Last 30 days", "This year", "Last year". Add a "Custom date range..." item that, when clicked, reveals two `Calendar` input components.
    *   [x] **Owner Filter:** `DropdownMenu` populated dynamically with organization members (user full names mapping to `user_id`). Include an "Anyone" option. Handles long names with truncation and tooltip.
    *   [x] **Size Filter (Assets only):** `DropdownMenu` with options like: "Any size", "< 1MB", "1MB - 10MB", "10MB - 100MB", "> 100MB". Add a "Custom range..." item revealing min/max input fields. Now complete, including custom range UI and segmented clear button.
*   [x] **State Management:** Manage the state of selected filter values (e.g., using `useState` or a reducer if complexity grows). These states will drive the parameters sent to the API.
*   [x] **Active Filter Display:** (Note: Considered complete as main filter buttons show active state and include an 'X' to clear individual filters.)
*   [x] **Integration:** When filter values change (or a pill is removed), update the query parameters passed to `/api/dam` (likely via `AssetGalleryClient.tsx`'s `fetchData` or a similar mechanism).
*   [X] **Testing:**
    *   [x] Verify filter controls appear and function correctly. (Owner filter populates, handles long names with truncation/tooltip).
    *   [x] Verify selecting filters updates the displayed assets/folders. (Tested for Owner filter; to be re-verified for all filters systematically).
    *   [x] Verify individual filters can be removed using the 'X' on the filter buttons. All filter buttons now use the segmented button pattern for clearing. 

**Step 4: Clear Filters Functionality**
*   [x] **UI:** Add a "Clear all filters" button, visible when at least one filter is active.
*   [x] **Logic:** This button should reset all filter controls and active filter pills to their default states and refresh the DAM view.
*   [x] **Testing:** Verify the clear filters button works as expected.

## Phase 3: Sorting Capabilities

**Step 5: Define Sortable Attributes & API Update**
*   [x] **Decision:** Identify attributes to sort by:
    *   **Folders & Assets (Common):** 
        *   Name (`name`, ASC/DESC)
        *   Last Modified (`updated_at`, ASC/DESC)
    *   **Assets only:** 
        *   Size (`size`, ASC/DESC)
        *   Type (`mime_type`, ASC/DESC)
*   [X] **API:** Modify `/api/dam` endpoint to accept sort parameters: `sortBy` (e.g., 'name', 'updated_at', 'size', 'mime_type') and `sortOrder` ('asc', 'desc').
*   [X] **Backend (Supabase RPC/Queries):** Update data fetching logic in `/api/dam/route.ts` (which handles fetching folders and assets) to use these parameters in the `ORDER BY` clauses of its SQL queries. Consider sorting folders and assets as separate groups if they are displayed that way.
*   [X] **Testing:** Test the API directly with sort parameters.

### Phase 3: Sorting Capabilities (Frontend)

**Step 6: Implement Sorting UI Controls**
*   **DONE: UI for Sorting:**
    *   Added a "Sort by" dropdown button (`SortControl.tsx`) to `DamPageClientView.tsx` alongside filter controls.
    *   Dropdown lists: Name (A-Z, Z-A), Last Modified (Newest, Oldest), Size (Largest, Smallest), Type (A-Z, Z-A).
    *   Sort button label updates to reflect the active sort criteria.
*   **DONE: Integrate with API:**
    *   `DamPageClientView.tsx` now manages `sortBy` and `sortOrder` state, initialized from/updated in URL parameters.
    *   `SortControl.tsx` uses a callback to update this state.
    *   `sortBy` and `sortOrder` are passed to `AssetGalleryClient.tsx`.
    *   `AssetGalleryClient.tsx` passes these parameters to the `/api/dam` fetch call in `fetchData` and includes them in `useEffect` dependencies.
*   **DONE: Default Sorting & Tie-Breaking:**
    *   API handles default sorting (assets by `updated_at desc`, folders by `name asc`).
    *   Implemented secondary sort by `name ASC` in the API when primary sort is `updated_at` to handle timestamp ties consistently.
*   **DONE: Testing:**
    *   Manually tested sorting functionality: UI updates, URL parameter changes, and gallery re-ordering confirmed for various attributes and orders.
    *   Addressed an issue where items with identical `updated_at` timestamps were not sorting predictably by adding a secondary sort by name in the API.

### Phase 4: UI/UX Refinements and Final Touches

*   **Step 7: Display of Active Filters & Sort State**
*   [x] **UI:** Reconfirm that active filters are clearly displayed (i.e., the filter buttons themselves show the active state and can be individually cleared). Ensure the overall presentation of filters, search, and sort options is intuitive. (Note: Overall header layout updated for search and view toggles. Padding adjusted, title and border removed.)
*   [X] **Ease of Use:** Ensure it's easy for users to see and modify current filter/sort states.
*   [X] **Testing:** Verify active filter/sort display is clear, accurate, and easily manageable.

**(End of DAM Search, Filtering, and Sorting: Users can now efficiently find and organize assets and folders using powerful search, filter, and sort tools, with a familiar GDrive-like interface.)** 