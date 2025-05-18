# DAM Search Dropdown: Double-Click Issue

**Issue**

When clicking the "Search for '…'" item in the DAM search dropdown, users had to click twice for the action to fire. The first click cleared focus (blur) on the input, unmounted the dropdown, and never reached the handler.

**Why It Happened**

- **Event Order**: In the browser, `blur` (and component unmount) fires *before* the `click` event.
- **Unmount Before Click**: Clicking outside the input caused the dropdown to close immediately, so the first `click` never triggered the selection handler.

**Fix Applied**

1. **Use `onMouseDown` for Selections**
   - Listen to the `mousedown` (or `pointerdown`) event instead of `click`. 
   - `mousedown` fires *before* the input blur/unmount, guaranteeing the handler runs.

2. **Centralize Navigation in Parent Handler** (`handleMainSearch`)
   - On selection or "Search for…" "mousedown":
     1. Close the dropdown (`setIsDropdownOpen(false)`).
     2. Blur the input (`.blur()` + `setInputFocused(false)`).
     3. Perform navigation via Next.js router (`router.push(...)`).

**Recommended Pattern**

Whenever building any dropdown that auto-closes on blur, always:

- Bind item selection and confirmation actions to `onMouseDown` (or `onPointerDown`).
- Keep all state changes (close, blur) and navigation in a single parent callback to ensure consistency.

This pattern prevents race conditions between unmounting and event handling, ensuring a single click is always enough. 