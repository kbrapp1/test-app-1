# Chatbot Widget Anonymous Org Context & API Key Security Task List

This checklist guides the implementation of secure organization context handling and API key validation for anonymous web visitors using the chatbot widget.

## Widget Embed & API Design
- [ ] **Define widget embed API**
    - [ ] Require `orgId` and/or `botId` in widget initialization
    - [ ] Support API key or widget token for secure identification
- [ ] **Document embed code requirements for customers**
    - [ ] Example embed code with orgId/botId/API key
    - [ ] Instructions for secure installation

## Backend API Implementation
- [ ] **API key or widget token validation**
    - [ ] Generate and assign API keys/tokens per org/bot
    - [ ] Store API keys securely in the database
    - [ ] Validate incoming API key/token on every widget request
    - [ ] Map API key/token to orgId (never trust orgId directly from client)
- [ ] **Anonymous session creation**
    - [ ] Accept requests from web visitors without user authentication
    - [ ] Use validated orgId for all chat session and message operations
    - [ ] Log/track anonymous sessions for analytics and abuse prevention
- [ ] **Service context for RLS**
    - [ ] Use a service account JWT or Supabase service role for widget-initiated requests
    - [ ] Ensure all chat data is inserted with the correct orgId
    - [ ] RLS policies enforce orgId scoping for all chat data

## Security & Abuse Prevention
- [ ] **Rate limiting per org and per API key**
    - [ ] Prevent abuse and DDoS from public widgets
- [ ] **Origin validation**
    - [ ] Only allow requests from whitelisted domains (if required)
- [ ] **Audit logging**
    - [ ] Log all widget API requests for monitoring and incident response

## Testing & Validation
- [ ] **Unit and integration tests**
    - [ ] Test API key validation and org mapping
    - [ ] Test chat session creation for anonymous visitors
    - [ ] Test RLS enforcement for chat data
- [ ] **Manual QA**
    - [ ] Simulate widget requests from multiple orgs and domains
    - [ ] Attempt to spoof orgId or API key (should be denied)

---

**Result:**
- Anonymous web visitors can use the chatbot widget, but all data is securely scoped to the correct organization
- API key/token validation prevents unauthorized access or data leakage
- RLS and backend logic guarantee multi-tenant security for all chat sessions 