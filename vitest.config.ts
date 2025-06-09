import { defineConfig, UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin'
// import dotenv from 'dotenv' // No longer explicitly needed here if envFiles works

// All manual dotenv loading and viteTestEnv construction removed.
// We will rely on the envFiles option below.

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, 
    environment: 'jsdom', 
    setupFiles: './vitest.setup.ts', 
    envFiles: ['./.env.local'], // Use Vitest's built-in option for .env.local
    // env: { ... } // Removed explicit env population, relying on envFiles
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/tests/e2e/**', // Exclude Playwright E2E tests
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Migrated from vitest.workspace.ts to fix deprecation warning
  projects: [
    {
      // Default project configuration (inherits from above)
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        envFiles: ['./.env.local'],
        exclude: [
          '**/node_modules/**',
          '**/.next/**',
          '**/tests/e2e/**', // Exclude Playwright E2E tests
        ],
      },
    },
    {
      // Storybook test project
      plugins: [
        storybookTest({ configDir: path.join(__dirname, '.storybook') }),
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{ browser: 'chromium' }]
        },
        setupFiles: ['.storybook/vitest.setup.ts'],
      },
    },
  ],
} as UserConfig) 