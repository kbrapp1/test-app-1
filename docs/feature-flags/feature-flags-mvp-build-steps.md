# Feature Entitlement System - MVP Build Steps

**STATUS:** Not Started | DESIGN COMPLETE ✅ | Ready for Implementation 🔥

**MAJOR ARCHITECTURE GOALS:**
- **DDD Compliance:** Align with existing DDD patterns for `Organization` and `User` contexts.
- **Single Responsibility:** Ensure new components (hooks, services) have a single, clear purpose.
- **Scalable Pattern:** Establish a reusable pattern that can be applied to any feature.

**IMMEDIATE NEXT STEPS:**
1. 🔥 **NEXT:** Create database migration to add `feature_flags` column.
2. 🔥 **NEXT:** Update domain entities and infrastructure to support the new column.
3. 🔥 **NEXT:** Implement frontend hook for easy consumption of feature flags.
4. 🔥 **NEXT:** Apply the new system to a single pilot feature (TTS).
5. 🔥 **NEXT:** Write comprehensive tests for the new system.

**Goal:** To implement a core Feature Entitlement MVP that allows enabling/disabling features on a per-organization basis. This will establish a secure, scalable foundation for creating distinct product tiers and managing feature rollouts.

**Reference Architecture:**
- **Domain Layer:** `lib/organization/domain/` - The `Organization` entity will own the feature flags.
- **Infrastructure Layer:** `lib/organization/infrastructure/` - Supabase persistence for feature flags.
- **Application Layer:** `context/` & `lib/organization/application/` - Making flags available to the app.
- **Presentation Layer:** `lib/organization/presentation/` - A reusable hook for checking flags in the UI.

**MVP Scope:**
- Add a `feature_flags` JSONB column to the `organizations` table.
- Update the backend to fetch and provide these flags to the client.
- Create a `useFeatureFlag()` hook for simple, declarative checks in the UI.
- Gate one pilot feature (**Text-to-Speech**) as a proof of concept.
- Document the new pattern for developers.

**CRITICAL IMPLEMENTATION NOTES:**
- 🔥 **Security First:** All feature gates MUST be enforced on the backend (server actions, API routes) in addition to the UI.
- 🔥 **Default Off:** The system should be designed so that if a flag is not explicitly present for an organization, the feature is considered disabled.
- 🔥 **DDD Compliance:** Follow existing domain patterns for the `Organization` bounded context.

**Database Schema:**
```sql
-- Migration to add feature flag support to existing organizations table
ALTER TABLE public.organizations
ADD COLUMN feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.feature_flags IS 'Defines which features are enabled. E.g., {"dam": true, "tts": false, "reporting": true}';
```

---

## Phase 1: Domain & Infrastructure Layers - The Data Foundation

**Step 1: Update the Domain Layer**
- [ ] **File:** `lib/organization/domain/entities/Organization.ts`
- [ ] **Action 1.1: Enhance `Organization` Entity**
  - [ ] Add a new property `feature_flags: Record<string, boolean>;` to the `Organization` entity/interface.
  - [ ] Update the `create` and `fromSnapshot` methods (if they exist) to handle the new property.

**Step 2: Create the Database Migration**
- [ ] **File:** `supabase/migrations/[timestamp]_add_feature_flags_to_orgs.sql`
- [ ] **Action 2.1: Create Migration File**
  - [ ] Create a new SQL migration file.
  - [ ] Add the `ALTER TABLE` script provided in the "Database Schema" section above.
- [ ] **Action 2.2: Apply and Test Migration**
  - [ ] Apply the migration to your local and staging Supabase environments.
  - [ ] Manually verify in the Supabase Studio that the `organizations` table has the new `feature_flags` column with a default value of `{}`.

**Step 3: Update the Infrastructure Layer**
- [ ] **File:** `lib/organization/infrastructure/persistence/supabase/SupabaseOrganizationRepository.ts` (or equivalent)
- [ ] **Action 3.1: Update Repository Fetch Logic**
  - [ ] Locate the method responsible for fetching organization data (e.g., `findById`, `getActiveOrg`).
  - [ ] Modify the Supabase `select()` query to include the new `feature_flags` column.
- [ ] **File:** `lib/organization/infrastructure/persistence/supabase/mappers/OrganizationMapper.ts` (or equivalent)
- [ ] **Action 3.2: Update Data Mapper**
  - [ ] Update the mapper function that converts the database row into a domain `Organization` entity to correctly map the `feature_flags` field.

## Phase 2: Application & Presentation Layers - Consuming the Flags

**Step 4: Update the Application Layer**
- [ ] **File:** `context/OrganizationContext.tsx` (or equivalent provider)
- [ ] **Action 4.1: Expose Flags via Context**
  - [ ] Update the type/interface for the active organization in your context to include `feature_flags`.
  - [ ] Ensure the value provided by the context includes the `feature_flags` from the fetched organization data. This makes the flags globally available to the frontend.

**Step 5: Create the Presentation Layer Hook**
- [ ] **File:** `lib/organization/presentation/hooks/useFeatureFlag.ts`
- [ ] **Action 5.1: Create `useFeatureFlag` Hook**
  - [ ] Create the new file.
  - [ ] Add the following code for a clean, reusable hook to check flags.
    ```typescript
    import { useOrganization } from '@/lib/organization/application/hooks/use-organization'; // Adjust path as needed

    /**
     * Checks if a specific feature is enabled for the current active organization.
     * @param featureName The name of the feature flag (e.g., 'dam', 'tts').
     * @returns `true` if the feature is enabled, `false` otherwise.
     */
    export const useFeatureFlag = (featureName: string): boolean => {
      const { activeOrganization } = useOrganization();
      const flags = activeOrganization?.feature_flags as Record<string, boolean> | undefined;
      
      // Default to false if flags are not present or the specific flag is not set.
      return flags?.[featureName] ?? false;
    };
    ```
- [ ] **Action 5.2: Write Unit Tests for Hook**
  - [ ] Test the hook with mock context data.
  - [ ] Test cases: flag is true, flag is false, flag is missing, organization context is null.

## Phase 3: Pilot Integration & Testing

**Step 6: Gate the "Text-to-Speech" (TTS) Feature**
- [ ] **File:** Main Navigation Component (e.g., `components/layout/Sidebar.tsx`)
- [ ] **Action 6.1: Protect the Navigation Link (UI)**
  - [ ] Import and use the new `useFeatureFlag` hook.
  - [ ] Conditionally render the navigation item for TTS.
    ```tsx
    const isTtsEnabled = useFeatureFlag('tts');
    ...
    {isTtsEnabled && <NavItem href="/ai-playground/text-to-speech" label="Text-to-Speech" />}
    ```
- [ ] **File:** `app/(protected)/ai-playground/text-to-speech/page.tsx`
- [ ] **Action 6.2: Protect the Page Route (UI)**
  - [ ] At the top of the page component, use the hook to check the `tts` flag.
  - [ ] If the flag is `false`, render a "Feature Not Enabled" component or redirect the user.
- [ ] **File:** `lib/tts/application/actions/generateTts.action.ts` (or equivalent server action)
- [ ] **Action 6.3: Protect the Backend Action (Security)**
  - [ ] In the main server action for TTS, get the user's active organization and its `feature_flags`.
  - [ ] Add a check at the very beginning of the action. If `feature_flags.tts` is not `true`, throw an authorization error. This is the critical security step.

**Step 7: End-to-End Testing**
- [ ] **Action 7.1: Manual E2E Testing**
  - [ ] **Scenario 1 (Flag Enabled):**
    - [ ] Using a test organization, set `feature_flags` in the database to `{"tts": true}`.
    - [ ] Log in as a user from that organization.
    - [ ] **Verify:** The TTS link is visible in the navigation.
    - [ ] **Verify:** The TTS page loads and functions correctly.
  - [ ] **Scenario 2 (Flag Disabled):**
    - [ ] Using a different test organization, set `feature_flags` to `{}` or `{"tts": false}`.
    - [ ] Log in as a user from that organization.
    - [ ] **Verify:** The TTS link is NOT visible in the navigation.
    - [ ] **Verify:** Attempting to navigate directly to the `/ai-playground/text-to-speech` URL shows the "Feature Not Enabled" message.
    - [ ] **Verify:** Any attempt to call the TTS generation action fails with an error.

## Phase 4: Future Work (Post-MVP)

- [ ] **Rollout:** Apply the feature flag pattern to other key features (DAM, Reporting, etc.) as needed.
- [ ] **Administration UI:** Build a UI in the Super Admin panel to allow for easy toggling of feature flags for any organization, removing the need for direct database edits. 