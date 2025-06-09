# Feature Entitlement: Implementation Guide

**Related Document:** [Product Requirements](./product-requirements.md)

This guide details the technical plan for implementing the Feature Entitlement system. The work is broken down into an initial MVP to build the core system, followed by phases for rolling out the system to all relevant features.

---

## Phase 1: MVP - Build the Core System & Gate One Pilot Feature

The goal of the MVP is to build the essential, reusable plumbing for feature flags and apply it to a single feature as a proof-of-concept. We will use the **"Text-to-Speech" (TTS)** feature as our pilot.

### MVP Steps:

**1. Domain Layer: Update the `Organization` Entity**
-   **Location:** `lib/organization/domain/entities/`
-   **Action:** Add the `feature_flags` attribute (as a `Record<string, boolean>`) to the `Organization` entity definition. This represents the set of features an organization is entitled to.

**2. Infrastructure Layer: Persist and Fetch Flags**
-   **2.1. Create Database Migration**
    -   **Location:** `supabase/migrations/`
    -   **Action:** Create a new migration file to add a `JSONB` column to the `organizations` table.
        ```sql
        -- Migration SQL
        ALTER TABLE public.organizations
        ADD COLUMN feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

        COMMENT ON COLUMN public.organizations.feature_flags IS 'Defines which features are enabled. E.g., {"dam": true, "tts": false}';
        ```
-   **2.2. Update Organization Repository**
    -   **Location:** `lib/organization/infrastructure/persistence/supabase/`
    -   **Action:** Ensure the Supabase query that fetches the active organization is updated to select the new `feature_flags` column.

**3. Application Layer: Expose Flags to the App**
-   **Action:** Update the `OrganizationDTO` and the value provided by the `OrganizationContext` to include `feature_flags`. This makes the flags available globally on the client.

**4. Presentation Layer: Build the `useFeatureFlag` Hook**
-   **Location:** `lib/organization/presentation/hooks/`
-   **Action:** Create a new, reusable hook named `useFeatureFlag.ts`.
    ```typescript
    // lib/organization/presentation/hooks/useFeatureFlag.ts
    import { useOrganization } from '@/lib/organization/application/hooks/use-organization';

    /**
     * Checks if a specific feature is enabled for the current active organization.
     * @param featureName The name of the feature flag (e.g., 'dam', 'tts').
     * @returns `true` if the feature is enabled, `false` otherwise.
     */
    export const useFeatureFlag = (featureName: string): boolean => {
      const { activeOrganization } = useOrganization();
      const flags = activeOrganization?.feature_flags as Record<string, boolean> | undefined;
      return flags?.[featureName] ?? false;
    };
    ```

**5. Pilot Implementation: Gate the "Text-to-Speech" Feature**
-   **5.1. Protect the Navigation Link**
    -   **Location:** Main navigation component (e.g., in `components/layout/Sidebar.tsx`)
    -   **Action:** Use the new hook to conditionally render the link to TTS.
        ```tsx
        const isTtsEnabled = useFeatureFlag('tts');
        // ...
        {isTtsEnabled && <NavItem href="/ai-playground/text-to-speech" label="Text-to-Speech" />}
        ```
-   **5.2. Protect the Page Route**
    -   **Location:** `app/(protected)/ai-playground/text-to-speech/page.tsx`
    -   **Action:** At the top of the page component, check the flag. If it's disabled, render a "Feature Not Enabled" component instead of the page content.
-   **5.3. Protect the Backend Action**
    -   **Location:** `lib/tts/application/actions/`
    -   **Action:** In the main server action for TTS, add a check at the beginning to ensure the user's organization has the `tts` flag enabled before proceeding.

---

## Phase 2: Iterative Rollout

Once the MVP is complete and the core pattern is established, apply the feature flag system to other key features. This can be done incrementally.

-   **Target Feature: Digital Asset Management (DAM)**
    -   [ ] Gate the main navigation link with `useFeatureFlag('dam')`.
    -   [ ] Protect the `/dam` page route.
    -   [ ] Add server-side checks to critical DAM actions (e.g., upload, delete).

-   **Target Feature: Reporting**
    -   [ ] Gate the main navigation link with `useFeatureFlag('reporting')`.
    -   [ ] Protect the `/reporting` page route.
    -   [ ] Add server-side checks to reporting server actions.

## Phase 3: Administration UI (Future)

This phase involves building a user interface for managing feature flags, removing the need for direct database edits.

-   [ ] **Super Admin Panel:** Add a section to the super admin panel where an admin can view and toggle feature flags for any organization.
-   [ ] **Organization Settings (Optional):** Consider if organization owners should be able to see a read-only list of their enabled features in their own settings panel. 