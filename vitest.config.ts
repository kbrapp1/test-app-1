import { defineConfig, UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
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
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
} as UserConfig) 