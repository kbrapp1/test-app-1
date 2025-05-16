# DAM Search, Filtering, and Sorting - Build Steps

**Goal:** Enhance the DAM by providing users with advanced search filters, attribute-based filtering, and sorting capabilities for both folders and assets.

**Reference Components:**
*   `app/(protected)/dam/page.tsx` (for search input and filter controls)
*   `components/dam/AssetGalleryClient.tsx` (for applying filters/sort to data fetching & display)
*   `/api/dam` endpoint (needs to be updated to handle new filter/sort parameters)
*   Supabase RPC function `get_folder_contents_and_assets` (or similar, needs modification).

## Phase 1: Advanced Search Filters (Backend & API)

**Step 1: Define Filterable Attributes**
*   [ ] **Decision:** Identify attributes to filter by. Suggestions:
    *   **Assets:** MIME type (e.g., image, video, document), upload date (range), file size (range).
    *   **Folders:** Creation date (range).
*   [ ] **UX Design:** Plan how users will interact with these filters (e.g., dropdowns, date pickers, sliders for ranges) alongside the existing text search.

**Step 2: Update API and Database Query**
*   [ ] **API:** Modify `/api/dam` endpoint to accept new query parameters for these filters (e.g., `mimeType=image/jpeg`, `uploadDateStart=YYYY-MM-DD`, `sizeMin=1024`).
*   [ ] **Backend (Supabase RPC):** Update the underlying Supabase function (`get_folder_contents_and_assets` or equivalent) to incorporate these new filter parameters into its SQL query using `WHERE` clauses and appropriate conditions.
    *   Handle multiple filters simultaneously.
    *   Ensure efficient indexing on filterable columns in your database tables (`assets`, `folders`).
*   [ ] **Testing:** Test the API endpoint directly with various filter combinations to ensure it returns correctly filtered results.

## Phase 2: Frontend Filter Controls

**Step 3: Implement Filter UI Controls**
*   [ ] **File:** Modify `app/(protected)/dam/page.tsx` (where the current search bar exists).
*   [ ] **UI Components:** Add UI elements for selecting filters:
    *   Dropdowns for MIME types (populated dynamically or with a predefined list).
    *   Date range pickers for dates.
    *   Input fields or sliders for size ranges.
*   [ ] **State Management:** Manage the state of these filter controls.
*   [ ] **Integration:** When filter values change, update the query parameters sent to `/api/dam` via `AssetGalleryClient.tsx`'s `fetchData` method. This will likely involve modifying how `fetchData` constructs its API URL in `AssetGalleryClient.tsx` based on search params from the page.
*   [ ] **Testing:**
    *   Verify filter controls appear and function correctly.
    *   Verify selecting filters updates the displayed assets/folders.

**Step 4: Clear Filters Functionality**
*   [ ] **UI:** Add a "Clear Filters" button.
*   [ ] **Logic:** This button should reset all filter controls to their default states and refresh the DAM view without the filters applied.
*   [ ] **Testing:** Verify the clear filters button works as expected.

## Phase 3: Sorting Capabilities

**Step 5: Define Sortable Attributes & API Update**
*   [ ] **Decision:** Identify attributes to sort by:
    *   **Folders & Assets:** Name (ASC/DESC), Date Created/Modified (ASC/DESC).
    *   **Assets only:** Size (ASC/DESC), Type (MIME type) (ASC/DESC).
*   [ ] **API:** Modify `/api/dam` endpoint to accept sort parameters (e.g., `sortBy=name&sortOrder=asc`).
*   [ ] **Backend (Supabase RPC):** Update the Supabase function to use these parameters in the `ORDER BY` clause of its SQL query.
*   [ ] **Testing:** Test the API directly with sort parameters.

**Step 6: Implement Sorting UI Controls**
*   [ ] **File:** Modify `app/(protected)/dam/page.tsx` or `components/dam/AssetGalleryClient.tsx` (wherever sorting controls make sense).
*   [ ] **UI Components:** Add dropdowns or buttons to select sort attribute and order.
    *   Consider separate sort controls for folders and assets if displayed distinctly, or a global sort if appropriate.
*   [ ] **State Management:** Manage the state of selected sort options.
*   [ ] **Integration:** When sort options change, update query parameters for `/api/dam` and refresh the view.
*   [ ] **Testing:**
    *   Verify sort controls appear and function.
    *   Verify items are sorted correctly based on selection.

## Phase 4: Integration and UX Refinements

**Step 7: Combine Search, Filters, and Sorting**
*   [ ] **Logic:** Ensure text search, advanced filters, and sorting can all be applied simultaneously and work correctly together.
*   [ ] **URL State:** Consider reflecting filter and sort states in the URL query parameters for shareability and bookmarking of views.
*   [ ] **Testing:** Test complex combinations of search, filters, and sorting.

**Step 8: UI/UX for Active Filters/Sort**
*   [ ] **UI:** Clearly display which filters and sort orders are currently active (e.g., "tags" or summary text like "Type: Image, Sorted by Name (A-Z)").
*   [ ] **Ease of Use:** Ensure it's easy for users to see and modify current filter/sort states.
*   [ ] **Testing:** Verify active filter/sort display is clear and accurate.

**(End of DAM Search, Filtering, and Sorting: Users can now efficiently find and organize assets and folders using powerful search, filter, and sort tools.)** 