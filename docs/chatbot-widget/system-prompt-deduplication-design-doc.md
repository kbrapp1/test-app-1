# System Prompt Deduplication & User Content Sanitization - Design Document

## Problem Statement

### Current Issues Identified
1. **Redundant Content**: System prompts contain duplicate sections from multiple services
2. **User Content Conflicts**: Database content with arbitrary formatting (##, ###) breaks prompt structure
3. **Identity Conflicts**: "Business Intelligence Specialist" vs "Lead Capture Specialist" misalignment
4. **Token Inefficiency**: Prompts are 40-50% longer than necessary due to redundancy
5. **Compliance Guidelines Missing**: User-entered compliance guidelines not appearing in prompts

### Log Analysis Findings
From `logs/chatbot-2025-07-06T13-59-21-465Z.log`:
- Multiple duplicate communication guidelines sections
- Conflicting persona definitions
- User-generated content with markdown headings disrupting structure
- Compliance guidelines present but inconsistently formatted

## Architecture Analysis

### Current System Flow
```
User Input (DB) → Multiple Services → System Prompt → AI API
     ↓              ↓                    ↓
- Company Info   PersonaService      Redundant sections
- Compliance    KnowledgeService     Conflicting headings  
- FAQs          DynamicPromptService Mixed formatting
```

### Services Currently Involved
1. **PersonaGenerationService** - Generates template variables for AI persona and identity
2. **KnowledgeBaseService** - Injects knowledge base content
3. **DynamicPromptService** - Coordinates prompt assembly using template engine
4. **PromptTemplateEngine** - Handles template processing with variable substitution
5. **AiConversationService** - Entry point for prompt building

### Key Files Modified
- `lib/chatbot-widget/domain/services/ai-configuration/PersonaGenerationService.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/services/ai-configuration/DynamicPromptService.ts` ✅ COMPLETED
- `lib/chatbot-widget/infrastructure/providers/templating/PromptTemplateEngine.ts` ✅ COMPLETED
- `lib/chatbot-widget/infrastructure/providers/templating/templates/business-persona.template` ✅ COMPLETED
- `lib/chatbot-widget/infrastructure/providers/templating/templates/system-prompt.template` ✅ COMPLETED
- `lib/chatbot-widget/infrastructure/composition/AIConfigurationCompositionService.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/services/content-processing/UserContentSanitizationService.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/services/content-processing/ContentValidationService.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/value-objects/content/SanitizedContent.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/value-objects/content/ContentValidationResult.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/value-objects/content/ContentType.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/errors/ContentValidationError.ts` ✅ COMPLETED
- `lib/chatbot-widget/domain/errors/ContentSanitizationError.ts` ✅ COMPLETED

## Solution Design

### DDD Architecture Approach
Following @golden-rule.md patterns for clean separation of concerns:

#### Domain Layer ✅ COMPLETED
```typescript
// Pure business logic for content processing ✅ COMPLETED
UserContentSanitizationService ✅ COMPLETED
ContentValidationService ✅ COMPLETED
ContentTypeValidationService ✅ COMPLETED
ContentLengthValidationService ✅ COMPLETED
PromptCoordinationService // PENDING
IdentityResolutionService // PENDING

// Value Objects ✅ COMPLETED
SanitizedContent ✅ COMPLETED
ContentValidationResult ✅ COMPLETED
ContentType (enum) ✅ COMPLETED

// Domain Errors ✅ COMPLETED
ContentValidationError ✅ COMPLETED
ContentSanitizationError ✅ COMPLETED
```

#### Application Layer
```typescript
// Orchestration without business logic
SanitizeUserContentUseCase
ValidateContentUseCase
PromptAssemblyApplicationService

// DTOs and Mappers
SanitizedContentDTO
PromptTemplateDTO
ContentMapper
```

#### Infrastructure Layer ✅ COMPLETED
```typescript
// External concerns ✅ COMPLETED
PromptTemplateEngine ✅ COMPLETED
AIConfigurationCompositionService ✅ COMPLETED
Template files (business-persona.template, system-prompt.template) ✅ COMPLETED
Updated service compositions ✅ COMPLETED
```

#### Presentation Layer
```typescript
// UI integration
Content validation server actions
useContentValidation React hook
Updated knowledge base forms
```

### Content Sanitization Strategy

#### User Content Issues
- **Markdown Headers**: Users enter `## Company Overview` which conflicts with system `## Core Identity`
- **Length Variations**: Some content is 50 characters, others 5000+ characters
- **Arbitrary Formatting**: Mixed whitespace, special characters, inconsistent structure

#### Sanitization Rules
```typescript
interface SanitizationRules {
  removeMarkdownHeaders: boolean;     // Strip ##, ###
  limitLength: {
    company: 200,
    compliance: 300,
    faqs: 150
  };
  normalizeWhitespace: boolean;       // Remove excessive \n\n\n
  extractStructuredData: boolean;     // Parse for key info vs raw text
}
```

### Template System Design

#### Current Problem
```typescript
// Multiple services building conflicting sections:
PersonaService: "## Core Identity\nBusiness Intelligence Specialist"
KnowledgeService: "## Company Context\nIronmark overview..."
DynamicPrompt: "## Communication Standards\nTone: friendly"
```

#### Implemented Template Solution ✅ COMPLETED
```typescript
// business-persona.template ✅ COMPLETED
const BUSINESS_PERSONA_TEMPLATE = `
## Role & Identity
You are {{roleTitle}}, a {{roleDescription}}.

## Primary Objectives
{{#if objectives}}
{{objectives}}
{{/if}}

## Communication Style
{{#if communicationStyle}}
{{communicationStyle}}
{{/if}}

## Business Context
{{#if businessContext}}
{{businessContext}}
{{/if}}

## Constraints
{{#if constraints}}
{{constraints}}
{{/if}}
`;

// system-prompt.template ✅ COMPLETED
const SYSTEM_PROMPT_TEMPLATE = `
{{personaContent}}

{{#if knowledgeBaseContent}}
## Knowledge Base Context
{{knowledgeBaseContent}}
{{/if}}

{{#if businessGuidance}}
## Business Guidance
{{businessGuidance}}
{{/if}}

{{#if adaptiveContext}}
## Adaptive Context
{{adaptiveContext}}
{{/if}}

{{#if entityContext}}
## Entity Context
{{entityContext}}
{{/if}}
`;
```

### Deduplication Logic

#### Section Conflicts Identified
1. **Identity**: "Business Intelligence" vs "Lead Capture" specialist
2. **Communication**: Duplicate tone/approach sections
3. **Guidelines**: Multiple conversation guideline sections
4. **Company Info**: Repeated company context in multiple places

#### Resolution Strategy
```typescript
interface ConflictResolution {
  identity: 'use-most-specific' | 'merge-complementary';
  communication: 'merge-all' | 'prioritize-restrictions';
  company: 'single-source' | 'structured-extraction';
  guidelines: 'consolidate' | 'remove-duplicates';
}
```

## Implementation Context

### Database Schema Context
User content stored in knowledge base tables:
- `companyInfo` - Free text, can contain markdown
- `complianceGuidelines` - Free text, may not contain keywords
- `productCatalog` - Free text with potential formatting
- `supportDocs` - Free text documentation
- `faqs` - Structured Q&A pairs

### Template Engine Implementation ✅ COMPLETED
- **PromptTemplateEngine**: Handles variable substitution and conditional rendering
- **Template Variables**: Services now return TemplateVariable arrays instead of strings
- **Conditional Sections**: Uses {{#if}} blocks for optional content inclusion
- **Template Context**: Converts variables to context with conditionals mapping
- **Error Handling**: Comprehensive template processing error management

### Content Processing Implementation ✅ COMPLETED
- **UserContentSanitizationService**: Removes markdown headers, normalizes whitespace, limits length
- **ContentValidationService**: Validates content types, lengths, and business rules
- **Content Value Objects**: SanitizedContent, ContentValidationResult, ContentType enum
- **Domain Errors**: ContentValidationError and ContentSanitizationError with business context

### Service Integration ✅ COMPLETED
- **PersonaGenerationService**: Now returns template variables instead of formatted strings
- **DynamicPromptService**: Uses template engine for prompt assembly with conditional sections
- **AIConfigurationCompositionService**: Wires template engine into service dependencies
- **Dependency Injection**: Proper singleton pattern with lazy initialization

## Technical Requirements

### Performance Targets
- **40-50% reduction** in prompt token count
- **Maintain AI response quality** - no regression in conversation effectiveness
- **Clean log output** - readable, properly formatted prompts in log files

### Quality Standards
Following @golden-rule.md requirements:
- All services under 250 lines
- AI instruction comments on every major component
- Proper domain error handling with business context
- Single responsibility principle maintained
- Clean layer separation (no business logic in application layer)

### Compatibility Requirements
- **Existing database content** must process correctly
- **Current chatbot configurations** must continue working
- **No breaking changes** to public APIs
- **Backward compatibility** with existing knowledge base entries

## Risk Assessment

### High Risk Areas
1. **Prompt generation changes** could affect AI response quality
2. **Multiple service coordination** increases complexity
3. **User content processing** might break with edge cases
4. **Template engine** introduces new dependency

### Mitigation Strategies
1. **Incremental implementation** - test each phase separately
2. **A/B testing** - compare old vs new prompt effectiveness
3. **Comprehensive testing** with existing database content
4. **Rollback plan** - ability to revert to current system

## Testing Strategy

### Unit Testing
- Domain services in isolation
- Value object validation
- Content sanitization edge cases
- Template rendering with various inputs

### Integration Testing
- Full prompt assembly workflow
- Database content processing
- Multiple service coordination
- Error handling and recovery

### Performance Testing
- Token count measurements
- Response time impact
- Memory usage with large content
- Concurrent prompt generation

## Success Metrics

### Quantitative
- Prompt length reduction: 40-50%
- Zero duplicate sections in generated prompts
- 100% compliance guidelines inclusion when present
- No increase in AI response latency

### Qualitative
- Clean, readable log files for QA
- Consistent prompt structure regardless of user input
- Proper DDD layer separation maintained
- All @golden-rule.md patterns followed

## Future Considerations

### Extensibility
- Template system should support new content types
- Domain services should be easily extendable
- Validation rules should be configurable
- Content processing should handle new database fields

### Monitoring
- Track prompt effectiveness over time
- Monitor user content validation errors
- Measure template rendering performance
- Alert on prompt generation failures

## Implementation Notes

### Phase Dependencies
1. **Domain Layer** must be completed first (pure business logic)
2. **Application Layer** depends on domain services
3. **Infrastructure Layer** implements domain interfaces
4. **Presentation Layer** uses application services only

### Critical Decision Points ✅ RESOLVED
1. **Template Engine Choice**: Built custom PromptTemplateEngine with variable substitution and conditional rendering ✅
2. **Content Processing**: Implemented domain services for user content sanitization and validation ✅
3. **Service Integration**: Template engine integrated into existing AI configuration services ✅
4. **Architecture Pattern**: Followed @golden-rule.md DDD patterns with proper layer separation ✅

### Development Guidelines
- Follow existing codebase patterns
- Maintain TypeScript strict mode compliance
- Add comprehensive error handling
- Include proper logging for debugging
- Document all business rules and decisions

This design document should provide complete context for future implementation sessions, including the problem analysis, solution approach, technical requirements, and implementation strategy. 