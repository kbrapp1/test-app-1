# End-to-End Testing Guide

This directory contains end-to-end tests for the application using Playwright.

## Setup

1. Install dependencies: `pnpm install`
2. Install Playwright browsers: `npx playwright install`
3. Set up environment variables for test authentication

## Test Structure

### `/e2e` - Main test files
- `image-generation.spec.ts` - Core image generation workflow tests
- `dam-integration.spec.ts` - DAM (Digital Asset Management) integration tests  
- `visual-regression.spec.ts` - Visual regression and UI consistency tests
- `auth.setup.ts` - Authentication setup for tests

### `/e2e/helpers` - Test utilities
- `test-utils.ts` - Reusable helper functions for common operations

## Key Test Categories

### 1. **Image Generation Workflow**
Tests the complete image generation process:
- Prompt input and generation
- History panel functionality  
- **CRITICAL**: History panel image sharpness after reopen (fixes recent bug)
- Multiple generations and history management
- Image action buttons (download, copy, edit)

### 2. **DAM Integration**
Tests integration between image generation and Digital Asset Management:
- Saving generated images to DAM
- Folder organization for AI-generated assets
- Status synchronization between generation history and DAM

### 3. **Visual Regression**
Prevents UI layout and styling regressions:
- Page layout consistency
- Responsive design across devices
- Theme switching (light/dark mode)
- Component interaction states

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with interactive UI
pnpm test:e2e:ui

# Run in headed mode (visible browser)
pnpm test:e2e:headed

# Debug mode (step through tests)
pnpm test:e2e:debug

# Run specific test file
npx playwright test image-generation.spec.ts

# Run specific test
npx playwright test -g "history panel images remain sharp"
```

## Environment Variables

Create a `.env.local` file or set these environment variables:

```bash
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

## Critical Tests

### **History Panel Bug Prevention**
The most important test is `"CRITICAL: history panel images remain sharp after reopen"` in `image-generation.spec.ts`. This test prevents regression of the blur/loading issue that was recently fixed.

**What it tests:**
1. Generate an image
2. Open history panel → verify images are sharp
3. Close history panel  
4. Reopen history panel → **verify images are still sharp (not blurred)**

This test catches the specific browser caching vs. component state management issue that caused images to appear blurred when reopening the history panel.

## Test Data Management

- Tests create temporary data (images, folders) during execution
- Cleanup helpers in `test-utils.ts` remove test data after completion
- Use descriptive names for test data to avoid conflicts with real user data

## Browser Configuration

Tests run on:
- **Chromium** (primary)
- **Firefox** 
- **WebKit** (Safari)

Mobile and tablet viewports are tested in visual regression tests.

## Debugging Failed Tests

1. **Screenshots**: Automatically captured on failure
2. **Videos**: Recorded for failed tests  
3. **Traces**: Available for debugging complex interactions
4. **Headed mode**: Run `pnpm test:e2e:headed` to see browser actions
5. **Debug mode**: Run `pnpm test:e2e:debug` to step through tests

## Adding New Tests

1. Follow the existing test patterns
2. Use `data-testid` attributes for reliable element selection
3. Add helper functions to `test-utils.ts` for reusable operations
4. Include cleanup for any test data created
5. Consider both positive and negative test scenarios

## CI/CD Integration

Tests are configured to:
- Start the dev server automatically
- Run in headless mode on CI
- Retry failed tests (2 retries on CI)
- Generate HTML reports
- Fail the build if critical tests fail

The tests provide confidence that core user workflows function correctly and help prevent regressions in critical features like the image generation and history management system. 