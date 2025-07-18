#!/usr/bin/env node

/**
 * Development Quality Check Script
 * Runs TypeScript and ESLint checks on file changes during development
 */

const { execSync } = require('child_process');
const chokidar = require('chokidar');

let isRunning = false;

function runQualityChecks() {
  if (isRunning) return;
  isRunning = true;

  console.log('\x1b[34m🔍 Running quality checks...\x1b[0m');
  
  try {
    // TypeScript check
    console.log('\x1b[33m📝 Checking TypeScript...\x1b[0m');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('\x1b[32m✅ TypeScript check passed\x1b[0m');

    // ESLint check
    console.log('\x1b[33m🔧 Running ESLint...\x1b[0m');
    execSync('npx eslint --quiet .', { stdio: 'pipe' });
    console.log('\x1b[32m✅ ESLint check passed\x1b[0m');

    console.log('\x1b[32m\x1b[1m🎉 All quality checks passed!\x1b[0m');
  } catch (error) {
    console.log('\x1b[31m❌ Quality checks failed:\x1b[0m');
    console.log(error.stdout?.toString() || error.message);
  } finally {
    isRunning = false;
  }
}

// Watch for file changes
const watcher = chokidar.watch(['**/*.{ts,tsx,js,jsx}'], {
  ignored: ['node_modules/**', '.next/**', 'dist/**'],
  persistent: true
});

console.log('\x1b[34m👀 Watching for file changes...\x1b[0m');

watcher.on('change', (path) => {
  console.log(`\x1b[36m📄 File changed: ${path}\x1b[0m`);
  setTimeout(runQualityChecks, 500); // Debounce
});

// Run initial check
runQualityChecks();