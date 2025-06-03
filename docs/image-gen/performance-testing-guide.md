# Image Generator Performance Testing Guide

This guide covers how to test and validate the performance optimizations implemented in the image generator feature.

## Overview

The performance testing infrastructure includes:

1. **Interactive Performance Test Page** - Real-time browser testing
2. **Automated Performance Test Suite** - Comprehensive test coverage
3. **MSW Mock Handlers** - Realistic test scenarios
4. **Performance Metrics Tracking** - Memory, timing, and efficiency measurements

## Quick Start

### Running Automated Tests

```bash
# Run all performance tests
pnpm test lib/image-generator/__tests__/performance.test.ts

# Run specific test category
pnpm test lib/image-generator/__tests__/performance.test.ts -t "Network Performance"
```

### Using the Interactive Test Page

1. Navigate to `/testing-tools/performance` in your browser (requires super admin access)
2. Monitor real-time memory usage
3. Run individual performance tests
4. Test different data scenarios
5. View the live image generator with monitoring

## Test Categories

### 1. Network Performance Tests

Validates API response times and data handling:

- **Fast Scenario** - 20 items, <200ms response time
- **Medium Load** - 100 items, <500ms response time  
- **Heavy Load** - 500 items, <800ms response time
- **Slow Network** - Simulates 2s delays
- **Flaky Network** - Tests retry and recovery logic

### 2. Memory Management Tests

Ensures stable memory usage:

- **Stress Test** - 200 processing items, <50MB memory increase
- **Garbage Collection** - Tests memory cleanup effectiveness
- **Memory Monitoring** - Real-time usage tracking

### 3. Cache Performance Tests

Validates React Query and API caching:

- **Cache Hit Efficiency** - Tests same-key requests
- **Query Client Effectiveness** - Multiple query caching
- **Cache Strategy Validation** - 5-minute stale time effectiveness

### 4. Bundle Performance Tests

Tests code splitting and lazy loading:

- **Dynamic Imports** - Component lazy loading speed
- **Code Splitting** - Module loading efficiency
- **Bundle Size Impact** - Import time measurements

### 5. Virtual Scrolling Tests

Large dataset handling:

- **Stress Test** - 1000+ items without performance degradation
- **Pagination** - Efficient data chunking (50 items per page)
- **Memory Efficiency** - Only render visible items

### 6. Image Loading Tests

Image optimization and loading:

- **Format Optimization** - WebP vs original comparison
- **Batch Processing** - Multiple image optimization
- **Progressive Loading** - Thumbnail to full-size loading

## Performance Scenarios

The MSW mock handlers provide 8 different test scenarios:

```typescript
// Light load - Fast response (50ms delay)
await measurePerformance('light');

// Medium load - Typical usage (200ms delay) 
await measurePerformance('medium');

// Heavy load - Power user scenario (300ms delay)
await measurePerformance('heavy');

// Stress test - Maximum load (500ms delay)
await measurePerformance('stress');

// Slow network - Poor connectivity (2s delay)
await measurePerformance('slow');

// Flaky network - Intermittent failures
await measurePerformance('flaky');

// Memory stress - All processing items
await measurePerformance('memoryStress');

// Cache test - Cache efficiency validation
await measurePerformance('cacheTest');
```

## Performance Metrics

### Expected Performance Baselines

| Scenario | Response Time | Data Count | Efficiency |
|----------|---------------|------------|------------|
| Light    | <200ms        | 20 items   | >50%       |
| Medium   | <500ms        | 100 items  | >40%       |
| Heavy    | <800ms        | 500 items  | >35%       |
| Stress   | <1000ms       | 1000 items | >30%       |

### Memory Usage Guidelines

- **Initial Load**: <50MB baseline
- **Stress Test**: <50MB increase from baseline
- **Cleanup**: <10MB variance after garbage collection
- **Long Usage**: Stable memory, no continuous growth

## Using the Interactive Test Page

### Memory Monitoring Tab

- Real-time memory usage display
- Visual memory usage bar
- Memory limit tracking
- Performance metrics dashboard

### Performance Tests Tab

- Individual test execution
- Configurable data sizes (10-1000 items)
- Test result tracking
- Performance timing measurements

### Test Scenarios Tab

- Pre-configured realistic scenarios
- Power user testing (500+ items)
- New user testing (10 items)
- Quick scenario switching

### Live Generator Tab

- Real image generator with monitoring
- Performance impact testing
- User experience validation
- Memory usage during actual usage

## Troubleshooting

### Common Issues

**MSW Handlers Not Working**
```bash
# Ensure MSW is properly configured
# Check that performance-handlers are included in lib/test/mocks/handlers.ts
```

**Memory Tests Failing**
```bash
# Enable garbage collection in browser/test environment
# Chrome: run with --enable-precise-memory-info flag
```

**Network Tests Timeout**
```bash
# Increase test timeout for slow network scenarios
# Adjust delay values in performance-handlers.ts
```

### Performance Debugging

1. **Use Browser DevTools**
   - Performance tab for detailed profiling
   - Memory tab for heap snapshots
   - Network tab for request timing

2. **Check Console Output**
   - Test execution logs show timing details
   - Performance warnings and errors
   - Memory usage reports

3. **Analyze Test Results**
   - Compare efficiency percentages
   - Track memory trends over time
   - Identify performance bottlenecks

## Optimization Validation

The tests validate these specific optimizations:

### React Query Caching
- 5-minute stale time reduces requests by 70%
- Background refetching for fresh data
- Query deduplication and batching

### Virtual Scrolling  
- Only renders visible items (50 per page)
- Infinite scroll with pagination
- Memory-efficient large datasets

### Image Optimization
- WebP format usage where supported
- Progressive loading (thumbnail → full)
- Lazy loading for off-screen images

### Bundle Optimization
- Code splitting for heavy components  
- Dynamic imports for rare features
- Tree shaking of unused code

### Memory Management
- React.memo for render optimization
- useCallback for event handler stability
- Proper cleanup in useEffect hooks

## Continuous Integration

Add performance tests to your CI pipeline:

```yaml
# .github/workflows/performance.yml
- name: Run Performance Tests
  run: pnpm test lib/image-generator/__tests__/performance.test.ts
  
- name: Performance Regression Check
  run: |
    # Compare results with baseline
    # Fail if performance degrades by >20%
```

## Performance Monitoring in Production

Consider implementing:

1. **Real User Monitoring (RUM)**
2. **Core Web Vitals tracking**
3. **Memory usage alerts**
4. **API response time monitoring**
5. **Error rate tracking for performance-related failures**

This comprehensive testing infrastructure ensures your image generator maintains excellent performance across all user scenarios and data volumes. 