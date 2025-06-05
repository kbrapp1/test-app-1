# Image Generator Performance Optimizations

## Overview
Optimized the image generator page to reduce initial API calls from **3+ POST requests** to **1 POST request** on page refresh, implementing true lazy loading and intelligent caching.

## Key Improvements Made

### 1. **Optimized React Query Refetch Behavior**

**File**: `lib/image-generator/presentation/hooks/queries/useGenerations.ts`
- **Changed**: `refetchOnMount: 'always'` → `refetchOnMount: false`
- **Impact**: Prevents unnecessary API calls on every page refresh
- **Benefit**: Only fetches data if no cached data exists

**File**: `lib/image-generator/presentation/hooks/queries/useGenerationStats.ts`
- **Added**: `refetchOnMount: false` and `refetchOnWindowFocus: false`
- **Impact**: Stats only load once and use cached data
- **Benefit**: Reduces stats API calls from every page load to cache-based loading

### 2. **True Lazy Loading for History Panel**

**File**: `lib/image-generator/presentation/hooks/queries/useInfiniteGenerations.ts`
- **Added**: `enabled` option to conditionally fetch data
- **Changed**: `refetchOnMount: 'always'` → `refetchOnMount: false`
- **Impact**: History panel data only loads when panel is actually opened

**File**: `lib/image-generator/presentation/components/layout/ImageGeneratorMain.tsx`
- **Updated**: Pass `historyPanel.panelVisible` to `useInfiniteGenerations`
- **Impact**: No history data fetching until user opens the panel
- **Benefit**: Reduces initial page load API calls by 1

### 3. **Smart Auto-Refresh Optimization**

**File**: `lib/image-generator/presentation/hooks/shared/useGenerationListRefresh.ts`
- **Added**: Dynamic refresh intervals based on active generation count
- **Logic**: 3s intervals for >5 active generations, 5s for fewer
- **Added**: Query existence check before refetching
- **Benefit**: Reduces background API load while maintaining real-time updates

### 4. **Shared Data Architecture** (Optional)

**File**: `lib/image-generator/presentation/hooks/shared/useSharedGenerations.ts`
- **Created**: Unified hook that serves both main view and history panel
- **Approach**: Fetch larger dataset once, derive both views from it
- **Benefit**: Further reduces from 2 API calls to 1 for both main and history data
- **Status**: Available but not yet implemented (commented out in main component)

## Performance Impact

### Before Optimizations:
- **Page Refresh**: 3+ POST requests
  1. `useGenerations` (main view) - always refetched
  2. `useInfiniteGenerations` (history panel) - always refetched
  3. `useGenerationStats` - always refetched
- **Background**: Auto-refresh every 5s regardless of load

### After Optimizations:
- **Page Refresh**: 1 POST request
  1. Only `useGenerations` if no cached data exists
  2. History panel: No initial load
  3. Stats: Cached data used
- **Background**: Smart intervals (3-5s) with existence checks

## Usage Examples

### Lazy Loading History Panel
```typescript
const {
  generations: historyGenerations,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
} = useInfiniteGenerations({}, { 
  enabled: historyPanel.panelVisible // Only fetch when opened
});
```

### Optimized Main Data Loading
```typescript
const {
  generations,
  isGenerating,
  generate,
  refetch,
} = useImageGenerationOptimized({ limit: 20 });
// Now uses cached data on page refresh instead of always refetching
```

### Future: Shared Data Approach
```typescript
// Uncomment in ImageGeneratorMain.tsx for even better performance
const {
  recentGenerations: generations,
  historyGenerations,
  statistics,
  refetch: refetchGenerations,
} = useSharedGenerations({ limit: 100 });
// Single API call serves both main view and history panel
```

## Cache Strategy

### Stale Time Configuration:
- **Generations**: 30 seconds (real-time feel)
- **Stats**: 60 seconds (less frequent updates)
- **History**: 30 seconds (when enabled)

### Garbage Collection:
- **All queries**: 5 minutes retention
- **Benefit**: Reduces memory usage while maintaining performance

## Developer Notes

1. **Backward Compatibility**: All existing APIs maintained
2. **Progressive Enhancement**: Optimizations can be enabled incrementally
3. **Error Handling**: Graceful fallbacks maintain functionality
4. **Monitoring**: Console debug logs for refresh failures

## Next Steps (Optional)

1. **Enable Shared Data**: Uncomment shared generations approach for maximum optimization
2. **Cache Warming**: Pre-load next page of history data in background
3. **Intelligent Preloading**: Load likely-needed data based on user behavior
4. **Metrics**: Add performance monitoring to track improvement impact 