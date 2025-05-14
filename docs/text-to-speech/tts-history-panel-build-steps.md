Wireframe for History Panel Integration:

Main Page View (Before History Panel is opened):
+--------------------------------------------------------------------------------------------------+
| Localhost:3000/ai-playground/text-to-speech                                [User Icon] [Theme]   |
+--------------------------------------------------------------------------------------------------+
| [Nav Menu] | Documents                                                                           |
|------------+-------------------------------------------------------------------------------------|
|            | AI Playground: Text to Speech                                [History Icon (Clock)] |
|            |                                                                                     |
|            | +------------------------------------+  +----------------------------------------+  |
|            | | Input & Configuration              |  | Results                                |  |
|            | |------------------------------------|  |----------------------------------------|  |
|            | | Enter text, select voice...        |  | Generated audio output. You can play,  |  |
|            | |                                    |  | download, or save it to your DAM.      |  |
|            | | [Text to Convert Textarea]         |  |                                        |  |
|            | |  Discover The Joint Chiropractic...|  |   [Waveform Display]                   |  |
|            | |  No insurance is required...       |  |   |> 00:00 -------------o------ 00:29  |  |
|            | |                                    |  |                                        |  |
|            | | [Save Icon] [Load Icon] [Analyze]  |  |   [Copy] [Download] [Save to DAM] [DEL]|  |
|            | |                                    |  +----------------------------------------+  |
|            | | Voice                              |                                              |
|            | | [Alloy           v]                |                                              |
|            | |                                    |                                              |
|            | | [     Generate Speech Button     ] |                                              |
|            | +------------------------------------+                                              |
+--------------------------------------------------------------------------------------------------+

Main Page View (After History Icon is clicked and Panel slides in):
+--------------------------------------+-----------------------------------------------------------+
| Localhost:3000/ai-playground/text-to-speech                                  [User Icon] [Theme] |
+--------------------------------------+-----------------------------------------------------------+
| [Nav Menu] | Documents               | [X Close History]                      Generation History |
|------------+-------------------------|-----------------------------------------------------------|
|            | AI Playground: Text to  | [ Search history... (Optional)         ]                  |
|            | Speech                  |-----------------------------------------------------------|
|            |                         |                                                           |
|            | +---------------------+ | +-------------------------------------------------------+ |
|            | | Input & Config      | | | Item 1:                                               | |
|            | |---------------------| | |  "Discover The Joint Chiropractic, where quality..."  | |
|            | | [Text to Convert]   | | |  Voice: Alloy | Generated: 2 mins ago                 | |
|            | | ...                 | | |  [Play] [Reload to Input] [Save to DAM] [Delete]      | |
|            | |                     | | +-------------------------------------------------------+ |
|            | | Voice               | | | Item 2:                                               | |
|            | | [Alloy   v]         | | |  "Enjoy the expertise of our chiropractors with a..." | |
|            | |                     | | |  Voice: Shimmer | Generated: 10 mins ago              | |
|            | | [Generate Speech]   | | |  [Play] [Reload to Input] [Save to DAM] [Delete]      | |
|            | +---------------------+ | +-------------------------------------------------------+ |
|            |                         | | Item 3:                                               | |
|            |                         | |  "Perfect for maintaining your routine wellness."     | |
|            |                         | |  Voice: Nova | Generated: 1 hour ago                  | |
|            |                         | |  [Play] [Reload to Input] [Save to DAM] [Delete]      | |
|            |                         | +-------------------------------------------------------+ |
|            |                         |                                           [Clear All]     |
+--------------------------------------+-----------------------------------------------------------+

# TTS - Generation History Panel - Build Steps

This document outlines the planned steps to implement the Text-to-Speech Generation History Panel feature, based on the UX design proposal. This panel will allow users to view, replay, reload, and manage their past TTS generations.

**Note:** Steps assume incremental development and testing/review between major phases. This builds upon the foundations laid in `tts-build-steps.md`.

## Phase 1: Backend & Data Model Refinements

**Step 1: Review and Enhance `TtsPrediction` Table & Related Actions**
*   [X] **Review `TtsPrediction` Table:** Ensure all necessary fields for the history panel are present (e.g., `input_text`, `voice_id`, `created_at`, `status`, `output_url`, `output_asset_id`, `source_asset_id`). Consider if a snippet of `input_text` needs to be stored separately or if it can be derived.
*   [X] **Enhance `getTtsHistory` (or create `getTtsGenerationHistory`) Server Action:**
    *   Modify `lib/actions/tts.ts`.
    *   Ensure the action fetches all data required for each history item (text snippet, voice, date, status, relevant IDs).
    *   Implement pagination if the history list can become very long.
    *   Add sorting options (e.g., by date descending).
*   [X] **Server Action for Deleting a History Item:**
    *   This might reuse `deleteTtsPrediction` from `tts-build-steps.md` (Phase 3, Step 16).
    *   Verify it correctly handles deleting the `TtsPrediction` record and associated storage if applicable, and that it's suitable for being called directly from a history item.
*   [X] *Testing:*
    *   Unit tests for any modifications to `getTtsHistory` or the new history-specific fetching action.
    *   Ensure existing tests for `deleteTtsPrediction` cover its use from the history panel perspective.

## Phase 2: Frontend - History Panel UI Structure

**Step 2: History Icon & Panel Shell**
*   [X] **Add History Icon Button:**
    *   In `app/(protected)/ai-playground/text-to-speech/page.tsx`.
    *   Use an appropriate icon (e.g., a clock icon from `lucide-react`).
    *   Manage the open/closed state of the history panel.
*   [X] **Create Main History Panel Component:**
    *   File: `components/tts/TtsHistoryPanel.tsx`.
    *   This component will be a client component (`'use client'`).
    *   Use a slide-in mechanism.
    *   Props: `isOpen: boolean`, `onClose: () => void`.
    *   Include a title (e.g., "Generation History") and a close button within the panel.
*   [X] *Testing:* (Covered by manual testing during development of panel and icon)
    *   Unit test for `TtsHistoryPanel.tsx` basic rendering and open/close behavior.
    *   Verify the history icon button toggles the panel's visibility.

**Step 3: History List & Item Components**
*   [~] **Create History List Component:**
    *   Implemented within `components/tts/TtsHistoryPanel.tsx` which receives and renders the list of history items.
    *   Handles rendering the list, including empty states ("No history yet.") and loading states.
    *   Implements scrolling if the list is long.
*   [X] **Create History Item Card Component:**
    *   File: `components/tts/TtsHistoryItem.tsx`.
    *   Props: `item: TtsPredictionRow` (or a refined type for history).
    *   Displays:
        *   Snippet of the input text (e.g., first 100 characters with an ellipsis).
        *   Voice used (e.g., "Voice: Alloy").
        *   Timestamp (e.g., "Generated: 5 mins ago" or formatted date).
        *   Status if relevant (e.g., "Processing", "Failed").
    *   Action buttons/icons:
        *   `Play`: To play the audio (UI exists, full logic pending).
        *   `Reload to Input`: To load this item's settings back into the main TTS form (Implemented).
        *   `Save to DAM`: If `output_asset_id` is null (UI/Logic Pending).
        *   `View in DAM`: (Was previously `Save to DAM`, now acts as View, conditional logic pending)
        *   `Delete`: To remove the item from history (UI exists, full logic pending).
*   [X] *Testing:* (Covered by manual testing of item display and reload functionality)
    *   Unit tests for `TtsHistoryPanel.tsx` (loading, empty, populated states).
    *   Unit tests for `TtsHistoryItem.tsx` (correct data display, conditional rendering of buttons).

## Phase 3: Frontend - Logic & Integration

**Step 4: Fetching and Displaying History**
*   [X] In `TtsHistoryPanel.tsx`:
    *   Call the `getTtsHistory` action when the panel is opened or on initial load.
    *   Manage loading and error states for the fetch operation.
    *   Pass the fetched data to render `TtsHistoryItem.tsx` components.

**Step 5: Implementing "Play" Functionality**
*   [ ] In `TtsHistoryItem.tsx`:
    *   The "Play" button should trigger audio playback.
    *   Decide if it uses the main `WaveformAudioPlayer` in `TtsInterface.tsx` (by passing the URL and auto-playing) or if each history item can have a mini-player or directly trigger an `<audio>` element.
    *   If `output_url` is from Replicate and potentially temporary, consider behavior if it has expired. Priority to `output_asset_id` if available.

**Step 6: Implementing "Reload to Input" Functionality**
*   [X] In `TtsHistoryItem.tsx`:
    *   The "Reload to Input" button should take the `input_text` and `voice_id` from the history item.
    *   This will require a way to communicate these values back to `app/(protected)/ai-playground/text-to-speech/page.tsx` to update its form state (e.g., via a callback prop passed down or a shared state management solution).
    *   The main form in `TtsInterface.tsx` should then be populated with this data.

**Step 7: Implementing "Save to DAM" from History**
*   [ ] In `TtsHistoryItem.tsx`:
    *   The "Save to DAM" button should only be visible if `output_asset_id` is null for the history item.
    *   OnClick, it should call the `saveTtsAudioToDam` action (from `lib/actions/tts.ts`).
    *   Requires `predictionId` and the temporary `outputUrl`.
    *   On success, the history list should refresh to reflect the change (item now has an `output_asset_id`).

**Step 8: Implementing "Delete" from History**
*   [~] In `TtsHistoryItem.tsx`:
    *   The "Delete" button should trigger the `deleteTtsPrediction` action. (Button and placeholder callback exist)
    *   Use an `AlertDialog` for confirmation before deleting. (Pending)
    *   On successful deletion, refresh the history list. (Pending)
    *   Display toast notifications for success/failure. (Pending)

**Step 9: Real-time Updates & State Management**
*   [X] **History Refresh:**
    *   When a new TTS is generated and successfully saved (either automatically or via "Save to DAM"), the history panel (if open) or its data source should be updated (achieved by panel refetching data on open/refresh button).
    *   When an item is deleted from history, the list should update. (Pending full delete implementation)
*   [X] **State Management for History Data:**
    *   Decided where the fetched history data will live (local state in `TtsHistoryPanel.tsx`, with callbacks from `page.tsx`).
    *   This will influence how actions in `TtsHistoryItem.tsx` trigger updates.

## Phase 4: Persistence, Polish & Advanced Features

**Step 10: Persistence Strategy (If Beyond Session)**
*   [ ] **Current Approach:** History is implicitly persisted via the `TtsPrediction` table.
*   [ ] **Local Storage (Optional Enhancement for Client-Side Optimism/Offline):**
    *   Consider if a subset of history should be cached in local storage for faster initial display or optimistic updates. This adds complexity. For now, relying on server-fetched data is simpler.

**Step 11: (Optional) Search/Filter History**
*   [ ] Add a search input field to `tts-history-panel.tsx`.
*   [ ] Implement client-side filtering of the displayed history items based on the search term (searches `input_text`).
*   [ ] OR, modify `getTtsGenerationHistory` action to accept a search query for server-side searching.

**Step 12: (Optional) "Clear All" History**
*   [ ] Add a "Clear All" button to the `tts-history-panel.tsx`.
*   [ ] Requires a new Server Action: `clearUserTtsHistory`.
    *   Authenticates user.
    *   Deletes all `TtsPrediction` records for that user (and potentially associated files if not linked to DAM assets also used elsewhere).
    *   Use `AlertDialog` for confirmation.
    *   Refresh history list on success.

**Step 13: UI Polish & Accessibility**
*   [ ] Ensure smooth animations for panel slide-in/out.
*   [ ] Implement comprehensive loading states (for initial load, actions like delete/save).
*   [ ] Implement clear error messages and empty states.
*   [ ] Review accessibility: ARIA attributes, keyboard navigation for the panel and its items, focus management.

**Step 14: Testing**
*   [ ] **Unit Tests:**
    *   For all new components (`tts-history-panel.tsx`, `tts-history-list.tsx`, `tts-history-item-card.tsx`).
    *   Cover different states (loading, error, empty, populated).
    *   Test interaction handlers.
*   [ ] **Integration Tests:**
    *   In `tts-interface.tsx`, test the full flow:
        *   Opening the panel.
        *   Fetching and displaying history items.
        *   Interacting with history item actions (Play, Reload, Save, Delete) and verifying UI/data updates.
        *   (If implemented) Search, Clear All.
*   [ ] Test Server Actions related to history management if new ones were added or significantly modified.

**(Review Point: TTS Generation History Panel fully functional and integrated - Pending) 