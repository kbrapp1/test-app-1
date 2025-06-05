# Performance Optimization Heuristics & Guidelines

**Document Type:** Development Guidelines  
**Last Updated:** Current  
**Scope:** Platform-wide performance optimization decision framework

---

## 📊 **Executive Summary**

This document provides practical heuristics and decision frameworks for optimizing application performance across the platform. These guidelines help developers make informed optimization decisions based on measurable thresholds and established patterns.

### **Key Principles:**
- ✅ **Measure Before Optimizing** - Use data-driven decisions, not assumptions
- ✅ **Monitor Existing Tools** - Leverage built-in monitoring infrastructure  
- ✅ **Prioritize Impact** - Focus on high-impact, user-facing optimizations
- ✅ **Establish Baselines** - Track trends rather than absolute numbers

---

## 🌐 **Network Optimization Heuristics**

### **🎯 The "Call Count Rules"**

**Rule 1: Page Load Call Limits**
```typescript
✅ 1-2 calls on page load: Normal and acceptable
⚠️ 3-4 calls: Worth investigating (monitor trends)
❌ 5+ calls: Immediate optimization needed
🚨 10+ calls: Critical architecture issue
```

**Rule 2: Time Window Redundancy**
```typescript
❌ Same endpoint within 1 second: Definite redundancy 
⚠️ Same endpoint within 5 seconds: Probable optimization opportunity
✅ Same endpoint after 30+ seconds: Likely legitimate
🔄 Same endpoint with different params: Acceptable
```

**Rule 3: Page Type Expectations**
```typescript
Data-heavy pages (DAM, dashboards): 3-5 calls acceptable
Tool pages (image-gen, text-to-speech): 1-2 calls preferred  
Simple pages (settings, profile): 1 call maximum
Auth/onboarding pages: 2-3 calls expected
```

### **🔍 Network Performance Metrics**

**Primary Thresholds:**
- **Redundancy Rate**: <10% excellent, 10-20% needs attention, >20% critical
- **Cache Hit Rate**: >90% excellent, 70-90% good, <70% poor  
- **Response Time**: <200ms excellent, 200-500ms acceptable, >500ms investigate
- **Session Efficiency**: >90% excellent, 70-90% good, <70% optimization needed

**Red Flag Indicators:**
```typescript
// Monitoring patterns that indicate immediate attention needed
Rapid-fire calls: >3 calls to same endpoint within 5 seconds
Mount redundancy: Multiple calls on component mount  
Focus redundancy: Calls triggered by window focus events
Polling inefficiency: Fixed intervals regardless of context
Cascade failures: One failed request triggering multiple retries
```

### **🛠️ React Query Optimization Guidelines**

**Cache Configuration Best Practices:**
```typescript
// Tool pages (image-gen, TTS)
staleTime: 5 * 60 * 1000,     // 5 minutes
gcTime: 10 * 60 * 1000,       // 10 minutes
refetchOnWindowFocus: false,   // Prevent unnecessary refetches

// Data-heavy pages (DAM, dashboard)  
staleTime: 2 * 60 * 1000,     // 2 minutes
gcTime: 5 * 60 * 1000,        // 5 minutes
refetchOnWindowFocus: true,    // Keep data fresh

// Real-time data (notifications, live updates)
staleTime: 30 * 1000,         // 30 seconds
gcTime: 2 * 60 * 1000,        // 2 minutes  
refetchInterval: 10 * 1000,    // 10 second polling
```

**Query Optimization Patterns:**
```typescript
// ✅ DO: Combine related data in single queries
const { generations, stats } = useSharedGenerations();

// ❌ DON'T: Make separate calls for related data
const generations = useGenerations();
const stats = useGenerationStats();

// ✅ DO: Conditional queries for lazy loading
useInfiniteGenerations({}, { enabled: panelVisible });

// ❌ DON'T: Always fetch data regardless of need
useInfiniteGenerations(); // Always runs
```

---

## ⚡ **Component Performance Heuristics**

### **🎯 Render Optimization Thresholds**

**Render Count Guidelines:**
```typescript
✅ <5 renders per user action: Excellent performance
⚠️ 5-10 renders: Consider memoization optimizations
❌ >10 renders: Immediate optimization required
🚨 Cascading renders: Component architecture needs review
```

**Memory Usage Patterns:**
```typescript
Image/media apps: <50MB excellent, 50-150MB monitor, >150MB optimize
Data-heavy apps: <100MB excellent, 100-250MB monitor, >250MB optimize  
Simple apps: <25MB excellent, 25-75MB monitor, >75MB optimize
Mobile contexts: Reduce all thresholds by 50%
```

### **🧠 Memoization Decision Framework**

**When to Use React.memo:**
```typescript
✅ Apply when:
- Component renders frequently (>5 times per user action)
- Props are stable or rarely change
- Component has expensive render logic
- Component is used in lists or repeated contexts

⚠️ Consider when:
- Component has simple render logic
- Props change frequently
- Parent optimization might be more effective

❌ Avoid when:
- Component only renders once or rarely
- Props always change (shallow comparison fails)
- Memoization overhead exceeds render cost
```

**When to Use useMemo/useCallback:**
```typescript
✅ High Priority:
- Expensive calculations (>10ms)
- Complex object/array transformations
- API call preparations
- Event handlers passed to optimized children

⚠️ Medium Priority:
- Simple calculations that run frequently
- Object/array creations in render
- Callback functions for non-optimized components

❌ Low Priority:
- Primitive value calculations
- One-time computations
- Rarely called functions
```

### **📱 Large Dataset Performance**

**Virtual Scrolling Thresholds:**
```typescript
Implementation Required:
✅ >100 items: Consider virtual scrolling
⚠️ >500 items: Virtual scrolling recommended  
❌ >1000 items: Virtual scrolling mandatory
🚨 >5000 items: Advanced optimization strategies needed
```

**Memory Growth Monitoring:**
```typescript
Acceptable Growth Patterns:
✅ Linear growth up to 100 items
⚠️ Sublinear growth 100-1000 items
❌ Linear growth beyond 1000 items
🚨 Exponential growth at any scale
```

---

## 🖼️ **Image & Asset Optimization Heuristics**

### **🎯 Loading Performance Thresholds**

**Perceived Loading Times:**
```typescript
✅ <100ms: Instant (cached/optimized images)
✅ <300ms: Immediate (small thumbnails)
⚠️ <1s: Acceptable (full-size images)
❌ >1s: Needs optimization (progressive loading)
🚨 >3s: Critical (user abandonment risk)
```

**Image Format Decision Tree:**
```typescript
// Format selection based on context and browser support
WebP Support Available:
  ✅ Use WebP for photos (20-35% smaller)
  ✅ Use WebP for graphics with gradients
  ⚠️ Fallback to JPEG for complex photos
  ⚠️ Fallback to PNG for transparency

Legacy Browser Support:
  ✅ JPEG for photos (universal support)
  ✅ PNG for graphics with transparency
  ❌ Avoid raw formats (TIFF, BMP)
  ✅ SVG for simple icons and logos
```

### **📊 Progressive Loading Strategy**

**Implementation Priority:**
```typescript
High Priority (Immediate):
- Image placeholders (blur-to-sharp)
- Lazy loading for off-screen content
- Error state handling with fallbacks
- Loading animations for perceived performance

Medium Priority (Next Sprint):
- WebP format optimization with fallbacks
- Responsive images (srcSet) for different screen sizes
- CDN integration for global performance
- Smart preloading based on user behavior

Low Priority (Future):
- Advanced compression algorithms
- Client-side image processing
- Adaptive quality based on connection speed
- Machine learning-based preloading
```

---

## 🚨 **Performance Monitoring & Alerting**

### **🎯 Monitoring Thresholds**

**Real-Time Alerts (Immediate Action):**
```typescript
Network:
- Redundancy rate >25%
- Response time >2 seconds consistently
- Cache hit rate <50%
- Failed requests >10% of total

Memory:
- Growth >100MB in single session
- No garbage collection in 5 minutes
- Memory usage >500MB total
- Continuous growth pattern detected

Component:
- >20 renders per user action
- Render time >100ms consistently
- Memory leaks in component unmount
- Cascading re-render patterns
```

**Weekly Review Metrics (Trend Analysis):**
```typescript
Performance Trends:
- Average session efficiency trends
- Memory usage patterns over time
- Cache performance degradation
- User experience metric changes

Optimization Opportunities:
- New redundant call patterns
- Component performance regressions
- Emerging optimization opportunities
- User behavior pattern changes
```

### **🛠️ Built-in Monitoring Tools**

**Available Monitoring Infrastructure:**
```typescript
// Network monitoring
GenericNetworkMonitor: 
  - Tracks redundancy, session efficiency, call patterns
  - Real-time analysis and reporting
  - Custom alerting thresholds

// Performance monitoring  
PerformanceMonitor:
  - Memory usage tracking
  - Render count monitoring
  - Cache hit rate analysis
  - Component performance metrics

// Interactive testing
Performance Test Page:
  - Real-time performance validation
  - Configurable test scenarios
  - Memory and network stress testing
  - User experience simulation
```

**Monitoring Best Practices:**
```typescript
✅ DO:
- Establish baseline metrics before optimization
- Monitor trends over absolute values
- Use production-like data for testing
- Track user-facing metrics (perceived performance)
- Document optimization decisions and results

❌ DON'T:
- Optimize based on single data points
- Ignore user experience metrics
- Over-optimize rarely used features
- Skip monitoring after optimization
- Make assumptions without measurement
```

---

## 🎯 **Optimization Priority Framework**

### **🚨 High Priority (Immediate Action Required)**

**User-Blocking Issues:**
```typescript
Network Performance:
- >5 calls on simple pages
- Redundancy rate >20%
- Response times >1 second consistently
- Cache hit rate <50%

Component Performance:
- >20 renders per user action  
- Memory growth >100MB in single session
- Browser freezing or unresponsiveness
- Mobile performance degradation

Image/Asset Performance:
- Load times >3 seconds
- Failed image loads >10%
- No progressive loading on slow connections
- Poor mobile image performance
```

### **⚠️ Medium Priority (Plan for Next Sprint)**

**Performance Optimization Opportunities:**
```typescript
Network Optimization:
- 3-5 calls on tool pages
- Redundancy rate 10-20%
- Memory usage 50-150MB
- Occasional slow responses (500ms-1s)

Component Efficiency:
- 5-15 renders per user action
- Missing memoization on expensive components
- Large dataset performance (100-1000 items)
- Suboptimal state management patterns

Asset Loading:
- Load times 1-3 seconds
- Basic loading states without progression
- Missing WebP optimization
- No preloading strategies
```

### **✅ Low Priority (Monitor & Plan)**

**Continuous Improvement:**
```typescript
Fine-Tuning Opportunities:
- 1-2 calls on simple pages (already good)
- Redundancy rate <10% (maintain)
- Memory usage <50MB (optimize for mobile)
- Consistent fast responses (maintain)

Enhancement Projects:
- Advanced caching strategies
- Predictive preloading
- Machine learning optimizations
- Advanced compression techniques
```

---

## 📋 **Optimization Decision Checklist**

### **Before Optimizing:**
```typescript
✅ Measure current performance with monitoring tools
✅ Identify user impact and business priority
✅ Establish clear success metrics
✅ Consider development time vs. performance gain
✅ Check if issue affects multiple areas
✅ Validate with real user data when possible
```

### **During Optimization:**
```typescript
✅ Make incremental changes and measure impact
✅ Test across different devices and connections
✅ Validate that optimizations don't break functionality
✅ Document changes and decision rationale
✅ Monitor for unexpected side effects
✅ Compare before/after metrics
```

### **After Optimization:**
```typescript
✅ Verify improvements in production environment
✅ Monitor for regression in subsequent releases
✅ Update team on patterns and learnings
✅ Document successful optimization strategies
✅ Plan maintenance and monitoring strategies
✅ Share knowledge across similar features
```

---

## 🔧 **Integration with Existing Tools**

### **Monitoring Integration:**
- Use `GenericNetworkMonitor` for network analysis
- Leverage `PerformanceMonitor` for component tracking
- Utilize Performance Test Page for validation
- Integrate with existing React Query DevTools

### **Development Workflow:**
- Include performance checks in PR reviews
- Run performance tests before major releases
- Monitor production metrics weekly
- Update optimization guidelines based on learnings

### **Team Collaboration:**
- Share monitoring insights in team meetings
- Document optimization decisions in PR descriptions
- Create performance improvement tickets based on monitoring
- Regular performance review sessions

---

*This document should be reviewed and updated monthly based on new patterns, tools, and optimization learnings.*