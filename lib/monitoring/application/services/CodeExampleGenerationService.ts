export class CodeExampleGenerationService {
  static generateCachingCodeExample(): string {
    return `// Add React Query to your main layout/page
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Wrap your app
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>`;
  }

  static generateMemoizationCodeExample(): string {
    return `// Add memoization to expensive components
import { memo, useCallback, useMemo } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  const handleUpdate = useCallback((id, value) => {
    onUpdate(id, value);
  }, [onUpdate]);

  return <div>{/* render with processedData */}</div>;
});`;
  }

  static generateLazyLoadingCodeExample(): string {
    return `// Add code splitting for heavy components
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}`;
  }

  static generateDebouncingCodeExample(): string {
    return `// Add debouncing to search inputs
import { useDebouncedCallback } from 'use-debounce';

const SearchInput = ({ onSearch }) => {
  const debouncedSearch = useDebouncedCallback(
    (value) => onSearch(value),
    300
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
};`;
  }

  static generateBatchingCodeExample(): string {
    return `// Batch mutations together
import { useMutation } from '@tanstack/react-query';

const useBatchedMutations = () => {
  const [batchQueue, setBatchQueue] = useState([]);
  
  const batchMutation = useMutation({
    mutationFn: (batch) => Promise.all(batch.map(op => op.mutationFn())),
    onSuccess: () => setBatchQueue([])
  });

  const addToBatch = (operation) => {
    setBatchQueue(prev => [...prev, operation]);
  };

  return { addToBatch, executeBatch: () => batchMutation.mutate(batchQueue) };
};`;
  }

  static getCodeExampleByType(issueType: string): string | undefined {
    const generators = {
      'caching': () => this.generateCachingCodeExample(),
      'memoization': () => this.generateMemoizationCodeExample(),
      'lazy-loading': () => this.generateLazyLoadingCodeExample(),
      'debouncing': () => this.generateDebouncingCodeExample(),
      'batching': () => this.generateBatchingCodeExample()
    };

    const generator = generators[issueType as keyof typeof generators];
    return generator ? generator() : undefined;
  }
} 