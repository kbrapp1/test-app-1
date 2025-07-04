# Error Tracking & Observability - 2025 Best Practices

## Overview

This document outlines the implementation strategy for modern error tracking and observability following 2025 industry best practices. The approach balances comprehensive monitoring with practical implementation constraints.

## Core Principles

### 1. **Structured Observability (OpenTelemetry Standard)**
- Use OpenTelemetry for traces, metrics, and logs
- Implement semantic conventions for AI/ML workloads
- Enable distributed tracing across microservices
- Correlate errors with business context

### 2. **Domain-Driven Error Architecture**
- 3-5 focused error tables per application scope
- Domain-specific error categories aligned with business boundaries
- Hierarchical error classification (System → Application → Business)

### 3. **AI-First Error Patterns**
- Specialized tracking for AI agent failures
- LLM response quality monitoring
- Token usage and cost tracking integration
- Fallback mechanism observability

## Implementation Strategy

### Phase 1: Foundation (Immediate)

#### A. Core Error Tables (Application Level)

```sql
-- 1. SYSTEM ERRORS (Infrastructure, Network, Database)
CREATE TABLE public.system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_level TEXT NOT NULL CHECK (error_level IN ('error', 'fatal', 'panic')),
    service TEXT NOT NULL,
    error_code TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    environment TEXT NOT NULL,
    trace_id TEXT,
    span_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 2. APPLICATION ERRORS (Business Logic, API Failures)
CREATE TABLE public.application_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT NOT NULL,
    domain TEXT NOT NULL,
    feature TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    user_id UUID,
    organization_id UUID,
    session_id TEXT,
    request_id TEXT,
    trace_id TEXT,
    span_id TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 3. AI AGENT ERRORS (LLM, ML, AI-specific failures)
CREATE TABLE public.ai_agent_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type TEXT NOT NULL,
    error_category TEXT NOT NULL,
    model_name TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_cost_cents INTEGER,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    user_message TEXT,
    ai_response TEXT,
    fallback_response TEXT,
    session_id TEXT,
    user_id UUID,
    organization_id UUID,
    trace_id TEXT,
    span_id TEXT,
    model_context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- 4. SECURITY ERRORS (Auth, Authorization, Threats)
CREATE TABLE public.security_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    attack_type TEXT NOT NULL,
    source_ip INET,
    user_agent TEXT,
    endpoint TEXT,
    payload_hash TEXT,
    user_id UUID,
    organization_id UUID,
    session_id TEXT,
    blocked BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    investigated_at TIMESTAMPTZ,
    investigation_notes TEXT
);
```

#### B. Service Architecture

```typescript
// Centralized Error Tracking Service
export class ErrorTrackingService {
  constructor(private readonly supabase: SupabaseClient) {}

  async trackSystemError(
    service: string,
    errorCode: string,
    message: string,
    level: 'error' | 'fatal' | 'panic',
    context?: ErrorContext
  ): Promise<void> {
    // Implementation with OpenTelemetry integration
  }

  async trackApplicationError(
    domain: string,
    feature: string,
    errorCode: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: ErrorContext
  ): Promise<void> {
    // Implementation with trace correlation
  }

  async trackAIAgentError(
    agentType: string,
    errorCategory: string,
    errorCode: string,
    errorMessage: string,
    modelContext?: AIModelContext,
    context?: ErrorContext
  ): Promise<void> {
    // Implementation with AI-specific tracking
  }
}
```

### Phase 2: Domain-Specific Implementation

#### A. Chatbot Error Tracking

```typescript
// lib/chatbot-widget/application/services/ChatbotErrorTrackingService.ts
export class ChatbotErrorTrackingService {
  constructor(private readonly baseErrorTracking: ErrorTrackingService) {}

  async trackResponseExtractionFallback(
    unifiedResult: any,
    sessionId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    await this.baseErrorTracking.trackAIAgentError(
      'chatbot',
      'response-extraction',
      'RESPONSE_EXTRACTION_FAILED',
      'Failed to extract response content from unified result',
      {
        modelName: 'gpt-4o-mini',
        fallbackResponse: "I'm having trouble processing your message right now..."
      },
      {
        sessionId,
        userId,
        organizationId,
        metadata: {
          unifiedResultStructure: this.sanitizeUnifiedResult(unifiedResult),
          extractionPath: 'unifiedResult?.analysis?.response?.content',
          fallbackTriggered: true
        }
      }
    );
  }
}
```

### Phase 3: Monitoring & Alerting

#### A. Error Dashboard Service

```typescript
export class ErrorDashboardService {
  async getErrorMetrics(
    organizationId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ErrorMetrics> {
    // Aggregate error data for monitoring dashboards
    // Provide real-time error metrics
  }
}
```

#### B. Alert Configuration

```typescript
export interface AlertRule {
  id: string;
  name: string;
  errorTable: 'system_errors' | 'application_errors' | 'ai_agent_errors' | 'security_errors';
  condition: {
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    value: number | string;
  };
  timeWindow: '5m' | '15m' | '1h' | '24h';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  enabled: boolean;
}
```

## 2025 Best Practices Alignment

### ✅ **Follows Current Standards**

1. **OpenTelemetry Integration**: Industry standard for observability
2. **Structured Error Tables**: Domain-specific error categorization
3. **AI-Specific Tracking**: Specialized patterns for AI/ML workloads
4. **Correlation IDs**: Trace and span ID integration
5. **Real-time Monitoring**: Proactive error detection

### ✅ **Modern Patterns**

1. **Semantic Conventions**: Consistent error categorization
2. **Context Preservation**: Rich metadata for debugging
3. **Performance Optimization**: Indexed queries and efficient storage
4. **Security-First**: RLS policies and data sanitization
5. **Scalable Architecture**: Horizontal scaling support

## Implementation Timeline

### Week 1: Foundation
- [ ] Create core error tables migration
- [ ] Implement basic ErrorTrackingService
- [ ] Add OpenTelemetry integration
- [ ] Update existing error handling

### Week 2: Domain Integration
- [ ] Implement ChatbotErrorTrackingService
- [ ] Update UnifiedResponseProcessorService
- [ ] Add error tracking to other domains
- [ ] Create error dashboard components

### Week 3: Monitoring & Alerting
- [ ] Implement ErrorDashboardService
- [ ] Create error monitoring UI
- [ ] Set up alert rules
- [ ] Configure notification integrations

### Week 4: Testing & Optimization
- [ ] Performance testing
- [ ] Index optimization
- [ ] Alert rule fine-tuning
- [ ] Documentation and training

## Key Benefits

### 1. **Comprehensive Visibility**
- Full error tracking across all application layers
- Correlation between errors and business impact
- Real-time monitoring and alerting

### 2. **AI-Specific Insights**
- Track AI agent performance and failures
- Monitor token usage and costs
- Identify patterns in fallback triggers

### 3. **Operational Excellence**
- Proactive error detection and resolution
- Data-driven debugging and optimization
- Compliance and audit trail

### 4. **Developer Experience**
- Structured error handling patterns
- Consistent error reporting across domains
- Easy integration with existing code

## Migration Strategy

### From Current State
1. **Gradual Migration**: Update services one at a time
2. **Parallel Running**: Run old and new systems simultaneously
3. **Data Migration**: Migrate historical error data if needed
4. **Testing**: Comprehensive testing before full cutover

### Rollback Plan
- Keep existing error handling as fallback
- Feature flags for new error tracking
- Quick rollback capability if issues arise

## Conclusion

This implementation provides a modern, scalable error tracking system that aligns with 2025 best practices while being practical for immediate implementation. The phased approach ensures minimal disruption while maximizing long-term benefits. 