# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Test App 1** is a full-stack Next.js 15 application implementing a comprehensive enterprise platform with Domain-Driven Design (DDD) architecture. The application features multi-tenant SaaS capabilities with digital asset management, AI-powered tools, and extensive business automation features.

## Key Technologies & Architecture

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with multi-tenant organization system
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Integration**: OpenAI (GPT-4, embeddings), Replicate (FLUX), ElevenLabs
- **Architecture**: Domain-Driven Design with Clean Architecture patterns
- **Testing**: Vitest, Playwright, React Testing Library
- **State Management**: React Query, Zustand

## Common Development Commands

### Development & Build
```bash
# Start development server with context generation
npm run dev

# Fast development (skips context generation)
npm run dev:fast

# Production build
npm run build

# Build with bundle analysis
npm run analyze

# Clean build artifacts
npm run clean
```

### Testing
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run single test file
npx vitest run path/to/test.test.ts
```

### Code Quality
```bash
# Lint code
npm run lint

# Generate contexts (for monitoring)
npm run generate:contexts

# Performance analysis
npm run perf
```

### Development Tools
```bash
# Start Storybook
npm run storybook

# Run Lighthouse analysis
npm run lighthouse
```

## Architecture Overview

### Domain-Driven Design Implementation

The codebase follows a sophisticated DDD architecture with clear layer separation:

#### Core Domains
- **`lib/chatbot-widget/`**: Complete DDD implementation with AI chat, lead management, knowledge base
- **`lib/dam/`**: Digital Asset Management with full DDD structure
- **`lib/image-generator/`**: AI image generation using FLUX models
- **`lib/tts/`**: Text-to-speech functionality with ElevenLabs integration
- **`lib/auth/`**: Authentication and authorization services

#### Layer Structure (Following DAM as DDD Blueprint)
```
lib/{domain}/
├── domain/           # Pure business logic
│   ├── entities/     # Domain entities with business methods
│   ├── value-objects/ # Immutable domain concepts
│   ├── services/     # Domain services for business logic
│   ├── repositories/ # Repository interfaces
│   └── errors/       # Domain-specific errors
├── application/      # Use cases and orchestration
│   ├── use-cases/    # Application-specific business rules
│   ├── services/     # Application coordination services
│   ├── dto/          # Data transfer objects
│   └── actions/      # Next.js server actions
├── infrastructure/   # External concerns
│   ├── persistence/  # Supabase repositories
│   ├── providers/    # External API clients
│   └── composition/  # Dependency injection
└── presentation/     # UI and entry points
    ├── components/   # React components
    ├── hooks/        # React hooks
    └── types/        # Presentation types
```

### Multi-Tenant Architecture

The application implements sophisticated multi-tenancy:
- **Organizations**: Primary tenant boundary with RLS policies
- **User Management**: Role-based access control (Admin, Member, Super Admin)
- **Data Isolation**: Supabase Row Level Security ensures tenant separation
- **Feature Flags**: Organization-level feature toggles

### Key Design Patterns

#### Golden Rule Compliance
- **Single Responsibility**: Each service under 250 lines
- **Result<T, E> Pattern**: Consistent error handling
- **CQRS**: Command Query Responsibility Segregation
- **Repository Pattern**: Clean data access abstraction
- **Composition Root**: Centralized dependency injection

#### Error Handling
```typescript
// Domain-specific errors with context
export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
}

// Result pattern for safe operations
export type Result<T, E = Error> = Success<T> | Failure<E>;
```

## Development Guidelines

### Code Organization
- Use feature-based organization by domain
- Follow DDD layer boundaries strictly
- Co-locate tests with implementation
- Use barrel exports (`index.ts`) for clean imports

### Server Actions Pattern
```typescript
'use server';

export async function processAction(input: FormData) {
  try {
    const service = CompositionRoot.getApplicationService();
    return await service.processRequest(input);
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.toDto() };
    }
    // Handle unexpected errors
    throw error;
  }
}
```

### Component Structure
- Single responsibility components under 200-250 lines
- Use React Query for server state management
- Implement proper error boundaries
- Theme-aware styling with CSS custom properties

### Testing Strategy
- Unit tests for domain logic
- Integration tests for use cases
- E2E tests for critical user flows
- Component tests with Testing Library

## Database & Storage

### Supabase Configuration
- **Development**: Project ID `zzapbmpqkqeqsrqwttzd`
- **Production**: Project ID `awtjzxyuhcejzxmzoqwr`
- **Row Level Security**: Comprehensive tenant isolation
- **Storage**: File storage with CDN distribution

### Key Tables
- `organizations`: Multi-tenant boundary
- `profiles`: User management with roles
- `assets`, `folders`: DAM system
- `chat_sessions`, `chat_messages`: AI conversations
- `leads`: Lead management and analytics

## AI Integration

### OpenAI Services
- **GPT-4**: Conversational AI in chatbot widget
- **Embeddings**: Semantic search for knowledge base
- **Token Management**: Efficient context window handling

### Replicate Integration
- **FLUX Models**: Text-to-image and image editing
- **Provider Abstraction**: Extensible AI service architecture

### ElevenLabs Integration
- **Voice Synthesis**: Text-to-speech functionality
- **Voice Models**: Multiple voice options

## Environment Configuration

### Development Environment
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# AI Service Keys
OPENAI_API_KEY=[openai-key]
REPLICATE_API_TOKEN=[replicate-key]
ELEVENLABS_API_KEY=[elevenlabs-key]
```

### Deployment
- **Vercel**: Frontend deployment with edge functions
- **Supabase**: Database and storage hosting
- **Environment Separation**: Dev/staging/production isolation

## Performance Optimization

### Build Configuration
- **Turbopack**: Fast development builds
- **Bundle Analysis**: Performance monitoring
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component

### Caching Strategy
- **React Query**: Intelligent server state caching
- **Context Generation**: Automated context discovery
- **Edge Functions**: Serverless function optimization

## Security Considerations

### Authentication & Authorization
- **Supabase Auth**: Secure authentication flow
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure token handling

### Data Protection
- **Input Validation**: Comprehensive validation with Zod
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Built-in Next.js protections

## Monitoring & Analytics

### Error Tracking
- **Domain Error Categorization**: Business-specific error handling
- **Error Context**: Rich error information for debugging
- **Performance Monitoring**: Bundle analysis and runtime metrics

### Usage Analytics
- **Feature Adoption**: Track feature usage patterns
- **User Behavior**: Conversation analytics
- **Performance Metrics**: Load times and user interactions

## Development Workflow

### Feature Development
1. **Domain Analysis**: Identify correct domain placement
2. **Use Case Design**: Define application use cases
3. **Implementation**: Follow DDD layer patterns
4. **Testing**: Comprehensive test coverage
5. **Integration**: Ensure clean boundaries

### Code Review Guidelines
- **Architecture Compliance**: Verify DDD patterns
- **Performance**: Check for optimization opportunities
- **Security**: Review for vulnerabilities
- **Testing**: Ensure adequate test coverage

## Common Issues & Solutions

### Build Issues
- **Context Generation**: Run `npm run generate:contexts` if build fails
- **Type Errors**: Check TypeScript configuration and imports
- **Bundle Size**: Use `npm run analyze` to identify large bundles

### Development Issues
- **Hot Reloading**: Use `npm run dev:fast` for faster development
- **Database Sync**: Ensure Supabase migrations are applied
- **Environment Variables**: Verify all required variables are set

### TypeScript Error Patterns & Prevention

#### Common Error Causes
1. **Duplicate Class Declarations**
   - **Cause**: Copy-paste errors, merge conflicts, or AI code generation mishaps
   - **Symptoms**: `Unexpected token. A constructor, method, accessor, or property was expected.`
   - **Prevention**: Use TypeScript compiler frequently during development

2. **Module Resolution Errors**
   - **Cause**: Creating exports for non-existent files, overly optimistic barrel exports
   - **Symptoms**: `Cannot find module './ServiceName' or its corresponding type declarations`
   - **Prevention**: Always verify file existence before creating exports

3. **Orphaned Methods Outside Classes**
   - **Cause**: Incomplete refactoring, malformed class structures
   - **Symptoms**: `Declaration or statement expected`
   - **Prevention**: Review generated code before finalizing

#### Error Prevention Strategies
```bash
# Run TypeScript compiler frequently during development
npx tsc --noEmit --project tsconfig.json

# Check specific domain for errors
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "domain-name"

# Use pre-commit hooks to catch syntax errors
npm run lint && npx tsc --noEmit
```

#### Best Practices for AI-Assisted Development
1. **Verify File Existence**: Always check if referenced modules exist before creating exports
2. **Incremental Development**: Create and test one service at a time rather than comprehensive structures
3. **Code Review**: Review all generated code for structural integrity
4. **TypeScript Strict Mode**: Use strict TypeScript configuration to catch issues early
5. **Template Validation**: Don't assume components exist based on domain patterns

#### Example Prevention Code
```typescript
// ✅ GOOD: Verify before exporting
import { existsSync } from 'fs';
if (existsSync('./ServiceName.ts')) {
  export { ServiceName } from './ServiceName';
}

// ✅ GOOD: Incremental barrel exports
export { ExistingService } from './ExistingService';
// TODO: Add new services as they are implemented

// ❌ BAD: Optimistic exports without verification
export { NonExistentService } from './NonExistentService'; // File doesn't exist
```

#### Rapid Development Guidelines
- **In Enterprise Development**: Verify assumptions and test incrementally
- **AI-Assisted Development**: Don't over-rely on generated code without verification
- **Team Collaboration**: Use proper merge conflict resolution strategies
- **Complex Refactoring**: Break large architectural changes into smaller, testable steps

## Future Architecture Plans

### Planned DDD Migrations
- **TTS Domain**: Migrate to full DDD structure
- **Authentication Domain**: Implement domain-driven auth
- **Team Management**: DDD-based team operations
- **Marketing Automation**: CRM domain with DDD

### Enhancement Opportunities
- **Domain Events**: Cross-domain communication
- **Event Sourcing**: Audit trail capabilities
- **Performance Optimization**: Advanced caching strategies
- **API Documentation**: Automated API documentation

---

This codebase represents a production-ready, enterprise-grade application with sophisticated DDD architecture, comprehensive AI integration, and modern development practices. The architecture supports both rapid feature development and long-term maintainability.