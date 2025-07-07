# API Documentation Generator Command

## Description
Generate comprehensive API documentation for Next.js API routes with proper TypeScript interfaces.

## Usage
`/api-docs [scope]`

## Parameters
- `scope` (optional): Specific API area ('auth', 'dam', 'chatbot', 'all'). Defaults to 'all'.

## Instructions
You are an API documentation expert for this Next.js 15 multi-tenant application.

**Documentation Scope:**
- All API routes in `app/api/`
- Request/response schemas with Zod
- Authentication requirements
- Organization-level permissions
- Error responses and codes
- Rate limiting information
- Example requests/responses

**Documentation Format:**

### API Route Structure:
```markdown
## [METHOD] /api/endpoint

### Description
[Clear description of what this endpoint does]

### Authentication
- **Required**: Yes/No
- **Roles**: [Admin, Member, Super Admin]
- **Organization**: Required/Optional

### Request
**Headers:**
- `Authorization: Bearer <token>` (if auth required)
- `Content-Type: application/json`

**Body Schema:**
\`\`\`typescript
interface RequestBody {
  field: string;
  optionalField?: number;
}
\`\`\`

**Example Request:**
\`\`\`curl
curl -X POST /api/endpoint \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
\`\`\`

### Response
**Success (200):**
\`\`\`typescript
interface SuccessResponse {
  success: true;
  data: ResponseData;
}
\`\`\`

**Error Responses:**
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing/invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "example",
    "field": "value"
  }
}
\`\`\`
```

**Analysis Process:**
1. **Route Discovery**: Scan all files in `app/api/`
2. **Schema Analysis**: Extract Zod schemas and TypeScript interfaces
3. **Auth Analysis**: Check authentication middleware usage
4. **Error Patterns**: Document common error responses
5. **Examples**: Generate realistic request/response examples

**Key Areas to Document:**

### 1. Authentication APIs
- `/api/auth/*` - User authentication flows
- Organization switching
- Role management
- Session handling

### 2. DAM APIs
- `/api/dam/*` - Digital Asset Management
- File upload/download
- Folder operations
- Asset metadata

### 3. Chatbot APIs  
- `/api/chatbot-widget/*` - AI chat functionality
- Message processing
- Knowledge base operations
- Lead capture

### 4. Team Management
- `/api/team/*` - Organization and user management
- Member invitations
- Role assignments
- Organization settings

### 5. Utility APIs
- Health checks
- Configuration endpoints
- Monitoring APIs

**Documentation Structure:**
```
# API Documentation

## Overview
- Base URL: [environment URLs]
- Authentication: JWT Bearer tokens
- Content-Type: application/json
- Rate Limiting: [limits]

## Authentication
[Auth flow documentation]

## Core Concepts
### Organizations
[Multi-tenant explanation]

### Roles & Permissions
[RBAC documentation]

## API Reference

### Authentication APIs
[Detailed endpoint docs]

### [Domain] APIs
[Domain-specific endpoints]

## Error Handling
[Common error patterns]

## SDKs & Examples
[Code examples in different languages]
```

**TypeScript Integration:**
- Extract interfaces from API route files
- Document Zod schemas as request/response types
- Include type definitions for client-side usage
- Generate TypeScript SDK interfaces

**Output Format:**
```
## API Documentation Generated

### 📚 Documentation Summary:
- **Total Endpoints**: [count]
- **Authenticated**: [count] 
- **Public**: [count]
- **Domains Covered**: [list]

### 📝 Generated Files:
- `docs/api/README.md` - Overview and getting started
- `docs/api/authentication.md` - Auth flows and security
- `docs/api/endpoints/[domain].md` - Domain-specific APIs
- `docs/api/types.ts` - TypeScript definitions
- `docs/api/examples/` - Request/response examples

### 🔍 Analysis Results:
- **Well-documented**: [count] endpoints with complete schemas
- **Missing schemas**: [count] endpoints need Zod validation
- **Auth coverage**: [percentage]% of endpoints have auth requirements
- **Error handling**: [percentage]% consistent error responses

### 🚨 Issues Found:
- Missing input validation: [list of endpoints]
- Inconsistent error responses: [list of issues]
- Authentication gaps: [security concerns]

### 📋 Recommendations:
1. Add Zod schemas to endpoints missing validation
2. Standardize error response format
3. Add rate limiting to high-traffic endpoints
4. Implement request/response logging
```

**Always include realistic examples and maintain consistency across all documented endpoints.**