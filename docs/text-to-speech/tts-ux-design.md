# Text-to-Speech (TTS) UX Design

This document outlines the proposed user experience and interface design for the Text-to-Speech feature located within the AI Playground.

**Core Goal:** Provide a simple, intuitive interface for users to convert text into natural-sounding speech, select different voices, and listen to/download the result.

## Interface Layout

A single-page interface using a two-column layout on larger screens, stacking vertically on smaller screens.

**Diagram:**
```
+-----------------------------+-----------------------------+
|      INPUT & CONFIG         |           OUTPUT            |
|                             |                             |
| - Textarea                  | - Audio Player (conditional)|
| - Voice Select (+ Preview)  | - Download Btn (conditional)|
| - (Optional Settings)       | - Status/Error Display      |
| - Generate Button           |                             |
|                             |                             |
+-----------------------------+-----------------------------+
```

**ASCII Representation:**
```ascii
+---------------------------------------------------------------------+
|                       AI Playground: Text to Speech                 |
+--------------------------------------+------------------------------+
|          INPUT & CONFIGURATION       |            OUTPUT            |
+--------------------------------------+------------------------------+
|                                      |                              |
|  Enter text to synthesize...         |  [ Status/Error Message ]    |
| +----------------------------------+ |                              |
| |                                  | |                              |
| | (User types or pastes text here) | |                              |
| |                                  | |                              |
| |                                  | |                              |
| +----------------------------------+ |                              |
|                                      |                              |
|  Voice: [ Select Voice v ]           |  (Audio Player Appears Here) |
|         +-----------------+          | +--------------------------+ |
|         | Language 1      |          | | [ > Play/Pause | Progress | Vol ] | |
|         |  - Gender 1     |          | +--------------------------+ |
|         |    - Voice A [>]|          |                              |
|         |    - Voice B [>]|          |                              |
|         |-----------------|          |                              |
|         | Language 2      |          | [ Download Audio ] (Button)  |
|         |  - ...          |          |                              |
|         +-----------------+          |                              |
|                                      |                              |
|  [+] Advanced Settings (Optional)    |                              |
| +----------------------------------+ |                              |
| | Speed: [---o----] (Slider)       | |                              |
| | Pitch: [---o----] (Slider)       | |                              |
| +----------------------------------+ |                              |
|                                      |                              |
|  [ Generate Speech ] (Button)        |                              |
|                                      |                              |
+--------------------------------------+------------------------------+
```

## Component Breakdown & Features

### 2. Output Section

*   **Audio Player (Custom Component with Waveform):**
    *   Appears conditionally after successful generation.
    *   Displays an audio waveform visualization synchronized with playback.
    *   Standard controls: play/pause, progress bar (potentially overlaid/integrated with waveform), volume.
    *   Displays audio duration if available.
*   **Download Button (`Button`):**

## Component Mapping (`shadcn/ui` & Custom)

*   **Layout:** CSS Grid / Flexbox
*   **Input:** `Textarea`, `Button`
*   **Selection:** `Select`, `SelectTrigger`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `Button` (for preview)
*   **Settings:** `Accordion`/`Collapsible`, `Slider`, `Label`
*   **Action:** `Button`
*   **Output:** *Custom Waveform Player Component*, `Button`
*   **Feedback:** `Alert`, `AlertDescription`, `AlertTitle`, `useToast` 