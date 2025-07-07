# Bundle Analysis Command

## Description
Analyze webpack bundles, identify optimization opportunities, and reduce bundle size.

## Usage
`/bundle-analyze [target]`

## Parameters
- `target` (optional): Analysis focus ('size', 'dependencies', 'routes', 'all'). Defaults to 'all'.

## Instructions
You are a bundle optimization expert for this Next.js 15 application with Turbopack.

**Analysis Commands:**
```bash
# Generate bundle analysis
pnpm run analyze

# Build production bundle
pnpm run build

# Check bundle sizes
npx @next/bundle-analyzer

# Dependency analysis
npm ls --depth=0
npx depcheck
```

**Analysis Areas:**

### 1. Bundle Size Analysis
- **Total bundle size**: Target <1MB for initial load
- **Route-based chunks**: Individual page bundle sizes
- **Shared chunks**: Common code splitting efficiency
- **Static assets**: Images, fonts, icons optimization
- **Third-party libraries**: Largest dependencies

### 2. Dependency Analysis
- **Unused dependencies**: Dead code elimination
- **Duplicate dependencies**: Version conflicts
- **Heavy libraries**: Large packages impact
- **Tree shaking**: Unused code elimination
- **Dynamic imports**: Code splitting opportunities

### 3. Code Splitting Analysis
- **Route-level splitting**: Page-based chunks
- **Component-level splitting**: Lazy loading opportunities
- **Library splitting**: Vendor chunk optimization
- **Critical path**: Above-the-fold prioritization

### 4. Asset Optimization
- **Image optimization**: Next.js Image component usage
- **Font optimization**: Next.js Font loading
- **CSS optimization**: Tailwind purging, critical CSS
- **JavaScript minification**: Terser optimization
- **Compression**: Gzip/Brotli analysis

**Optimization Strategies:**

### 🎯 Bundle Size Targets:
```
Initial Load:
- First Load JS: <130KB (target: <100KB)
- Runtime JS: <30KB
- Framework: <45KB

Page Bundles:
- Average page: <50KB
- Heavy pages (DAM): <100KB
- Simple pages: <20KB

Assets:
- Images: WebP format, optimized sizes
- Fonts: WOFF2, preloaded critical fonts
- Icons: SVG sprites or icon fonts
```

### ✅ Optimization Techniques:

#### Dynamic Imports:
```typescript
// Heavy components
const ChatbotWidget = lazy(() => import('./ChatbotWidget'));
const ImageGenerator = lazy(() => import('./ImageGenerator'));
const FileViewer = lazy(() => import('./FileViewer'));

// Heavy libraries
const ReactPDF = lazy(() => import('react-pdf'));
const Chart = lazy(() => import('react-chartjs-2'));
```

#### Library Optimization:
```typescript
// Bundle-friendly imports
import { debounce } from 'lodash/debounce'; // ✅ Specific import
import debounce from 'lodash.debounce'; // ✅ Individual package

// Avoid full library imports
import _ from 'lodash'; // ❌ Entire library
import * as lodash from 'lodash'; // ❌ Entire library
```

#### Next.js Optimization:
```typescript
// Image optimization
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // Only for above-fold images
  placeholder="blur"
/>

// Font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});
```

#### Tailwind Optimization:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    safelist: ['bg-red-500', 'text-green-600'], // Dynamic classes
  }
};
```

### 🔍 Analysis Tools Integration:

#### Webpack Bundle Analyzer:
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  experimental: {
    turbo: true,
  },
});
```

#### Bundle Size Monitoring:
```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "bundle-size": "npm run build && npx bundlesize"
  },
  "bundlesize": [
    {
      "path": ".next/static/js/*.js",
      "maxSize": "130kb"
    }
  ]
}
```

**Heavy Dependencies to Check:**
- Moment.js → Date-fns (smaller alternative)
- Lodash → Native methods or specific imports
- Ant Design → Tree-shakable alternatives
- Chart.js → Lightweight chart libraries
- PDF.js → Lazy-loaded PDF components
- Rich text editors → Minimal alternatives

**Analysis Process:**
1. **Generate Report**: Run bundle analyzer
2. **Identify Issues**: Large bundles, unused code
3. **Optimization Plan**: Prioritize high-impact changes
4. **Implementation**: Apply optimizations incrementally
5. **Measurement**: Compare before/after metrics

**Output Format:**
```
## Bundle Analysis Results

### 📊 Current Bundle Metrics:
- **Total Size**: [size] MB
- **First Load JS**: [size] KB (target: <130KB)
- **Largest Bundles**: 
  - [route]: [size] KB
  - [route]: [size] KB
- **Largest Dependencies**:
  - [package]: [size] KB
  - [package]: [size] KB

### 🎯 Optimization Opportunities:

#### High Impact:
- **[Package/Route]**: [current-size] → [optimized-size] (-[X]%)
  - Method: [dynamic import/tree shaking/alternative]
  - Impact: [performance improvement]

#### Medium Impact:
- **[Area]**: [optimization description]
  - Effort: [low/medium/high]
  - Savings: [estimated size reduction]

#### Low Impact:
- **[Enhancement]**: [minor optimization]

### 🚀 Recommended Actions:

#### Immediate (Quick Wins):
1. **Dynamic Import**: [specific heavy component]
2. **Library Replace**: [heavy package] → [lighter alternative]
3. **Asset Optimization**: [specific assets to optimize]

#### Short-term:
1. **Code Splitting**: [routes to split]
2. **Tree Shaking**: [packages to optimize]
3. **Image Optimization**: [images to convert/compress]

#### Long-term:
1. **Architecture**: [structural improvements]
2. **Monitoring**: [bundle size CI checks]
3. **Performance Budget**: [size limits enforcement]

### 📈 Expected Improvements:
- Bundle Size: -[X]% reduction
- Load Time: -[X]ms improvement  
- Lighthouse Score: +[X] points
- Core Web Vitals: [specific improvements]

### 🛠️ Implementation Plan:
1. [Priority]: [Specific task with timeline]
2. [Priority]: [Specific task with timeline]
3. [Priority]: [Specific task with timeline]
```

**Always measure performance impact, not just bundle size reduction.**