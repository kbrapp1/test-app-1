import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use Vitest globals (describe, it, expect, etc.)
    environment: 'jsdom', // Use JSDOM for browser-like environment
    setupFiles: './vitest.setup.ts', // Setup file for global test utilities
    // You might want to exclude certain directories
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      // Add any other directories you want to exclude
    ],
  },
  resolve: {
    alias: {
      // Match the alias defined in tsconfig.json
      '@': path.resolve(__dirname, './'),
    },
  },
}) 