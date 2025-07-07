# Security Check Command

## Description
Comprehensive security analysis for the Next.js application with focus on multi-tenant SaaS vulnerabilities.

## Usage
`/security-check [scope]`

## Parameters
- `scope` (optional): Target area ('auth', 'api', 'database', 'client', 'all'). Defaults to 'all'.

## Instructions
You are a security expert for this multi-tenant Next.js 15 application with Supabase backend.

**Primary Security Areas:**

### 1. Authentication & Authorization
- **Row Level Security (RLS)**: Verify all tables have proper RLS policies
- **Organization Isolation**: Ensure tenant data separation
- **JWT Validation**: Check token handling in API routes
- **Role-Based Access**: Verify role permissions (Admin, Member, Super Admin)
- **Session Management**: Secure cookie handling

### 2. API Route Security
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Parameterized queries only
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Proper origin restrictions
- **Error Handling**: No sensitive data in error responses

### 3. Database Security
- **RLS Policies**: organization_id filtering on all tables
- **Service Role Usage**: Minimize elevated permissions
- **Data Encryption**: Sensitive fields protection
- **Backup Security**: Encrypted backups
- **Migration Safety**: No destructive operations

### 4. Client-Side Security
- **XSS Prevention**: Sanitized user inputs
- **CSRF Protection**: Anti-forgery tokens
- **Content Security Policy**: Strict CSP headers
- **Environment Variables**: No secrets in client code
- **Bundle Analysis**: No sensitive data leakage

### 5. Infrastructure Security
- **Environment Separation**: Dev/staging/prod isolation
- **API Key Management**: Proper secret storage
- **HTTPS Enforcement**: TLS everywhere
- **Dependency Scanning**: Vulnerable packages
- **Logging Security**: No sensitive data in logs

**Analysis Process:**
1. **Code Scanning:**
   - Search for hardcoded secrets/passwords
   - Check for SQL injection vulnerabilities
   - Verify input validation patterns
   - Review authentication flows

2. **Database Review:**
   - Audit RLS policies on all tables
   - Check organization_id enforcement
   - Verify service role permissions
   - Review migration scripts

3. **API Audit:**
   - Check all API routes for auth requirements
   - Verify input validation with Zod
   - Review error handling patterns
   - Check rate limiting implementation

4. **Client-Side Analysis:**
   - Search for exposed API keys
   - Check XSS prevention measures
   - Review form handling and sanitization
   - Verify CSP implementation

**Security Patterns to Check:**
```typescript
// Good: Proper organization filtering
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('organization_id', orgId); // ✅

// Bad: Missing organization filter
const { data } = await supabase
  .from('table')
  .select('*'); // ❌ Potential data leak

// Good: Input validation
const schema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member'])
});
const result = schema.parse(input); // ✅

// Bad: No validation
const email = formData.get('email'); // ❌ Unsafe
```

**Output Format:**
```
## Security Analysis Results

### 🛡️ Security Score: [X/10]

### ✅ Secure Areas:
- [Area]: [Description of good practices found]

### ⚠️ Warnings:
- [File/Area]: [Medium-risk issue with recommendation]

### 🚨 Critical Issues:
- [File/Area]: [High-risk vulnerability requiring immediate fix]

### 📋 Recommendations:
1. [Priority]: [Specific action item]
2. [Priority]: [Specific action item]

### 🔍 Files Analyzed:
- API Routes: [count] files checked
- Database: [count] tables/policies reviewed  
- Components: [count] client components checked
- Configuration: [count] config files reviewed
```

**Focus on multi-tenant data isolation and organization-level security boundaries.**