import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile problematic ES modules
  transpilePackages: ['@tanstack/react-table', '@tanstack/table-core'],
  
  // Turbopack configuration (moved from experimental.turbo as it's now stable)
  turbopack: {
    // Resolve aliases for better module resolution
    resolveAlias: {
      '@': './lib',
      '@/components': './components',
      '@/app': './app',
      '@/types': './types',
      '@/hooks': './hooks',
      '@/context': './context',
    },
  },
  // Exclude server-side packages from client bundle (moved from experimental)
  serverExternalPackages: [
    '@crawlee/cheerio',
    '@crawlee/utils',
    '@crawlee/http',
    'cheerio',
    'keyv',
    '@keyv/redis',
    '@keyv/mongo',
    '@keyv/sqlite',
    '@keyv/postgres',
    '@keyv/mysql',
    '@keyv/etcd',
    '@keyv/offline',
    '@keyv/tiered',
    'got',
    'got-scraping',
    'puppeteer',
    'puppeteer-core',
    // Additional packages that should stay server-side
    'elevenlabs',
    'openai',
    'replicate',
    'tiktoken',
    // Node.js built-in modules
    'fs',
    'path',
    'crypto',
    'os',
    'stream',
    'util',
    'events',
    'buffer',
    'url',
    'querystring',
    'http',
    'https',
    'net',
    'tls',
    'child_process',
    'cluster',
    'worker_threads',
    'zlib',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: 10485760, // 10MB in bytes
    },
    // Enable optimizations for DDD architecture
    optimizePackageImports: [
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      // Disable @tanstack/react-table optimization as it conflicts with transpilePackages
      // '@tanstack/react-table',
      'lucide-react',
      'framer-motion',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allow images from Supabase storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zzapbmpqkqeqsrqwttzd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Webpack configuration - only applies during production builds
  // Turbopack handles development builds with its own optimized bundler
  webpack: (config, { isServer, dev }) => {
    // Skip webpack modifications when using Turbopack in development
    if (dev && process.env.NODE_ENV !== 'production') {
      return config;
    }

    // Enable WebAssembly support for tiktoken
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle WebAssembly modules
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    if (isServer) {
      // Handle keyv dynamic imports on server side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@keyv/redis': false,
        '@keyv/mongo': false,
        '@keyv/sqlite': false,
        '@keyv/postgres': false,
        '@keyv/mysql': false,
        '@keyv/etcd': false,
        '@keyv/offline': false,
        '@keyv/tiered': false,
      };
      
      // Externalize keyv adapters to prevent bundling issues
      config.externals = [
        ...(config.externals || []),
        '@keyv/redis',
        '@keyv/mongo', 
        '@keyv/sqlite',
        '@keyv/postgres',
        '@keyv/mysql',
        '@keyv/etcd',
        '@keyv/offline',
        '@keyv/tiered'
      ];
    } else {
      // Client-side webpack configuration
      // Exclude Node.js built-in modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        util: false,
        events: false,
        buffer: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        child_process: false,
        cluster: false,
        worker_threads: false,
        zlib: false,
      };
      
      // Optimize chunk splitting for production
      if (process.env.NODE_ENV === 'production') {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        };
      }
    }
    
    return config;
  },
  
  // Performance optimizations for both dev and prod
  poweredByHeader: false,
  generateEtags: false,
  
  // Note: Bundle optimization strategy:
  // 1. Turbopack in development (faster builds, HMR optimization)
  // 2. Webpack with advanced splitting in production (optimized bundles)
  // 3. package.json sideEffects configuration (tree shaking)
  // 4. React lazy() API (component-level code splitting)
  // 5. Next.js automatic code splitting (page-level optimization)
};

// Only apply bundle analyzer in production builds to avoid Turbopack conflicts
export default process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;
