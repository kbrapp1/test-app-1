# Refactoring `app/api/dam/route.ts` - Build Steps

**Goal:** Improve the clarity, maintainability, and performance of the DAM API route by modularizing its logic, optimizing queries, and refining error handling.

**Reference Components:**
*   `app/api/dam/route.ts` (The file to be refactored)
*   `@/lib/supabase/db-queries` (Currently `queryData` is used, consider more specific query functions)
*   `@/lib/auth/server-action` (Specifically `getActiveOrganizationId`)
*   `@/types/dam` (Asset, Folder, CombinedItem types)

## Phase 1: Code Structure and Readability

**Step 1: Modularize Data Fetching Logic**
*   [ ] **Identify Core Logic Blocks:** Separate the logic for:
    *   Search mode (fetching folders and assets based on `searchTerm` and `tagIdsParam`).
    *   Folder navigation mode (fetching based on `folderId` and `tagIdsParam`).
*   [ ] **Create Helper Functions:** Extract these blocks into clearly named internal helper functions within `route.ts`.
    *   Example: `fetchSearchResults(supabase, activeOrgId, searchTerm, tagIdsArray, limitOptions)`
    *   Example: `fetchFolderContents(supabase, activeOrgId, folderId, tagIdsArray, limitOptions)`
*   [ ] **Input/Output:** Define clear inputs (Supabase client, org ID, query params) and outputs (data, errors) for these helpers.
*   [ ] **Testing:** (Mental or unit tests if feasible) Ensure extracted functions behave identically to the original inline code.

**Step 2: Refine Parameter Handling and Validation**
*   [ ] **Consolidate Param Parsing:** Group the parsing of `folderId`, `searchTerm`, `quickSearch`, `limitParam`, and `tagIdsParam` at the beginning of the `getHandler`.
*   [ ] **Type Safety for Params:** Ensure robust parsing for `limitParam` (e.g., `parseInt`) and handling of potentially empty/malformed `tagIdsParam`.
*   [ ] **Centralize Org ID Check:** The `getActiveOrganizationId` check is good. Ensure it remains a primary gatekeeper.
*   [ ] **Testing:** Verify that various combinations of valid and invalid query parameters are handled gracefully.

**Step 3: Streamline Supabase Query Construction**
*   [ ] **Separate Query Builders:** For complex queries (especially in search mode), consider creating dedicated functions that build the Supabase query chain based on parameters.
    *   Example: `buildAssetSearchQuery(supabase, activeOrgId, searchTerm, tagIdsArray)`
    *   Example: `buildFolderSearchQuery(supabase, activeOrgId, searchTerm)`
*   [ ] **Conditional Chaining:** Make the application of `.eq()`, `.is()`, `.ilike()`, `.in()`, `.limit()`, `.order()` clearer within these builder functions.
*   [ ] **Comment Complex Logic:** Specifically comment the logic for tag filtering subqueries and any workarounds for Supabase limitations (like the `uuid_generate_v4()` trick for no results).
*   [ ] **Testing:** Ensure constructed queries match the intended logic for different parameter sets.

## Phase 2: Query Optimization and Performance

**Step 4: Optimize Owner Name Fetching (`getOwnerNames`)**
*   [ ] **Review Profile Table:** Confirm the `profiles` table and `full_name` column are correct and indexed.
*   [ ] **Batching:** The current approach of collecting all `userIds` and fetching once is good. Ensure it handles cases with zero user IDs efficiently.
*   [ ] **Error Handling:** The `console.error` for profile fetch errors is okay for server logs; consider if client needs any indication.
*   [ ] **Testing:** Test with assets/folders having known owners, unknown owners, and no owners.

**Step 5: Optimize Parent Folder Name Fetching for Assets**
*   [ ] **RPC `get_folder_path` Review:**
    *   The RPC call `get_folder_path` for each asset can lead to N+1 issues if many assets are returned.
    *   **Decision:** Evaluate if this can be optimized.
        *   Option A (If feasible): Fetch all relevant folder details (id, name) in a single batch upfront if the set of `folder_id`s for assets is known and not excessively large. Then map names in the application.
        *   Option B (If RPC is efficient): Ensure the `get_folder_path` RPC is highly optimized in PostgreSQL.
        *   Option C (Alternative): Could asset data already include parent folder name if joined appropriately at the primary query level? (Less likely for deeply nested paths unless recursive CTEs are used in the main query).
*   [ ] **Implementation (if Option A chosen):**
    *   Collect unique `folder_id`s from `assetsData`.
    *   Fetch names for these folder IDs in one query.
    *   Map these names back to assets.
*   [ ] **Error Handling:** The current error handling for `pathError` is good.
*   [ ] **Testing:** Verify parent folder names are correct for assets in root and subfolders, and that performance is acceptable for typical asset list sizes.

**Step 6: Review Tag Data Fetching and Mapping**
*   [ ] **Asset Query for Tags:** The `asset_tags(tags(*))` selection is generally efficient for fetching related data.
*   [ ] **Tag Filtering Logic:**
    *   The subquery approach for filtering by `tagIdsParam` is standard. Ensure RLS on `asset_tags` is correctly applied or that organization scoping is implicitly handled.
    *   The `.or(name.ilike..., asset_tags.tags.name.ilike...)` for searching tag names was commented out.
        *   **Decision:** If this feature is desired, investigate the correct Supabase syntax or implement an RPC / more complex join to achieve this efficiently. A simple `.or()` on deeply nested paths might not work as expected or perform well.
*   [ ] **Mapping Tags:** The `mappedTags` logic is clear.
*   [ ] **Testing:** Test asset fetching with and without tag filters, and with assets having multiple tags or no tags. If tag name search is re-enabled, test its accuracy.

## Phase 3: Data Transformation and Response

**Step 7: Consolidate Data Transformation**
*   [ ] **Centralize `type` Property:** The addition of `type: 'asset'` and `type: 'folder'` is good.
*   [ ] **Uniform Object Structure:** Ensure `assetsWithDetails` and `foldersWithDetails` conform consistently to `CombinedItem` before merging.
*   [ ] **Public URL Generation:** `getPublicUrl` usage is correct.
*   [ ] **Testing:** Verify the structure of the final JSON response for various scenarios (search, folder navigation, empty results).

**Step 8: Refine QuickSearch Limiting Logic**
*   [ ] **Proportional Limiting:** The current logic for `quickSearch` limits folders to `ceil(parsedLimit / 2)` and assets to `parsedLimit` (then adjusts if needed).
    *   Review if this distribution is optimal for user experience in quick search.
    *   The final slicing `if (combined.length > parsedLimit)` is a good safeguard.
*   [ ] **Clarity:** Add comments to explain the quick search limiting strategy if it's not immediately obvious.
*   [ ] **Testing:** Test quick search with various `limit` parameters and result set sizes to ensure it behaves as expected.

## Phase 4: Error Handling and Finalization

**Step 9: Standardize Error Handling**
*   [ ] **Custom Errors:** The use of `DatabaseError` and `ValidationError` is good. Ensure all potential database/logic errors are wrapped appropriately.
*   [ ] **Error Propagation:** Confirm that the `withErrorHandling` middleware correctly catches these custom errors and formats the HTTP response.
*   [ ] **Logging:** Maintain informative server-side logging (e.g., `console.error`) for debugging.
*   [ ] **Testing:** Test error scenarios (e.g., database down, invalid org ID, malformed parameters that bypass initial parsing) to ensure correct error responses.

**Step 10: Final Code Review and Cleanup**
*   [ ] **Remove TODOs/Comments:** Clean up any temporary comments (like the one about `asset_tags.tags.name.ilike`).
*   [ ] **Consistent Naming:** Ensure consistent naming for variables and functions.
*   [ ] **Type Safety:** Double-check all type assertions (e.g., `as Omit<Folder, 'type'>[]`) and ensure they are safe or add appropriate runtime checks if necessary.
*   [ ] **Readability:** Do a final pass for overall code readability and clarity.
*   [ ] **Testing:** Perform a full regression test of the DAM API functionality after refactoring.

**(End of `app/api/dam/route.ts` Refactoring: The API route is more modular, easier to understand, and potentially more performant.)** 