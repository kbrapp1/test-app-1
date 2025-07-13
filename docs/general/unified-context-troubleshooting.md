# Unified Context Pattern - Troubleshooting Guide

## Common Issues & Solutions

### 🚨 Issue: Still Getting Multiple API Calls

**Symptoms**: Network tab shows 2-3+ API calls instead of 1 optimized call

**Root Causes & Fixes**:

#### 1. Missing API Deduplication
```typescript
// ❌ PROBLEM: No deduplication wrapper
export async function getFeatureUnifiedContext() {
  const service = FeatureUnifiedContextService.getInstance();
  return await service.getUnifiedContext(); // Multiple calls hit server
}

// ✅ SOLUTION: Add deduplication wrapper
export async function getFeatureUnifiedContext() {
  return await apiDeduplicationService.deduplicateServerAction(
    'getFeatureUnifiedContext',
    [],
    async () => {
      const service = FeatureUnifiedContextService.getInstance();
      return await service.getUnifiedContext();
    },
    'feature-operations'
  );
}
```

#### 2. Mixed Server + Client Data Fetching
```typescript
// ❌ PROBLEM: Server component fetches data
export default async function FeaturePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser(); // API call 1
  return <FeaturePageClient initialData={data} />;
}

export function FeaturePageClient({ initialData }) {
  const context = useFeatureUnifiedContext(); // API call 2 (duplicate!)
}

// ✅ SOLUTION: Client-only data fetching
export default async function FeaturePage() {
  return <FeaturePageClient />; // No server-side fetching
}

export function FeaturePageClient() {
  const context = useFeatureUnifiedContext(); // Single API call
}
```

#### 3. Multiple Hook Calls (Defeats Purpose)
```typescript
// ❌ PROBLEM: Multiple components calling same hook
function ParentComponent() {
  const context = useFeatureUnifiedContext(); // API call 1
  return <ChildComponent />;
}

function ChildComponent() {
  const context = useFeatureUnifiedContext(); // API call 2 (duplicate!)
}

// ✅ SOLUTION: Single hook call + prop drilling
function ParentComponent() {
  const { user, canUpdate, isLoading } = useFeatureUnifiedContext(); // API call 1 only
  return <ChildComponent user={user} canUpdate={canUpdate} isLoading={isLoading} />;
}

function ChildComponent({ user, canUpdate, isLoading }) {
  // No hook call - uses props
}
```

### 🚨 Issue: Infinite Re-render Loops

**Symptoms**: Page becomes unresponsive, React DevTools shows continuous re-renders

**Root Cause**: Unstable hook dependencies

```typescript
// ❌ PROBLEM: Unstable useCallback dependencies
export function useFeatureUnifiedContext() {
  const [state, setState] = useState(/* ... */);
  
  const loadContext = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true })); // setState makes function unstable
    // ... load logic
  }, []); // Empty array but function still unstable due to setState
  
  useEffect(() => {
    loadContext(); // Depends on unstable function = infinite loop
  }, [loadContext]);
}

// ✅ SOLUTION: Use refs for stable dependencies
export function useFeatureUnifiedContext() {
  const [state, setState] = useState(/* ... */);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  const loadContext = useCallback(async () => {
    if (isLoadingRef.current) return; // Prevent duplicate calls
    // ... load logic with refs
  }, []); // Truly stable - no external dependencies
  
  useEffect(() => {
    if (!hasLoadedRef.current) loadContext();
  }, []); // No dependencies = runs once only
}
```

### 🚨 Issue: "Feature Disabled" Flash During Loading

**Symptoms**: Brief "Feature Disabled" message appears before loading completes

**Root Cause**: Wrong conditional rendering order

```typescript
// ❌ PROBLEM: Checking feature flag before loading
if (!isFeatureEnabled) { // This runs first when isFeatureEnabled starts as false
  return <FeatureDisabledComponent />;
}

if (isLoading) { // This runs after disabled check
  return <LoadingComponent />;
}

// ✅ SOLUTION: Loading state takes priority
if (isLoading) { // Check loading first
  return <LoadingComponent />;
}

if (!isFeatureEnabled) { // Only check after loading completes
  return <FeatureDisabledComponent />;
}
```

### 🚨 Issue: TypeScript Errors After Implementation

**Symptoms**: Component interface errors, boolean type mismatches

#### 1. Boolean Type Safety
```typescript
// ❌ PROBLEM: Type error 'User | false' not assignable to 'boolean'
const canUpdate = user && !isLoading;

// ✅ SOLUTION: Explicit boolean conversion
const canUpdate = Boolean(user && !isLoading);
```

#### 2. Missing Component Props
```typescript
// ❌ PROBLEM: Interface doesn't include unified context props
interface ComponentProps {
  data: SomeData;
}

// ✅ SOLUTION: Add unified context props to interface
interface ComponentProps {
  data: SomeData;
  canUpdate: boolean;
  canDelete: boolean;
  isLoading: boolean;
  user: User | null;
}
```

### 🚨 Issue: Tests Failing After Implementation

**Symptoms**: Test suites fail with mock-related errors

```typescript
// ❌ PROBLEM: Tests still mock old individual hooks
vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useFeaturePermissions: () => ({ canUpdate: true }),
}));

// ✅ SOLUTION: Mock unified context hook instead
vi.mock('@/lib/feature/presentation/hooks/useFeatureUnifiedContext', () => ({
  useFeatureUnifiedContext: () => ({
    user: { id: 'user-123' },
    organizationId: 'org-123',
    isFeatureEnabled: true,
    isLoading: false,
    error: null,
    refreshContext: vi.fn(),
  }),
}));
```

### 🚨 Issue: React Query + Unified Context Conflicts

**Symptoms**: Data not updating, cache inconsistencies

**Solution**: Use hybrid approach - unified context for security, React Query for data

```typescript
// ✅ CORRECT: Hybrid approach
export function FeaturePageClient() {
  // SECURITY: Unified context for auth/permissions/feature flags
  const { user, organizationId, isFeatureEnabled, isLoading: contextLoading } = 
    useFeatureUnifiedContext();

  // DATA MANAGEMENT: React Query for CRUD operations
  const { data, mutate } = useFeatureQuery(
    organizationId, 
    !contextLoading && isFeatureEnabled // Only fetch when context is ready
  );
}
```

## Debugging Checklist

### Network Tab Validation
- [ ] Single `getFeatureUnifiedContext` call on page load
- [ ] No duplicate authentication calls
- [ ] API deduplication working (rapid refresh shows cached responses)

### React DevTools Validation  
- [ ] No infinite re-renders in Components tab
- [ ] Hook state stable in Profiler
- [ ] Single context provider in component tree

### Console Log Validation
- [ ] No "UNIFIED_VALIDATION_ERROR" messages
- [ ] Deduplication service logs show cache hits
- [ ] No multiple simultaneous server action calls

### Performance Validation
- [ ] Page load time improved by 20-50%
- [ ] Lighthouse performance score increased
- [ ] Reduced server response times

## When to Use Each Pattern

### Pure Unified Context
**Use when**: Simple features with basic CRUD operations
**Benefits**: Maximum simplicity, single API call
**Example**: Settings, Team Management

### Unified Context + React Query  
**Use when**: Complex features with frequent data updates
**Benefits**: Security optimization + data management optimization
**Example**: DAM, Chatbot Widget, Notes

### Migration Strategy
1. **Start with React Query** - Add to existing components (no breaking changes)
2. **Add Unified Context** - Replace multiple auth/org calls with single call
3. **Optimize Integration** - Fine-tune caching strategies and invalidation

## Need Help?
- **Full Templates**: See `unified-context-pattern-implementation-guide.md`
- **Quick Start**: See `unified-context-quick-start.md`
- **Real Example**: Check `lib/notes/` implementation 