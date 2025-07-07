# Modernize Command

## Description
Update code to modern patterns, latest React/Next.js features, and current best practices.

## Usage
`/modernize [scope]`

## Parameters
- `scope` (optional): Target area ('components', 'hooks', 'api', 'types', 'all'). Defaults to 'all'.

## Instructions
You are a modernization expert for Next.js 15, React 19, and TypeScript applications.

**Modernization Areas:**

### 1. React 19 Features
- **New Hooks**: `use()` hook for promises and context
- **Actions**: Server Actions and `useActionState`
- **Optimistic Updates**: `useOptimistic` for better UX
- **Form Actions**: Enhanced form handling
- **React Compiler**: Automatic memoization
- **Concurrent Features**: Suspense, transitions

### 2. Next.js 15 Features
- **App Router**: Full migration from Pages Router
- **Server Components**: Maximize server-side rendering
- **Streaming**: Partial prerendering and streaming
- **Turbopack**: Development performance
- **Edge Runtime**: Optimize for edge deployment
- **Dynamic Imports**: Better code splitting

### 3. TypeScript Improvements
- **Strict Mode**: Enable all strict flags
- **Template Literal Types**: Advanced type safety
- **Const Assertions**: Better type inference
- **Utility Types**: Modern type composition
- **Branded Types**: Domain-driven type safety

### 4. Performance Patterns
- **React 19 Compiler**: Remove manual memo/callback
- **Server Components**: Move logic server-side
- **Streaming**: Progressive loading
- **Bundle Optimization**: Tree shaking, dynamic imports
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization

**Modernization Patterns:**

### ✅ Modern Patterns to Implement:

#### React 19 Hooks:
```typescript
// Old: useEffect for data fetching
useEffect(() => {
  fetchData().then(setData);
}, []);

// New: use() hook
const data = use(fetchDataPromise);
```

#### Server Actions:
```typescript
// Old: API route + client fetch
async function updateNote() {
  const response = await fetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// New: Server Action
'use server';
async function updateNote(formData: FormData) {
  // Direct database access
  await supabase.from('notes').insert(data);
  revalidatePath('/notes');
}
```

#### Optimistic Updates:
```typescript
// New: Immediate UI feedback
const [optimisticNotes, addOptimisticNote] = useOptimistic(
  notes,
  (state, newNote) => [...state, newNote]
);
```

#### Modern Type Patterns:
```typescript
// Old: Basic interfaces
interface User {
  id: string;
  name: string;
}

// New: Branded types for domain safety
type UserId = string & { __brand: 'UserId' };
type OrganizationId = string & { __brand: 'OrganizationId' };

interface User {
  id: UserId;
  organizationId: OrganizationId;
  name: string;
}
```

### ❌ Legacy Patterns to Replace:

#### Replace useEffect with use():
```typescript
// Old: Complex data fetching
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// New: Simpler with use()
const data = use(fetchDataPromise);
```

#### Replace manual memoization:
```typescript
// Old: Manual optimization
const expensiveValue = useMemo(() => {
  return computeExpensive(props);
}, [props]);

const handleClick = useCallback(() => {
  onClick(props.id);
}, [onClick, props.id]);

// New: Let React Compiler handle it
const expensiveValue = computeExpensive(props);
const handleClick = () => onClick(props.id);
```

#### Update to App Router patterns:
```typescript
// Old: Pages Router
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// New: Server Components
export default async function Page() {
  const data = await fetchData(); // Direct async in component
  return <div>{data.title}</div>;
}
```

**TypeScript Modernization:**

### Strict Configuration:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

### Advanced Type Patterns:
```typescript
// Template literal types for type safety
type EventName = `on${Capitalize<string>}`;
type APIEndpoint = `/api/${string}`;

// Const assertions for better inference
const themes = ['light', 'dark'] as const;
type Theme = typeof themes[number];

// Utility type composition
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
```

**Analysis Process:**
1. **Pattern Detection**: Identify legacy patterns
2. **Feature Assessment**: Check for modern feature opportunities
3. **Type Analysis**: Improve TypeScript usage
4. **Performance Review**: Optimize with modern patterns
5. **Migration Strategy**: Safe, incremental updates

**Output Format:**
```
## Modernization Results

### 🚀 Modernization Score: [X/10]

### ✅ Successfully Modernized:
- **React 19 Features**: [count] components updated
- **Server Components**: [count] migrations
- **TypeScript**: [count] type improvements
- **Performance**: [count] optimizations

### 🔄 Updated Patterns:
- [File]: useEffect → use() hook
- [Component]: Manual memo → React Compiler
- [API]: Client fetch → Server Action
- [Types]: Basic types → Branded types

### 📈 Performance Improvements:
- Bundle size: -[X]% reduction
- Type safety: +[X]% coverage
- Runtime performance: [improvements]
- Developer experience: [enhancements]

### 🎯 Next Steps:
1. **Enable React Compiler**: Configure for automatic optimization
2. **Migrate Remaining**: [count] files still need updates
3. **Type Safety**: Add strict mode gradually
4. **Testing**: Update tests for modern patterns

### 🛠️ Configuration Updates:
- Updated tsconfig.json for strict mode
- Added React Compiler configuration
- Updated Next.js config for latest features
- Enhanced ESLint rules for modern patterns
```

**Always ensure backward compatibility and test thoroughly after modernization.**