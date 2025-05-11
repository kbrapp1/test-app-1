// Polyfill for HTMLFormElement.prototype.requestSubmit - APPLIED EARLY
// Placed at the top to ensure it runs before other setups that might interact with forms.
if (typeof HTMLFormElement !== 'undefined' && typeof HTMLFormElement.prototype.requestSubmit === 'undefined') {
  console.log('Polyfilling HTMLFormElement.prototype.requestSubmit for Vitest JSDOM environment (early setup).');
  HTMLFormElement.prototype.requestSubmit = function(submitter) {
    // Basic check: if a submitter button is passed and it has a formNoValidate attribute, respect it.
    // This is a simplified check; real browser behavior is more complex.
    if (submitter && submitter.hasAttribute('formnovalidate')) {
      if (typeof this.submit === 'function') {
        this.submit(); // Bypasses validation
      } else {
        console.error('HTMLFormElement.prototype.submit is not a function (formnovalidate path). Polyfill for requestSubmit failed.');
      }
      return;
    }

    // Standard behavior: try to validate and then submit.
    // JSDOM's form.reportValidity() usually returns true and doesn't prevent submission by default.
    // JSDOM's form.checkValidity() returns true if all constraints are met.
    let isValid = true;
    if (typeof this.checkValidity === 'function') {
      try {
        isValid = this.checkValidity();
      } catch (e) {
        // console.warn('Error during checkValidity in requestSubmit polyfill:', e);
        // Proceed as if valid if checkValidity itself errors, to mimic some browser fallbacks.
      }
    }

    if (isValid) {
      if (typeof this.submit === 'function') {
        this.submit(); // Proceeds with submission
      } else {
        console.error('HTMLFormElement.prototype.submit is not a function. Polyfill for requestSubmit failed.');
      }
    } else {
      // If not valid, typically a browser would fire an 'invalid' event on the invalid controls.
      // JSDOM might do this automatically with reportValidity(), but we ensure submit isn't called.
      // console.log('Form is not valid. Submission prevented by requestSubmit polyfill.');
      // Optionally, try to trigger invalid events on relevant elements if needed for testing form validation feedback.
      // This part can be complex to polyfill accurately.
      if (typeof this.reportValidity === 'function') {
        this.reportValidity(); // Attempt to show validation messages
      }
    }
  };
} else if (typeof HTMLFormElement !== 'undefined') {
  console.log('HTMLFormElement.prototype.requestSubmit already exists or HTMLFormElement is undefined (early setup).');
}

// console.log('--- Vitest Setup ---');
// console.log('SUPABASE_URL (from process.env):', process.env.SUPABASE_URL);
// console.log('SUPABASE_ANON_KEY (from process.env):', process.env.SUPABASE_ANON_KEY);
// console.log('TEST_USER_A_EMAIL (from process.env):', process.env.TEST_USER_A_EMAIL);
// console.log('--------------------');

import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React from 'react'; // Import React for createElement

// --- Mock next/image to unoptimize it for tests ---
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, ...rest } = props; // Destructure and remove next/image specific boolean props
    // Use React.createElement instead of JSX
    // Pass only the remaining props to the native img element
    return React.createElement('img', rest);
  },
}));
// --------------------------------------------------

// Suppress console.log messages during tests
// vi.spyOn(console, 'log').mockImplementation(() => {}); // Keep this commented out for now
// Optionally, suppress other console methods too:
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock window.matchMedia for JSDOM environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, // Default to not matching (desktop)
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but may be needed
    removeListener: vi.fn(), // Deprecated but may be needed
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Add any other global test setup here 