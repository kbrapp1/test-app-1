
# Useful npm Packages for Visual Playbook Automation System

This document outlines recommended npm packages for implementing a workflow automation platform using React Flow, a custom DAM, AI tools, and integrations with services like Meta and Slack.

---

## Core Visual Workflow

| Package | Purpose |
|--------|---------|
| `reactflow` | Core drag-and-drop workflow UI |
| `zustand` | Lightweight global state management (perfect for node data, selections) |
| `class-variance-authority` / `clsx` | Clean conditional styling for custom nodes |

---

## DAM (Digital Asset Management)

| Package | Purpose |
|--------|---------|
| `@supabase/supabase-js` | Upload, tag, and retrieve files + metadata |
| `react-dropzone` | Drag-and-drop file uploader |
| `uuid` | Generate unique asset IDs |
| `date-fns` | Format/upload dates for assets or reports |

---

## Execution Engine (Workflow Runtime)

| Package | Purpose |
|--------|---------|
| `axios` or `ky` | For calling your internal/external APIs from the executor |
| `cron` | Trigger playbooks on schedule in a lightweight way |
| `bullmq` | Queue system for background processing (if playbooks are async or long-running) |

---

## AI + LangChain

| Package | Purpose |
|--------|---------|
| `langchain` | Node.js LLM orchestration (text generation, summarization) |
| `openai` | Direct GPT-4 or Whisper API calls |
| `@dqbd/tiktoken` | Token estimation to budget LLM inputs |
| `zod` | Schema validation for LangChain input/output consistency |

---

## Meta / Facebook Integration

| Package | Purpose |
|--------|---------|
| `next-auth` | Add Facebook OAuth (for page and ad access token retrieval) |
| `fbgraph` | Lightweight Facebook Graph API wrapper (or just use `fetch`) |

---

## Slack & Email

| Package | Purpose |
|--------|---------|
| `@slack/web-api` | Post messages or alerts to Slack channels from workflows |
| `imap` / `node-imap` | Monitor email inboxes (e.g., for `EmailMonitor` node) |
| `mailparser` | Parse incoming emails to usable JSON for classification |

---

## Utilities

| Package | Purpose |
|--------|---------|
| `dotenv` | Environment variable management (token storage, API keys) |
| `prettier` | Code formatting across nodes and workflows |
| `json2csv` | For converting data reports in playbooks to CSV exports |
| `react-hot-toast` or `sonner` | Feedback/notifications for run results |

---

## Optional UI/UX Enhancers

| Package | Purpose |
|--------|---------|
| `@headlessui/react` | Modal + dropdown logic (e.g., asset picker) |
| `tailwindcss` | Rapid styling for node UIs and admin panels |
| `lucide-react` or `phosphor-react` | Icon libraries for node visuals |
