
# Product Requirements Document (PRD): Visual Playbook Automation System

## Overview
This system enables users to create and execute visual playbooks that automate key marketing and operational tasks such as ad campaign creation, social media posting, content generation, reporting, and file processing. It leverages internal APIs (e.g., speech-to-text, TTS, DAM), and integrates with external services like Facebook and Slack.

---

## Core Components

### 1. Visual Playbook Builder (Frontend)
**Tech:** React Flow (embedded in Next.js)

#### Features:
- Drag-and-drop nodes (e.g., TTS, Meta Post, Email Monitor)
- Custom interactive node UIs for:
  - Script input
  - Asset selection from DAM
  - Page/Ad settings for Meta
- Connection lines between nodes
- Save/load playbooks as JSON
- Trigger manually or via schedule/event

---

### 2. Workflow Executor (Backend)
**Tech:** Node.js (Next.js API routes, optional: queue with BullMQ or Temporal)

#### Features:
- Interpret playbook JSON and execute nodes in order
- Integrate with internal services:
  - Speech-to-text
  - TTS generation
  - Script generation via GPT/LangChain
  - DAM API for asset retrieval/upload
- External integrations:
  - Facebook Graph API (create post or campaign)
  - Slack messaging
  - Email parsing (IMAP or webhook)

---

## DAM (Digital Asset Management) MVP

### Features:
- **Upload & store** media (video, audio, images, PDFs, scripts)
- **Metadata tagging** (e.g., `type`, `tags`, `created_by`, `title`)
- **Asset preview** (image/video player, text viewer)
- **Search & filter** (by tag, type, keyword)
- **Secure URL access** (via Supabase Storage or S3)
- **Workflow-ready API**:
  - `GET /assets`
  - `POST /upload`
  - `PATCH /assets/:id/tags`
  - Optional: transcript linking, usage counts

### Optional (Phase 2):
- **Approval system**:
  - `status: pending | approved | rejected`
  - Admin review dashboard
  - Required approval before workflow use

---

## Facebook Integration

### Use Cases:
1. **Create and post a Facebook update**
2. **Create and run an ad campaign**

### Requirements:
- OAuth flow to connect user’s Facebook and fetch:
  - Page access token
  - Page ID
  - Ad account ID
- Store and reuse tokens securely (page token is long-lived)
- Use Marketing API to create campaigns:
  - Campaign → Ad Set → Ad Creative
- Node UI for entering post text, selecting media, setting budget/schedule

---

## LangChain Integration

### Use Cases:
- Generate Facebook post copy from transcripts
- Summarize video/audio scripts
- Classify email content for routing
- Power AI text-generation nodes in playbooks

### Integration:
- Use LangChain in server-side node executor
- Chain together prompt-based steps (summarize → rewrite → post)
- Use variable injection from prior nodes (`{{transcriptText}}`)

---

## Node Types (MVP Examples)

| Node | Function |
|------|----------|
| `RunTTS` | Converts script to audio using internal TTS API |
| `SpeechToText` | Converts video/audio to transcript |
| `CreateFacebookPost` | Posts media and copy to a connected Page |
| `CreateMetaCampaign` | Creates ad campaign with targeting, creative, and budget |
| `UploadToDAM` | Saves asset into DAM with metadata |
| `LoadFromDAM` | Lets user select asset for use in workflow |
| `GenerateScript` | Uses GPT/LangChain to generate marketing script |
| `EmailMonitor` | Reads inbox, classifies messages, routes to Slack/CRM |
| `ScheduleTrigger` | Executes workflow on a scheduled interval |

---

## Scheduling and Execution
- Support for:
  - Manual trigger
  - Cron-like schedules (`node-cron`, Supabase edge functions)
  - Event-based execution (e.g., new email, DAM upload)
- Track status per playbook run
- Optional webhook callback system for third-party notifications

---

## Future Enhancements
- Visual versioning of playbooks
- Conditional logic between nodes (if/else, split paths)
- Chat-to-playbook creation using LLM + LangChain
- Multi-tenant workspace support
