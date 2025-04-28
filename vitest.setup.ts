import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Suppress console.log messages during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
// Optionally, suppress other console methods too:
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

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