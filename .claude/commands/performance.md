# Performance Analysis Command

## Description
Comprehensive performance analysis and optimization for Next.js application with AI services.

## Usage
`/performance [scope]`

## Parameters
- `scope` (optional): Target area ('frontend', 'api', 'database', 'ai', 'all'). Defaults to 'all'.

## Instructions
You are a performance optimization expert for this Next.js 15 + Supabase + AI application.

**Performance Analysis Areas:**

### 1. Frontend Performance
- **Bundle Size**: Analyze webpack bundles, identify large dependencies
- **Code Splitting**: Dynamic imports and lazy loading opportunities
- **React Optimization**: useMemo, useCallback, React.memo usage
- **Image Optimization**: Next.js Image component usage
- **CSS Performance**: Tailwind purging, critical CSS
- **Hydration**: SSR/SSG optimization

### 2. API Performance
- **Response Times**: Identify slow API routes
- **Database Queries**: N+1 problems, missing indexes
- **Caching Strategy**: React Query, server-side caching
- **Payload Size**: Response optimization
- **Concurrent Requests**: Batch operations
- **Rate Limiting**: Performance vs security balance

### 3. Database Performance
- **Query Optimization**: Slow query analysis
- **Index Strategy**: Missing or unused indexes
- **RLS Performance**: Policy efficiency
- **Connection Pooling**: Supabase connection management
- **Data Fetching**: Over-fetching prevention
- **Pagination**: Efficient data loading

### 4. AI Service Performance
- **Token Optimization**: Prompt efficiency, context management
- **Response Caching**: Vector search results, embeddings
- **Streaming**: Real-time response delivery
- **Model Selection**: Cost vs performance balance
- **Batch Processing**: Multiple AI requests
- **Context Window**: Efficient token usage

### 5. Infrastructure Performance
- **CDN Usage**: Static asset delivery
- **Edge Functions**: Geographical optimization
- **Memory Usage**: Server resource utilization
- **Cold Start**: Serverless function warmup
- **Monitoring**: Performance metrics collection

**Analysis Tools & Commands:**
```bash
# Bundle analysis
pnpm run analyze

# Performance testing
pnpm run lighthouse

# Development performance
pnpm run dev:fast

# Database performance
# (Analyze Supabase dashboard metrics)
```

**Performance Patterns to Check:**

### ✅ Good Patterns:
```typescript
// Efficient data fetching
const { data } = useQuery({
  queryKey: ['notes', orgId],
  queryFn: () => fetchNotes(orgId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Proper memoization
const expensiveValue = useMemo(() => 
  computeExpensiveOperation(data), [data]
);

// Dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Optimized database query
const notes = await supabase
  .from('notes')
  .select('id, title, created_at') // Only needed fields
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(20); // Pagination
```

### ❌ Performance Anti-patterns:
```typescript
// Over-fetching
const notes = await supabase
  .from('notes')
  .select('*'); // ❌ Gets all fields, all records

// Missing memoization
const value = expensiveComputation(props); // ❌ Runs every render

// No code splitting
import './HeavyLibrary'; // ❌ Blocks initial load

// Inefficient queries
for (const note of notes) {
  const user = await getUser(note.user_id); // ❌ N+1 problem
}
```

**AI Performance Optimization:**
- **Context Optimization**: Use ContextTokenBudgetDomainService patterns
- **Prompt Efficiency**: Minimize token usage while maintaining quality
- **Caching**: Cache embeddings and frequent AI responses
- **Streaming**: Implement real-time response streaming
- **Model Selection**: Use appropriate models (GPT-4o-mini vs GPT-4o)

**Analysis Process:**
1. **Baseline Metrics**: Capture current performance
2. **Bottleneck Identification**: Find slowest components
3. **Optimization Strategy**: Prioritize high-impact fixes
4. **Implementation**: Apply optimizations
5. **Measurement**: Verify improvements

**Output Format:**
```
## Performance Analysis Results

### 📊 Performance Score: [X/10]

### ⚡ Current Metrics:
- Bundle Size: [size] MB (target: <1MB)
- API Response Time: [time]ms (target: <500ms)
- Database Query Time: [time]ms (target: <100ms)
- AI Response Time: [time]ms (target: <3s)
- Lighthouse Score: [score]/100

### 🚀 Optimization Opportunities:

#### High Impact (Quick Wins):
- [Component/File]: [Issue] → [Fix] (Est. [X]% improvement)

#### Medium Impact:
- [Area]: [Issue] → [Recommendation]

#### Low Impact (Future):
- [Enhancement]: [Description]

### 🔧 Recommended Actions:
1. **Immediate**: [Critical performance fix]
2. **Short-term**: [Medium impact optimization]
3. **Long-term**: [Infrastructure improvements]

### 📈 Expected Improvements:
- Bundle Size: -[X]% reduction
- Load Time: -[X]ms improvement
- API Performance: -[X]% faster responses
- User Experience: [Specific improvement]
```

**Always measure before and after optimization to verify improvements.**