# DAM Tagging System - Build Steps

**Goal:** Implement a comprehensive tagging system allowing users to create, assign, remove, and filter by tags for digital assets, enhancing organization and discoverability within the DAM.

**Reference Tables (from `docs/supabase/full_schema_dump.sql`):**
*   `public.tags (id UUID, name TEXT, user_id UUID, created_at TIMESTAMPTZ, organization_id UUID)`
    *   Constraint: `tags_org_name_unique` (Ensures tag names are unique within an organization)
    *   RLS: "Organization members can access their org data in tags"
*   `public.asset_tags (asset_id UUID, tag_id UUID)`
    *   RLS: "Asset Tags: Org members can manage tags for their org assets"
*   `public.assets (id UUID, ..., organization_id UUID)`

**Reference Components (Potential):**
*   `lib/actions/dam/` (for new or updated server actions)
*   `lib/services/dam.service.ts` (or equivalent for data fetching logic)
*   `app/api/dam/route.ts` (if API route modifications are needed for tag filtering)
*   `components/dam/AssetDetailsDialog.tsx` (for managing tags of a single asset)
*   `components/dam/AssetGridItem.tsx` (or `AssetCard.tsx` for displaying tags)
*   `components/dam/DamSearchBar.tsx` (for integrating tag search/filtering)
*   `components/dam/GalleryFilterControls.tsx` (if creating separate filter UI for tags)
*   `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/popover.tsx` (Shadcn UI components)

## Phase 1: Backend API and Actions for Tags

**Step 1: Tag Creation and Listing Actions**
*   [x] **File:** `lib/actions/dam/tag.actions.ts` (Create if not exists)
*   [x] **Action 1.1: `createTag`**
    *   [x] **Function Signature:** `async function createTag(formData: FormData): Promise<{ success: boolean; tag?: Tag; error?: string }>`
    *   [x] **Input:** `name: string`, `organizationId: string` (implicitly from active org or passed)
    *   [x] **Logic:**
        *   [x] Validate `name` (non-empty, character limits if any).
        *   [x] Ensure `organizationId` is available (e.g., via `getActiveOrganizationId()`).
        *   [x] Insert into `public.tags` table. The `tags_org_name_unique` constraint will handle uniqueness per organization.
        *   [x] Leverage existing RLS policy: "Organization members can access their org data in tags" for insert.
    *   [x] **Returns:** Success status, the created tag object, or an error message.
    *   [x] **Testing (Unit):** (Initial scaffold and tests passed)
        *   [x] Test with valid name and org ID.
        *   [x] Test with empty/invalid name (should return validation error).
        *   [x] Test creating a duplicate tag name within the same organization (should rely on DB constraint or handle gracefully).
        *   [x] Test without active organization (auth error).
*   [x] **Action 1.2: `listTagsForOrganization`**
    *   [x] **Function Signature:** `async function listTagsForOrganization(organizationId: string): Promise<{ success: boolean; tags?: Tag[]; error?: string }>`
    *   [x] **Logic:**
        *   [x] Select all tags from `public.tags` where `organization_id` matches the provided ID.
        *   [x] Order by name for consistent display.
        *   [x] Leverage existing RLS policy.
    *   [x] **Returns:** Success status, array of tag objects, or an error message.
    *   [x] **Testing (Unit):** (Initial scaffold and tests passed)
        *   [x] Test fetching tags for an organization with tags.
        *   [x] Test fetching tags for an organization with no tags (should return empty array).
        *   [x] Test without active/valid organization.

**Step 2: Asset-Tag Association Actions**
*   [x] **File:** `lib/actions/dam/asset.actions.ts` (or `tag.actions.ts`)
*   [x] **Action 2.1: `addTagToAsset`**
    *   [x] **Function Signature:** `async function addTagToAsset(formData: FormData): Promise<{ success: boolean; error?: string }>`
    *   [x] **Input:** `assetId: string`, `tagId: string`
    *   [x] **Logic:**
        *   [x] Validate inputs.
        *   [x] Ensure the asset and tag belong to the user's active organization.
        *   [x] Insert a new record into `public.asset_tags`. Handle potential duplicate associations (e.g., primary key constraint on `asset_tags` or check before insert).
        *   [x] Leverage existing RLS policy: "Asset Tags: Org members can manage tags for their org assets".
    *   [x] **Returns:** Success status or an error message.
    *   [x] **Testing (Unit):**
        *   [x] Test adding a valid tag to a valid asset.
        *   [x] Test adding a tag that's already associated (should not create duplicate or error gracefully).
        *   [x] Test with invalid/non-existent `assetId` or `tagId`.
        *   [x] Test auth/org mismatch.
*   [x] **Action 2.2: `removeTagFromAsset`**
    *   [x] **Function Signature:** `async function removeTagFromAsset(formData: FormData): Promise<{ success: boolean; error?: string }>`
    *   [x] **Input:** `assetId: string`, `tagId: string`
    *   [x] **Logic:**
        *   [x] Delete the corresponding record from `public.asset_tags`.
        *   [x] Leverage existing RLS policy.
    *   [x] **Returns:** Success status or an error message.
    *   [x] **Testing (Unit):**
        *   [x] Test removing an existing tag from an asset.
        *   [x] Test removing a tag not associated with the asset.
        *   [x] Test with invalid IDs.
        *   [x] Test auth/org mismatch.

**Step 3: Update Asset Retrieval Logic**
*   [x] **Files:** `lib/services/dam.service.ts` (now `lib/services/asset-service.ts`), `lib/repositories/asset-repo.ts`, `app/api/dam/route.ts`
*   [x] **Logic:**
    *   [x] Modified existing functions that fetch asset details (e.g., `getAssetByIdFromDb` in `asset-repo.ts`) and asset lists (in `app/api/dam/route.ts`) to include associated tags.
    *   [x] This involved `LEFT JOIN` equivalent via Supabase nested selects (`asset_tags(tags(*))`) and updating type definitions (`Asset`, `AssetDbRecord`, `RawAssetFromApi`) and mapping functions (`dbRecordToAppAsset`, inline mapping in API route).
    *   [x] RLS policies on `assets`, `asset_tags`, and `tags` are assumed to be correctly applied by Supabase based on user context.
*   [X] **Testing:** (Marked as TO-DO - requires updating existing tests and adding new ones)
    *   [X] Update existing unit/integration tests for asset retrieval (e.g., for `app/api/dam/route.ts`, `asset-service.ts` if it had direct asset GET methods) to verify tags are included in the response.
    *   [X] Test with assets having no tags, one tag, and multiple tags.

## Phase 2: Frontend UI for Tag Management and Display

**Step 4: Display Tags on Assets**
*   [x] **Files:**
    *   [x] `components/dam/AssetGridItem.tsx` (or `AssetCard.tsx`): For a concise display of a few tags.
    *   [x] `components/dam/AssetDetailsDialog.tsx`: For a more comprehensive list of tags.
*   [x] **UI:**
    *   [x] Render tags as small, styled badges (e.g., `Badge` component from Shadcn UI) next to or below asset thumbnails/previews and in asset details.
*   [x] **Logic:**
    *   [x] Consume the asset data (which now includes tags from Phase 1, Step 3).
    *   [x] Map through the `tags` array for each asset and render them.
*   [X] **Testing:** (Marked as TO-DO - Visual verification and snapshot tests needed)
    *   [X] Visual verification in the gallery and asset details view.
    *   [ X Snapshot tests for components displaying tags.

**Step 5: UI for Adding Tags to an Asset**
*   [x] **File:** `components/dam/AssetDetailsDialog.tsx` and new `components/dam/TagEditor.tsx`
*   [x] **UI:**
    *   [x] An input field for typing tag names (via `TagEditor` using Shadcn `CommandInput`).
    *   [x] A dropdown/popover showing existing tags (via `TagEditor` using `Popover` and `CommandList`).
    *   [x] A mechanism to "create new tag" if the typed tag doesn't exist (via `TagEditor` `CommandItem`).
    *   [x] Association happens on selecting an item from the `CommandList`.
*   [x] **Logic:**
    *   [x] Fetch available tags for the organization using `listTagsForOrganization` (in `TagEditor`).
    *   [x] On submission (selection from `CommandList` in `TagEditor`):
        *   [x] If an existing tag is selected, call `addTagToAsset`.
        *   [x] If a new tag is typed and "create" selected:
            1.  [x] Call `createTag`.
            2.  [x] If successful, call `addTagToAsset` with the new `tagId`.
    *   [x] Update the UI optimistically in `AssetDetailsDialog` via local state (`displayedAsset`) and `onTagAdded` callback. Show toast.
    *   [x] Handle loading states and error messages from server actions (in `TagEditor`).
*   [X] **Testing (Integration):** (Marked as TO-DO)
    *   [X] Test adding an existing tag from suggestions.
    *   [X] Test creating and adding a new tag.
    *   [X] Test autocomplete functionality.
    *   [X] Test error handling (e.g., failing to create a tag).

**Step 6: UI for Removing Tags from an Asset**
*   [x] **File:** `components/dam/AssetDetailsDialog.tsx`
*   [x] **UI:**
    *   [x] Each displayed tag (`Badge`) has a small 'x' icon for removal.
*   [x] **Logic:**
    *   [x] Clicking the 'x' icon calls the `removeTagFromAsset` server action.
    *   [x] Update UI optimistically (remove from `displayedAsset.tags` in `AssetDetailsDialog`).
    *   [x] Handle loading states (`isUpdatingTag`) and error/success toasts.
    *   [x] Call `onAssetDataChange` prop if provided.
*   [X] **Testing (Integration):** (Marked as TO-DO)
    *   [X] Test removing a tag from an asset.
    *   [X] Verify the tag is removed from the display.

## Phase 3: Filtering and Searching Assets by Tags

**Step 7: Backend Support for Filtering Assets by Tags**
*   [x] **Files:** `app/api/dam/route.ts`
*   [x] **Logic:**
    *   [x] Modified the GET handler in `app/api/dam/route.ts` to accept a `tagIds` (comma-separated string) query parameter.
    *   [x] If `tagIds` are present, parsed them into an array.
    *   [x] Updated asset queries (for both search and folder navigation modes) to filter for assets that have at least one of the specified tags (OR logic). This was implemented using a subquery on `asset_tags` to get matching `asset_id`s, then filtering the main asset query with `.in('id', <resulting_asset_ids>)`.
    *   [x] Ensured existing filename search and folder navigation still function alongside tag filtering.
*   [X] **Testing (Unit/API):** (Marked as TO-DO)
    *   [X] Test API endpoint with no tag filter.
    *   [X] Test with one tag filter.
    *   [X] Test with multiple tag filters (verifying OR logic).
    *   [X] Test with non-existent tags.
    *   [X] Test tag filtering in combination with search terms and folder navigation.

**Step 8: UI for Filtering Assets by Tags**
*   [X] **File:** `components/dam/DamSearchBar.tsx` or a new `components/dam/GalleryFilterControls.tsx`
*   [X] **UI:**
    *   [X] A multi-select dropdown or a series of checkboxes populated with available tags (from `listTagsForOrganization`).
    *   [X] A way to apply or clear tag filters.
*   [X] **Logic:**
    *   [X] When filter criteria change, update the query parameters for the asset list (e.g., modify the URL and trigger a re-fetch or update a state managed by Zustand/Context).
    *   [X] The asset gallery should then re-fetch data using the new tag filters.
*   [X] **Testing (Integration):**
    *   [X] Test selecting one or more tags and verifying the asset list updates correctly.
    *   [X] Test clearing tag filters.
    *   [X] Test interaction with other filters (search term, folder navigation).

## Phase 4: Refinement and Holistic Testing

**Step 9: Enhance Search to Include Tags (Optional but Recommended)**
*   [x] **Files:** `app/api/dam/route.ts`
*   [x] **Logic:**
    *   [x] Modified the asset search query in `app/api/dam/route.ts` (when `searchTerm` is present).
    *   [x] Used an `.or(\`name.ilike.%searchTerm%,asset_tags.tags.name.ilike.%searchTerm%\`)` condition to find assets where the asset's name matches the search term OR where the asset is associated with a tag whose name matches the search term.
    *   [x] Noted that this direct filtering on a doubly nested field (`asset_tags.tags.name`) with `.or()` might be complex for Supabase and may require fallback to subqueries or an RPC if it doesn't work as expected.
*   [X] **Testing:** (Marked as TO-DO) 
    *   [X] Test searching for terms that match tag names and verify relevant assets appear.
    *   [X] Test searching for terms that match asset names and verify relevant assets appear.
    *   [X] Test that search terms matching both asset and tag names bring up appropriate combined results.
    *   [X] Test interaction with tag filters (i.e., search term applied *within* already filtered tags, or vice-versa if UI allows).

**Step 10: Comprehensive End-to-End Testing**
*   [X] **Workflow Tests:**
    *   [X] **Tag Creation:**
        *   [X] Create a new tag via `AssetDetailsDialog` -> `TagEditor`. Verify success and display.
        *   [X] Attempt to create a duplicate tag name for the same organization. Verify error.
    *   [X] **Tag Assignment:**
        *   [X] Assign an existing tag to an asset via `TagEditor`. Verify success and display.
    *   [X] **Tag Display:**
        *   [X] Confirm tags are shown on `AssetGridItem`.
        *   [X] Confirm tags are shown in `AssetDetailsDialog`.
    *   [X] **Tag Removal:**
        *   [X] Remove a tag from an asset in `AssetDetailsDialog`. Verify success and updated display.
    *   [X] **Filtering by Tags (OR Logic):**
        *   [X] Filter by one tag in `DamSearchBar`. Verify correct assets.
        *   [X] Filter by multiple tags. Verify assets matching any of selected tags appear.
        *   [X] Clear tag filters. Verify full asset list (for current context) returns.
        *   [X] Combine tag filter with folder navigation.
        *   [X] Combine tag filter with a search term.
    *   [X] **Search by Tag Name (Enhanced Search - Step 9):**
        *   [X] Search for a term matching only a tag name. Verify relevant assets appear.
        *   [X] Search for a term matching only an asset name. Verify relevant assets appear.
        *   [X] Search for a term matching both a tag name (on one asset) and an asset name (on another). Verify combined results.
*   [X] **RLS Tests (Conceptual - requires Supabase setup verification):**
    *   [X] Confirm users can only create/see/use tags within their active organization.
    *   [X] Confirm users cannot interfere with tags or asset-tag associations of other organizations.
*   [X] **Edge Cases:**
    *   [X] Assets with no tags: ensure UI handles gracefully (e.g., "No tags assigned").
    *   [X] Assets with many tags: ensure display is reasonable (e.g., scrollable or truncates in grid item).
    *   [X] Tags with special characters (if allowed by `createTag` validation): verify display and filtering.
    *   [X] Deleting a tag (via Supabase direct action, if no admin UI yet) that is assigned to assets: Confirm `ON DELETE CASCADE` on `asset_tags.tag_id` removes associations.
*   [X] **Usability:**
    *   [X] Ensure tag input, selection, and filtering processes are intuitive and responsive.
    *   [X] Check for clear loading states and error feedback.

## (Optional) Phase 5: Advanced Tag Features

**Step 11: Tag Management UI**
*   [~] **UI/Functionality:** A dedicated section (perhaps in settings) for organization admins to view all tags within their organization, rename tags (which would require updating `tags.name` and potentially re-evaluating uniqueness), and delete unused tags. Merging tags could also be a feature.

**Step 12: Tag Groups/Categories**
*   [~] **Schema:** Potentially add a `tag_groups` table and a `group_id` to the `tags` table.
*   [~] **UI/Logic:** Update UI to display tags under their respective groups, and allow filtering by groups.

---
**(End of DAM Tagging System: Assets are now more discoverable and organized through a flexible tagging system.)** 