# Quick Tips: Managing Node.js Processes

This file contains helpful command-line snippets for finding and stopping stuck Node.js processes, often needed when a development server (like `npm run dev`) doesn't shut down properly and keeps a port occupied (e.g., 3000, 3001).

---

## Finding the Process ID (PID) using a Port

### Windows (Command Prompt or PowerShell)

```bash
# Find the PID using port 3000
netstat -ano | findstr ":3000" 
```
* Look for lines with `LISTENING`. The last number on that line is the PID.

---

## Stopping a Process by PID

### Windows (Command Prompt or PowerShell - Requires Admin Privileges)

```bash
# Forcefully stop the process with PID <PID_NUMBER>
taskkill /F /PID <PID_NUMBER>
```
* Replace `<PID_NUMBER>` with the actual PID you found using `netstat`.

---

## Forcefully Stopping All Node.js Processes (Use with Caution!)

This is a more aggressive approach if you can't identify the specific PID or have multiple stuck processes.

### Windows (Command Prompt or PowerShell - Requires Admin Privileges)

```bash
# Forcefully stop all processes named node.exe and their child processes
taskkill /F /IM node.exe /T 
```

**Warning:** Stopping all Node processes might affect other unrelated Node applications running on your system (like your IDE's language server, background tasks, etc.). Use the port-specific method first if possible.

---

## Running Automated Tests (Vitest)

These commands use the scripts defined in `package.json` to run the Vitest test suite.

### Run All Tests in Terminal

```bash
npm test
# or shorthand:
npm t
```
* Executes all tests found by Vitest based on the configuration (`vitest.config.ts`).
* Displays results directly in the terminal.

### Run All Tests in Terminal (Verbose Output)

```bash
# Option 1: Using the --verbose flag
npm test -- --verbose

# Option 2: Using the verbose reporter
npm test -- --reporter verbose

# Option 2: running the test and auto run when needed
npm run test:watch
```
* Shows the hierarchy of `describe` and `it` blocks along with pass/fail status.
* Note the extra `--` needed to pass flags through npm to the Vitest command.

### Run Tests with Graphical UI

```bash
npm run test:ui
```
* Starts the Vitest UI, typically opening it in your browser.
* Allows you to interactively view test results, filter tests, and see detailed output.

---

## Running Storybook

These commands manage the Storybook UI development environment.

### Start Storybook Development Server

```bash
# Assuming pnpm is the package manager used in the project
pnpm run storybook
```
* Starts the Storybook server, typically on `http://localhost:6006`.
* Allows you to view and interact with your component stories.

### Build Storybook for Deployment

```bash
pnpm run build-storybook
```
* Creates a static build of your Storybook in the `storybook-static` directory.
* This static site can be deployed to services like Vercel, Netlify, GitHub Pages, etc.

### Run Storybook Tests (Vitest)

```bash
# Note: Requires the experimental test addon setup
npx vitest --project=storybook
```
* Runs tests specifically configured for the Storybook environment using the Vitest workspace.
* Useful for interaction tests or tests dependent on Storybook setup. 