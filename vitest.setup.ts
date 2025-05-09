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
    // Use React.createElement instead of JSX
    return React.createElement('img', props);
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